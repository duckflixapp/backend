import { watch } from 'chokidar';
import { EventEmitter } from 'node:events';
import { logger } from '../../shared/configs/logger';
import type { Subprocess } from 'bun';
import fs from 'node:fs/promises';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

export class SessionTask {
    private process: Subprocess | null = null;
    private readySegments = new Set<number>();
    private lastSegment: null | number = null;
    private notifier = new EventEmitter();
    private watcher;
    private inactivityTimer: Timer | null = null;

    constructor(
        private readonly session: string,
        private readonly originalPath: string,
        private readonly outputPath: string,
        private readonly segmentDuration: number,
        private height: number,
        private onCleanup: () => unknown
    ) {
        mkdirSync(this.outputPath, { recursive: true });
        this.watcher = watch(this.outputPath, {
            persistent: true,
            atomic: true,
            awaitWriteFinish: true,
            ignored: (file) => {
                const ext = path.extname(file);
                return ext !== '' && ext !== '.ts';
            },
        });
        this.watcher.on('add', (filePath) => {
            const match = filePath.match(/seg-(\d+)\.ts/);

            if (!match) return;
            const segmentNum = parseInt(match[1]!);
            logger.debug({ segmentNum }, 'New Segment');
            this.readySegments.add(segmentNum);
            this.notifier.emit(`ready_${segmentNum}`);
        });
    }

    public async prepareSegment(segment: number, options?: { height: number }) {
        this.resetInactivityTimer();

        if (options?.height && options.height != this.height) {
            logger.debug({ from: this.height, to: options.height }, 'height changed');
            await this.stopReset();
            this.height = options.height;
        }

        if (this.readySegments.has(segment)) {
            this.lastSegment = segment;
            this.clearOldest();
            return;
        }

        const readyArray = this.readySegments.values().toArray();
        const oldestSegment = readyArray.length > 0 ? Math.min(...readyArray) : null;
        const needsRestart =
            !this.process || this.lastSegment == null || segment > this.lastSegment + 2 || (oldestSegment && segment < oldestSegment);

        if (needsRestart) {
            await this.stopReset();
            this.transcode(segment); // if not close then start transcoding again
        }

        this.lastSegment = segment;
        this.clearOldest();

        return new Promise<void>((resolve, reject) => {
            logger.debug({ segment }, 'Waiting for segment');

            const listener = () => {
                this.notifier.removeListener(`ready_${segment}`, listener);
                logger.debug({ segment }, 'Segment ready');
                clearTimeout(timeout);
                setTimeout(resolve, 500);
            };

            const timeout = setTimeout(() => {
                this.notifier.removeListener(`ready_${segment}`, listener);
                reject();
            }, 25_000); // 25s is more than enough for fail request

            this.notifier.on(`ready_${segment}`, listener);
        });
    }

    private async transcode(segment: number) {
        const startTime = segment * this.segmentDuration;
        const args = [
            'ffmpeg',
            '-ss',
            startTime.toString(),
            '-i',
            this.originalPath,
            '-copyts',
            '-start_at_zero',
            '-map',
            '0:v:0',
            '-map',
            '0:a:0?',
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-tune',
            'zerolatency',
            '-vf',
            `scale=-2:${this.height}`,
            '-c:a',
            'aac',
            '-ac',
            '2',
            '-ar',
            '44100',
            '-f',
            'hls',
            '-hls_time',
            this.segmentDuration.toString(),
            '-start_number',
            segment.toString(),
            '-hls_segment_filename',
            path.join(this.outputPath, 'seg-%d.ts'),
            '-hls_flags',
            'temp_file+independent_segments',
            '-hls_list_size',
            '0',
            path.join(this.outputPath, 'index.m3u8'),
        ];

        try {
            this.process = Bun.spawn(args, {
                stdout: 'inherit',
                stderr: 'pipe',
                onExit: (proc, exitCode, signalCode) => {
                    if (exitCode !== 0 && exitCode !== null) {
                        logger.error({ exitCode, signalCode, session: this.session }, 'FFmpeg process exited with error');
                        this.notifier.emit(`error_${segment}`, new Error(`FFmpeg exited with code ${exitCode}`));
                    }
                },
            });

            logger.debug({ segment, session: this.session }, 'FFmpeg started');
            await this.process.exited;
            logger.debug({ segment, session: this.session, statusCode: this.process.exitCode }, 'FFmpeg exited');
            this.process = null;
        } catch (err) {
            logger.error({ err, session: this.session }, 'Failed to spawn FFmpeg');
            throw err;
        }
    }

    private async clearOldest() {
        const KEEP_BUFFER = 1;
        if (this.lastSegment === null) return;

        const segmentsToRemove = this.readySegments.values().filter((seg) => seg < this.lastSegment! - KEEP_BUFFER);
        for (const seg of segmentsToRemove) {
            try {
                await fs.unlink(`${this.outputPath}/seg-${seg}.ts`);
                this.readySegments.delete(seg);
            } catch (e) {
                logger.error({ e }, 'Old segment not deleted');
            }
        }
    }

    private resetInactivityTimer() {
        if (this.inactivityTimer) clearTimeout(this.inactivityTimer);

        this.inactivityTimer = setTimeout(() => {
            logger.debug({ session: this.session }, 'Session inactive, killing FFmpeg');
            this.destroy();
        }, 60_000);
    }

    private async stopReset() {
        if (this.process) this.process.kill();
        this.readySegments.clear();
        this.lastSegment = null;
        try {
            const files = await fs.readdir(this.outputPath);
            await Promise.all(files.map((file) => fs.unlink(`${this.outputPath}/${file}`)));
        } catch {
            await fs.mkdir(this.outputPath, { recursive: true });
        }
    }

    public destroy() {
        this.watcher.removeAllListeners();
        this.stopReset();
        this.onCleanup();
    }
}

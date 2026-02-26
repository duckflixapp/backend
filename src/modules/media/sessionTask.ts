import { EventEmitter } from 'node:events';
import { logger } from '../../shared/configs/logger';
import type { Subprocess } from 'bun';
import fs from 'node:fs/promises';
import path from 'node:path';
import { taskRegistry } from '../../shared/utils/taskRegistry';

export class SessionTask {
    private process: Subprocess | null = null;
    private readySegments = new Set<number>();
    private lastSegment: null | number = null;
    private notifier = new EventEmitter();
    private inactivityTimer: Timer | null = null;

    constructor(
        private readonly session: string,
        private readonly originalPath: string,
        private readonly outputPath: string,
        private readonly segmentDuration: number,
        private height: number,
        private readonly totalSegments: number,
        private onCleanup: () => unknown
    ) {}

    public async initalize(): Promise<void> {
        await fs.mkdir(this.outputPath, { recursive: true });
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
            await this.clearOldest();
            return;
        }

        const readyArray = this.readySegments.values().toArray();
        const oldestSegment = readyArray.length > 0 ? Math.min(...readyArray) : null;
        const needsRestart =
            !this.process ||
            this.lastSegment == null ||
            segment > this.lastSegment + 2 ||
            (oldestSegment !== null && segment < oldestSegment);

        if (needsRestart) {
            await this.stopReset();
            this.transcode(segment);
        }

        this.lastSegment = segment;
        this.clearOldest();

        return new Promise<void>((resolve, reject) => {
            let timeout: NodeJS.Timeout;

            if (this.notifier.listenerCount(`ready_${segment}`) > 0) {
                const listener = () => {
                    clearTimeout(timeout);
                    resolve();
                };
                timeout = setTimeout(() => reject(), 30_000);
                this.notifier.once(`ready_${segment}`, listener); // once umesto on
                return;
            }

            logger.debug({ segment }, 'Waiting for segment');

            const listener = () => {
                this.notifier.removeListener(`ready_${segment}`, listener);
                logger.debug({ segment }, 'Segment ready');
                clearTimeout(timeout);
                setTimeout(resolve, 500);
            };

            timeout = setTimeout(() => {
                this.notifier.removeListener(`ready_${segment}`, listener);
                reject();
            }, 20_000); // 20s is more than enough for fail request

            this.notifier.once(`ready_${segment}`, listener);
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
            '-output_ts_offset',
            startTime.toString(),
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
            '-force_key_frames',
            `expr:gte(t,${startTime})`,
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
            const proc = (this.process = Bun.spawn(args, {
                stdout: 'inherit',
                stderr: 'pipe',
                onExit: (proc, exitCode, signalCode) => {
                    if (exitCode !== 0 && exitCode !== null) {
                        logger.error({ exitCode, signalCode, session: this.session }, 'FFmpeg process exited with error');
                        this.notifier.emit(`error_${segment}`, new Error(`FFmpeg exited with code ${exitCode}`));
                    }
                },
            }));
            this.process = proc;

            const reader = proc.stderr.getReader();
            const decoder = new TextDecoder();
            (async () => {
                let pendingSegment: number | null = null;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const text = decoder.decode(value);

                    const segMatch = text.match(/Opening '.*?seg-(\d+)\.ts\.tmp' for writing/);
                    if (segMatch) {
                        pendingSegment = parseInt(segMatch[1]!);
                    }

                    if (text.includes('index.m3u8.tmp') && pendingSegment !== null) {
                        const segNum = pendingSegment;
                        pendingSegment = null;
                        logger.debug({ segNum }, 'New Segment');
                        this.readySegments.add(segNum);
                        this.notifier.emit(`ready_${segNum}`);
                    }
                }
            })();

            logger.debug({ segment, session: this.session }, 'FFmpeg started');
            taskRegistry.pauseAll();
            await proc.exited;
            taskRegistry.resumeAll();
            logger.debug({ segment, session: this.session, statusCode: proc.exitCode }, 'FFmpeg exited');
            this.process = null;

            logger.debug({ code: proc.exitCode }, 'FFmpeg finished');
        } catch (err) {
            logger.error({ err, session: this.session }, 'Failed to spawn FFmpeg');
            throw err;
        }
    }

    private async clearOldest() {
        const KEEP_BUFFER = 12; // aprx 72s
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
        }, 45_000);
    }

    private async stopReset() {
        if (this.process) {
            this.process.kill(9);
            await this.process.exited.catch(() => {});
            this.process = null;
        }

        this.readySegments.clear();
        this.lastSegment = null;
    }

    public async destroy() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        await this.stopReset();
        this.onCleanup();

        try {
            const files = await fs.readdir(this.outputPath);
            await Promise.all(files.map((file) => fs.unlink(`${this.outputPath}/${file}`)));
        } catch {
            await fs.mkdir(this.outputPath, { recursive: true });
        }
    }
}

import path from 'node:path';
import fs from 'node:fs/promises';
import { eq } from 'drizzle-orm';
import { db } from '../../../shared/configs/db';
import { movies, movieVersions } from '../../../shared/schema';
import { InvalidVideoFileError } from '../movies.errors';
import { randomUUID } from 'node:crypto';
import { ffprobe } from '../../../shared/video';
import { createMovieStorageKey, startProcessing } from '../movies.processor';
import { getMimeTypeFromFormat } from '../../../shared/utils/ffmpeg';
import { paths } from '../../../shared/configs/path.config';
import { AppError } from '../../../shared/errors';
import { notifyJobStatus } from '../../../shared/services/notification.service';
import { computeHash, downloadSubtitles } from '../services/subs.service';
import { systemSettings } from '../../../shared/services/system.service';
import { logger } from '../../../shared/configs/logger';

export const processVideoWorkflow = async (data: {
    userId: string;
    movieId: string;
    tempPath: string;
    originalName: string;
    fileSize: number;
    imdbId: string | null;
}): Promise<void> => {
    let metadata, videoStream;
    try {
        metadata = await ffprobe(data.tempPath).catch(async () => {
            throw new InvalidVideoFileError();
        });

        const formatName = metadata.format.format_name;
        if (formatName?.includes('image') || formatName === 'png' || formatName === 'mjpeg') throw new InvalidVideoFileError();

        videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        if (!videoStream) throw new InvalidVideoFileError();

        const duration = Number(metadata.format.duration) || 0;
        if (duration < 2) throw new InvalidVideoFileError();
    } catch (err) {
        await fs.unlink(data.tempPath).catch(() => {});
        throw err;
    }

    const originalWidth = Number(videoStream.width) || 0;
    const originalHeight = Number(videoStream.height) || 0;
    const duration = Math.round(Number(metadata.format.duration) || 0);
    const mimeType = getMimeTypeFromFormat(metadata.format.format_name);

    // create path for movie version
    const fileExt = path.extname(data.originalName);
    const originalId = randomUUID();
    const storageKey = createMovieStorageKey(data.movieId, originalId, 'index' + fileExt);
    const finalPath = path.join(paths.storage, storageKey);

    try {
        await fs.mkdir(path.dirname(finalPath), { recursive: true });
        await fs.rename(data.tempPath, finalPath);

        // add version and set status to ready on movie
        await db.transaction(async (tx) => {
            await tx.insert(movieVersions).values({
                id: originalId,
                movieId: data.movieId,
                width: originalWidth,
                height: originalHeight,
                isOriginal: true,
                storageKey: storageKey,
                fileSize: data.fileSize,
                mimeType,
                status: 'ready',
            });
            await tx.update(movies).set({ duration, status: 'ready' }).where(eq(movies.id, data.movieId));
        });
        notifyJobStatus(data.userId, 'completed', `Upload completed`, `Movie uploaded successfully`, data.movieId).catch(() => {});
    } catch (e) {
        await fs.unlink(finalPath).catch(() => {});
        throw new AppError('Video could not be saved in database', { cause: e });
    }

    // Subtitles
    if (data.imdbId) {
        const movieHash = await computeHash(finalPath);
        downloadSubtitles({ movieId: data.movieId, imdbId: data.imdbId, movieHash }).catch((err) => {
            logger.error(
                {
                    err,
                    movieId: data.movieId,
                    imdbId: data.imdbId,
                    context: 'subtitles_service',
                },
                'Failed to download subtitles in background'
            );
        });
    }

    // Resolutions
    const tasksToRun = new Set<number>();

    const sysSettings = await systemSettings.get();
    const processingPreference = sysSettings.features.autoTranscoding;
    if (processingPreference === 'compatibility' || processingPreference === 'smart') {
        if (mimeType != 'video/mp4') {
            // process original resolution if not mp4
            tasksToRun.add(originalHeight);

            const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
            const codecName = videoStream?.codec_name;
            if (codecName === 'h265' || codecName === 'hevc') {
                if (originalHeight > 1080) tasksToRun.add(1080);
                else if (originalHeight > 720) tasksToRun.add(720);
            }
        }

        if (processingPreference === 'smart') {
            // process tasks for lower resolutions -> enable (auto) only on strong cpus
            if (originalHeight > 1080) tasksToRun.add(1080);
            else if (originalHeight > 720) tasksToRun.add(720);
        }
    }

    if (tasksToRun.size > 0) startProcessing(data.movieId, Array.from(tasksToRun), paths.storage, finalPath);
};

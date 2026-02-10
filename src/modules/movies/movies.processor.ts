import path from 'node:path';
import fs from 'node:fs/promises';
import { db } from '../../shared/db';
import { movieVersions, type MovieVersion, type NewMovieVersion } from '../../shared/schema';
import { ffprobe, transcode } from '../../shared/utils/videoProcessor';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { VideoProcessingError } from './movies.errors';

export const createMovieStorageKey = (movieId: string, versionId: string, ext: string) => `movies/${movieId}/${versionId}${ext}`;

export const startProcessing = async (movieId: string, tasksToRun: number[], storageFolder: string, originalPath: string) => {
    // insert tasks into db
    const tasksVersions = tasksToRun.map<NewMovieVersion>((height) => {
        const versionId = randomUUID();
        const storageKey = createMovieStorageKey(movieId, versionId, '.mp4');
        return {
            id: versionId,
            movieId: movieId,
            width: null,
            height: height,
            isOriginal: false,
            storageKey,
            fileSize: 0,
            mimeType: 'video/mp4',
            status: 'processing' as const,
        };
    });
    const processingTasks = await db.insert(movieVersions).values(tasksVersions).returning();

    // process one by one
    for (const task of processingTasks) await processTask(task, originalPath, path.join(storageFolder, task.storageKey));
};

const processTask = async (task: MovieVersion, originalPath: string, outputPath: string) => {
    try {
        // transcode process
        await transcode(originalPath, outputPath, task.height);
        const stats = await fs.stat(outputPath);

        // additional check for actual resolution
        const meta = await ffprobe(outputPath);
        const stream = meta.streams.find((s) => s.codec_type === 'video');
        const width = stream?.width ?? 0,
            height = stream?.height ?? task.height;

        // save resolution to database
        await db
            .update(movieVersions)
            .set({
                width,
                height,
                fileSize: stats.size,
                status: 'ready',
            })
            .where(eq(movieVersions.id, task.id));
    } catch (error) {
        const processingError = new VideoProcessingError(error instanceof Error ? error.message : 'Unknown transcode error');

        console.error(`[MovieID: ${task.movieId}] ${processingError.message}`);

        await db.update(movieVersions).set({ status: 'error' }).where(eq(movieVersions.id, task.id));
    }
};

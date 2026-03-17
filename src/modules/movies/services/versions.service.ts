import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../../shared/configs/db';
import { movies, movieVersions } from '../../../shared/schema';
import { MovieNotFoundError, OriginalMovieVersionNotFoundError } from '../movies.errors';
import { AppError } from '../../../shared/errors';
import path from 'node:path';
import { paths } from '../../../shared/configs/path.config';
import { startProcessing } from '../movies.processor';
import fs from 'node:fs/promises';
import { toMovieVersionDTO } from '../../../shared/mappers/movies.mapper';
import { taskHandler } from '../../../shared/utils/taskHandler';
import { taskRegistry } from '../../../shared/utils/taskRegistry';

export const getAllMovieVersions = async (movieId: string) => {
    const results = await db.query.movieVersions.findMany({
        where: eq(movieVersions.movieId, movieId),
    });

    return results.map(toMovieVersionDTO);
};

export const addMovieVersion = async (movieId: string, height: number) => {
    const result = await db.query.movies.findFirst({
        where: eq(movies.id, movieId),
        with: {
            versions: {
                where: and(eq(movieVersions.isOriginal, true), eq(movieVersions.status, 'ready')),
            },
        },
    });

    if (!result) throw new MovieNotFoundError();

    const original = result.versions.find((v) => v.isOriginal);
    if (!original) throw new OriginalMovieVersionNotFoundError();

    if (height > original.height) throw new AppError('Height exceeds original resolution', { statusCode: 400 });

    const existing = await db.query.movieVersions.findFirst({
        where: and(
            eq(movieVersions.movieId, movieId),
            eq(movieVersions.height, height),
            eq(movieVersions.mimeType, 'application/x-mpegURL'),
            inArray(movieVersions.status, ['ready', 'processing', 'waiting'])
        ),
    });
    if (existing) throw new AppError('Version already exists', { statusCode: 409 });

    const originalPath = path.resolve(paths.storage, original.storageKey);

    await startProcessing(movieId, [height], paths.storage, originalPath);
};

export const deleteMovieVersion = async (movieId: string, versionId: string) => {
    const version = await db.query.movieVersions.findFirst({
        where: and(eq(movieVersions.id, versionId), eq(movieVersions.movieId, movieId)),
    });

    if (!version) throw new AppError('Version not found', { statusCode: 404 });
    if (version.isOriginal) throw new AppError('Cannot delete original version', { statusCode: 400 });

    let sucess = true;
    if (version.status === 'waiting') {
        // remove from queue
        sucess = taskHandler.cancel(versionId);
    }
    if (version.status === 'processing') {
        // cancel task
        sucess = await taskRegistry.kill(versionId);
    }

    const dirPath = path.dirname(path.resolve(paths.storage, version.storageKey));
    await fs.rm(dirPath, { recursive: true, force: true }).catch(() => {});
    await db.delete(movieVersions).where(eq(movieVersions.id, versionId));
    return sucess;
};

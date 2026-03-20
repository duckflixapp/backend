import { inArray } from 'drizzle-orm';
import { db } from '../../shared/configs/db';
import { movies, videoVersions } from '../../shared/schema';
import { logger } from '../../shared/configs/logger';
import { notifyJobStatus } from '../../shared/services/notification.service';

export const recoverZombieProcesses = async (systemUserId: string) => {
    const zombies = await db.query.videoVersions.findMany({
        where: inArray(videoVersions.status, ['processing', 'waiting']),
        with: { movie: { columns: { id: true, title: true } } },
    });

    if (zombies.length === 0) return;

    logger.warn({ count: zombies.length }, 'Found zombie movie versions, recovering...');

    await db
        .update(videoVersions)
        .set({ status: 'error' })
        .where(
            inArray(
                videoVersions.id,
                zombies.map((v) => v.id)
            )
        );

    for (const version of zombies) {
        try {
            await notifyJobStatus(
                systemUserId,
                'error',
                'Processing failed',
                `Version ${version.height}p of "${version.movie?.title ?? version.movieId}" was interrupted and marked as error.`,
                version.movieId,
                version.id
            ).catch(() => {});

            logger.warn(
                {
                    versionId: version.id,
                    movieId: version.movieId,
                    height: version.height,
                    status: version.status,
                },
                'Zombie version recovered'
            );
        } catch (err) {
            logger.error({ err, versionId: version.id }, 'Failed to recover zombie version');
        }
    }
};

export const recoverZombieMovies = async (systemUserId: string) => {
    const zombies = await db.query.movies.findMany({
        where: inArray(movies.status, ['processing', 'downloading']),
    });

    if (zombies.length === 0) return;

    logger.warn({ count: zombies.length }, 'Found zombie movie, recovering...');

    await db
        .update(movies)
        .set({ status: 'error' })
        .where(
            inArray(
                movies.id,
                zombies.map((v) => v.id)
            )
        );

    for (const movie of zombies) {
        try {
            await notifyJobStatus(
                systemUserId,
                'error',
                'Processing failed',
                `Movie "${movie.title}" was interrupted and marked as error.`,
                movie.id
            ).catch(() => {});

            logger.warn(
                {
                    movieId: movie.id,
                    status: movie.status,
                },
                'Zombie movie recovered'
            );
        } catch (err) {
            logger.error({ err, movieId: movie.id }, 'Failed to recover zombie version');
        }
    }
};

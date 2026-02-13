import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { movies, movieVersions } from '../../shared/schema';

export const handleWorkflowError = async (movieId: string, error: unknown, context: 'movie' | 'torrent') => {
    await db.update(movies).set({ status: 'error' }).where(eq(movies.id, movieId));
    // notify user
    // handle better logging
    console.error(`[${context}] Error for movie ${movieId}:`, error);
};

export const handleProcessingError = async (movieVerId: string, error: unknown, context: 'transcode' | 'task') => {
    await db.update(movieVersions).set({ status: 'error' }).where(eq(movieVersions.id, movieVerId));
    // notify user
    // handle better logging
    console.error(`[${context}] Error for movie version ${movieVerId}:`, error);
};

export const handleMovieTask = (movieVerId: string, taskId: string, context: 'started' | 'completed') => {
    console.log(`[MovieTask] ${context} processing task: ${taskId}, movie ver. ${movieVerId}`);
};

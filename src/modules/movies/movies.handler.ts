import { eq } from 'drizzle-orm';
import { db } from '../../shared/db';
import { movies } from '../../shared/schema';

export const handleWorkflowError = async (movieId: string, error: unknown, context: 'movie' | 'torrent') => {
    await db.update(movies).set({ status: 'error' }).where(eq(movies.id, movieId));
    // notify user
    // handle better logging
    console.error(`[${context}] Error for movie ${movieId}:`, error);
};

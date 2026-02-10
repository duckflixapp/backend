import { z } from 'zod';

export const createMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255),
});

export const movieQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
});

export const movieParamsSchema = z.object({
    id: z.uuid('Invalid movie ID format'),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type MovieQueryInput = z.infer<typeof movieQuerySchema>;

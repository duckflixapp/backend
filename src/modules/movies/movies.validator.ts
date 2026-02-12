import { z } from 'zod';

export const createMovieSchema = z.object({
    magnet: z.preprocess(
        (val) => (val === '' ? null : val),
        z.string().max(5000, 'Magnet link is too long').startsWith('magnet:?', 'Invalid magnet link format').optional().nullable()
    ),
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    description: z.string().max(1000, 'Description is too long').optional().nullable(),
    releaseYear: z.coerce
        .number()
        .int()
        .min(1888, "Movies didn't exist then")
        .max(new Date().getFullYear() + 5, 'Year is too far in the future')
        .optional()
        .nullable(),

    bannerUrl: z.url('Invalid banner URL').max(1000).optional().nullable(),
    posterUrl: z.url('Invalid poster URL').max(1000).optional().nullable(),

    genreIds: z
        .preprocess(
            (val) => {
                if (typeof val === 'string') return [val];
                return val;
            },
            z.array(z.uuid('Invalid genre ID')).min(1, 'Select at least one genre').max(10)
        )
        .default([]),
});

export const movieQuerySchema = z.object({
    page: z.coerce.number().int().positive().max(10000, 'Page limit exceeded').default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().max(100, 'Search query too long').optional(),
});

export const movieParamsSchema = z.object({
    id: z.uuid('Invalid movie ID format'),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type MovieQueryInput = z.infer<typeof movieQuerySchema>;

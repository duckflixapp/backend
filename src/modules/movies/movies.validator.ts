import { z } from 'zod';

export const createMovieSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    description: z.string().max(1000, 'Description is too long').optional().nullable(),
    releaseYear: z.coerce
        .number()
        .int()
        .min(1888, "Movies didn't exist then")
        .max(new Date().getFullYear() + 5, 'Year is too far in the future')
        .optional()
        .nullable(),

    rating: z.coerce.number().min(0).max(10).multipleOf(0.1).default(0),
    bannerUrl: z.url('Invalid banner URL').optional().nullable(),
    posterUrl: z.url('Invalid poster URL').optional().nullable(),

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
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
});

export const movieParamsSchema = z.object({
    id: z.uuid('Invalid movie ID format'),
});

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type MovieQueryInput = z.infer<typeof movieQuerySchema>;

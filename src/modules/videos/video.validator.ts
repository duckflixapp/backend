import z from 'zod';

export const createVideoSchema = z.object({
    dbUrl: z.url('Invalid DB URL').max(1000).optional().nullable(),

    title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional().nullable(),
    overview: z.string().max(1000, 'Overview is too long').optional().nullable(),
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
        .optional()
        .default([]),
});

export type CreateVideoInput = z.infer<typeof createVideoSchema>;

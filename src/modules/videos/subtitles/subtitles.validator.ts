import z from 'zod';

export const videoParamsSchema = z.object({
    videoId: z.uuid('Invalid video ID'),
});

export const subtitleParamsSchema = videoParamsSchema.extend({
    subtitleId: z.uuid('Invalid subtitle ID'),
});

export const uploadBodySchema = z.object({
    language: z.string(),
});

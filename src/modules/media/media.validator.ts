import { z } from 'zod';

export const streamParamsSchema = z.object({
    versionId: z.uuid('Invalid video version ID format'),
    file: z.string().optional(),
});

export const liveMasterSchema = z.object({
    movieId: z.uuid('Invalid video version ID format'),
});

export const liveManifestSchema = z.object({
    movieId: z.uuid('Invalid video version ID format'),
    height: z.coerce.number(),
});

export const liveSegmentSchema = z.object({
    movieId: z.uuid('Invalid video version ID format'),
    height: z.coerce.number(),
    segmentName: z.string(),
});

export const sessionSchema = z.object({
    session: z.uuid(),
});

export const subtitleParamsSchema = z.object({
    subtitleId: z.uuid('Invalid video version ID format'),
});

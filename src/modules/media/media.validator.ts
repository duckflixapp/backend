import { z } from 'zod';

export const streamParamsSchema = z.object({
    versionId: z.uuid('Invalid video version ID format'),
    file: z.string().optional(),
});

export const liveMasterSchema = z.object({
    videoId: z.uuid('Invalid video ID format'),
});

export const liveManifestSchema = z.object({
    videoId: z.uuid('Invalid video ID format'),
    height: z.coerce.number(),
});

export const liveSegmentSchema = z.object({
    videoId: z.uuid('Invalid video ID format'),
    height: z.coerce.number(),
    segmentName: z.string(),
});

export const subtitleParamsSchema = z.object({
    subtitleId: z.uuid('Invalid subtitle ID format'),
});

export const authQuerySchema = z.object({
    session: z.uuid('Invalid session ID'),
});

export const createSessionBodySchema = z.object({
    videoId: z.uuid('Invalid video ID'),
});

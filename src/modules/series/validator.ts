import z, { uuid } from 'zod';

export const seriesParamSchema = z.object({
    seriesId: uuid('Invalid series ID'),
});

export const seasonParamSchema = z.object({
    seasonId: uuid('Invalid season ID'),
});

export const episodeParamSchema = z.object({
    episodeId: uuid('Invalid episode ID'),
});

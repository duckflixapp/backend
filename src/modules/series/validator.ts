import z, { uuid } from 'zod';

export const seriesParamSchema = z.object({
    seriesId: uuid('Invalid series ID'),
});

export const seasonParamSchema = seriesParamSchema.extend({
    seasonId: uuid('Invalid season ID'),
});

export const episodeParamSchema = seasonParamSchema.extend({
    episodeId: uuid('Invalid episode ID'),
});

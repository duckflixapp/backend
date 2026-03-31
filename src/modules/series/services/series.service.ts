import { db } from '@shared/configs/db';
import { AppError } from '@shared/errors';
import { toSeriesDTO } from '@shared/mappers/series.mapper';
import { series, seriesSeasons } from '@schema/series.schema';
import { eq, sql } from 'drizzle-orm';

export const getSeriesById = async (seriesId: string) => {
    const tvSeries = await db.query.series.findFirst({
        where: eq(series.id, seriesId),
        with: {
            genres: { with: { genre: true } },
            seasons: {
                extras: {
                    episodeCount: sql<number>`(
                        SELECT COUNT(*) FROM series_episodes WHERE series_episodes.season_id = ${seriesSeasons.id}
                    )`.as('episode_count'),
                },
            },
        },
    });

    if (!tvSeries) throw new AppError('Series not found', { statusCode: 404 });
    return toSeriesDTO(tvSeries);
};

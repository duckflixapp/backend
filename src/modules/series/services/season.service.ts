import { db } from '@shared/configs/db';
import { AppError } from '@shared/errors';
import { toSeasonDTO } from '@shared/mappers/series.mapper';
import { seriesSeasons } from '@schema/series.schema';
import { eq } from 'drizzle-orm';

export const getSeasonById = async (seasonId: string) => {
    const season = await db.query.seriesSeasons.findFirst({
        where: eq(seriesSeasons.id, seasonId),
        with: {
            episodes: true,
        },
    });

    if (!season) throw new AppError('Season not found', { statusCode: 404 });

    return toSeasonDTO(season);
};

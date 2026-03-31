import { db } from '@shared/configs/db';
import { AppError } from '@shared/errors';
import { toEpisodeDTO } from '@shared/mappers/series.mapper';
import { seriesEpisodes } from '@schema/series.schema';
import { eq } from 'drizzle-orm';

export const getEpisodeById = async (episodeId: string) => {
    const episode = await db.query.seriesEpisodes.findFirst({
        where: eq(seriesEpisodes.id, episodeId),
        with: {
            video: {
                with: {
                    versions: true,
                    uploader: true,
                    subtitles: true,
                },
            },
        },
    });

    if (!episode) throw new AppError('Episode not found', { statusCode: 404 });
    return toEpisodeDTO(episode);
};

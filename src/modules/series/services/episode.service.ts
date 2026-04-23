import { db } from '@shared/configs/db';
import { toEpisodeDTO } from '@shared/mappers/series.mapper';
import { seriesEpisodes } from '@schema/series.schema';
import { eq } from 'drizzle-orm';
import { SeasonEpisodeNotFound } from '../errors';
import { getEpisodeCastFromTMDBIds } from '@shared/services/metadata/providers/tmdb.provider';
import { logger } from '@shared/configs/logger';

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
            season: {
                with: {
                    series: true,
                },
            },
        },
    });

    if (!episode) throw new SeasonEpisodeNotFound();

    const cast =
        episode.tmdbId && episode.season.series.tmdbId
            ? await getEpisodeCastFromTMDBIds(episode.season.series.tmdbId, episode.season.seasonNumber, episode.episodeNumber).catch(
                  (err) => {
                      logger.warn(
                          {
                              err,
                              episodeId,
                              tmdbEpisodeId: episode.tmdbId,
                              tmdbSeriesId: episode.season.series.tmdbId,
                          },
                          'Failed to fetch TMDB episode cast'
                      );
                      return [];
                  }
              )
            : [];

    return {
        ...toEpisodeDTO(episode),
        cast,
    };
};

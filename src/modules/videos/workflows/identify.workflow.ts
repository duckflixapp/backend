import type { VideoMetadata } from '@shared/services/metadata/metadata.types';
import { identifyMovie } from './identify/movie.strategy';
import { identifyEpisode } from './identify/episode.strategy';
import { AppError } from '@shared/errors';
import type { VideoType } from '@duckflix/shared';
import { logger } from '@shared/configs/logger';

export const identifyVideoWorkflow = async (
    data: { filePath: string; fileName?: string; type?: VideoType },
    options = { checkHash: true }
): Promise<VideoMetadata | null> => {
    try {
        if (data.type === 'movie') return await identifyMovie(data.filePath, data.fileName, options.checkHash);
        if (data.type === 'episode') return await identifyEpisode(data.filePath, data.fileName);

        throw new AppError('Video type not supported');
    } catch (e) {
        logger.debug({ type: data.type, cause: e }, '[IdentifyVideo] Failed identification');
        return null;
    }
};

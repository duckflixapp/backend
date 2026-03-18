import path from 'node:path';
import { computeHash, subtitlesClient } from '../services/subs.service';
import { fillFromTMDBId, searchTMDB } from '../providers/tmdb.provider';
import type { VideoMetadata } from '../services/metadata.service';
import { logger } from '../../../shared/configs/logger';

export const identifyMovieWorkflow = async (data: { filePath: string }): Promise<VideoMetadata> => {
    // try to find through hash
    const movieHash = await computeHash(data.filePath);
    const hashResult = await checkMovieByHash(movieHash);
    logger.debug({ filePath: data.filePath, movieHash, hashResult }, '[IdentifyMovieWorkflow] Identify by movie hash');
    if (hashResult) return fillFromTMDBId(String(hashResult));

    // parse filename to find title
    const filename = path.basename(data.filePath);
    const parsedFilename = parseMovieFilename(filename);

    logger.debug({ filePath: data.filePath, parsedFilename }, '[IdentifyMovieWorkflow] Parsed movie data');

    const response = await searchTMDB(parsedFilename);
    logger.debug({ filePath: data.filePath, results: response.total_results }, '[IdentifyMovieWorkflow] TMDB Search');
    if (response.results[0]) return fillFromTMDBId(String(response.results[0].id));

    return { genreIds: [], imdbId: null, rating: null, ...parsedFilename };
};

const checkMovieByHash = async (movieHash: string): Promise<number | null> => {
    const [subtitle] = await subtitlesClient.getSubtitles({ movieHash, languages: ['en'] }, 0);
    if (!subtitle) return null;
    const tmdbId = subtitle.attributes.feature_details.tmdb_id;
    return tmdbId;
};

const parseMovieFilename = (filename: string): { title: string; releaseYear?: number } => {
    const name = path.parse(filename).name;

    const yearMatch = name.match(/^(.+?)[\.\s]+((?:19|20)\d{2})[\.\s]/);
    if (yearMatch && yearMatch[1] && yearMatch[2]) {
        return {
            title: yearMatch[1].replace(/\./g, ' ').trim(),
            releaseYear: parseInt(yearMatch[2]),
        };
    }

    const techTags = /[\.\s](2160p|1080p|720p|480p|BluRay|WEBRip|WEB-DL|HDTV|REMUX|x264|x265|HEVC|HDR)/i;
    const tagMatch = name.match(techTags);
    return {
        title: tagMatch ? name.slice(0, tagMatch.index).replace(/\./g, ' ').trim() : name.replace(/\./g, ' ').trim(),
        releaseYear: undefined,
    };
};

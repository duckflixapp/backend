import path from 'node:path';
import { computeHash, subtitlesClient } from '../services/subs.service';
import { fillFromTMDBId, searchTMDB } from '../providers/tmdb.provider';
import type { VideoMetadata } from '../services/metadata.service';
import { logger } from '../../../shared/configs/logger';

export const identifyVideoWorkflow = async (
    data: { filePath: string; fileName?: string; type?: 'movie' },
    options = { checkHash: true }
): Promise<VideoMetadata> => {
    // try to find through hash
    if (options.checkHash) {
        const movieHash = await computeHash(data.filePath);
        const hashResult = await checkMovieByHash(movieHash);
        logger.debug({ filePath: data.filePath, movieHash, hashResult }, '[IdentifyMovieWorkflow] Identify by movie hash');
        if (hashResult) return fillFromTMDBId(String(hashResult));
    }

    // parse filename to find title
    const filename = data.fileName ?? path.basename(data.filePath);
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

/**
 * Parses a movie filename into title and release year.
 *
 * Supports common release formats:
 * - `Movie.Title.2026.1080p.WEBRip.x265.mkv`
 * - `Movie Title (2026) [1080p] [WEBRip] [YTS].mkv`
 * - `Movie.Title.BluRay.mkv` (no year)
 *
 * Strategy:
 * 1. Uses release year as a separator between title and technical tags
 * 2. Falls back to known tech tags (1080p, BluRay, x265...) if no year found
 * 3. If neither found, returns the full filename as title
 */
const parseMovieFilename = (filename: string): { title: string; releaseYear?: number } => {
    const name = path.parse(filename).name;

    // try year for separator
    const yearMatch = name.match(/^(.+?)[\.\s\(]+((?:19|20)\d{2})[\.\s\)]/);
    if (yearMatch && yearMatch[1] && yearMatch[2]) {
        return {
            title: yearMatch[1].replace(/\./g, ' ').trim(),
            releaseYear: parseInt(yearMatch[2]),
        };
    }

    // separate by tags
    const techTags = /[\.\s\[](2160p|1080p|720p|480p|BluRay|WEBRip|WEB-DL|HDTV|REMUX|x264|x265|HEVC|HDR)/i;
    const tagMatch = name.match(techTags);
    return {
        title: tagMatch
            ? name
                  .slice(0, tagMatch.index)
                  .replace(/[\.\[\]]/g, ' ')
                  .trim()
            : name.replace(/[\.\[\]]/g, ' ').trim(),
        releaseYear: undefined,
    };
};

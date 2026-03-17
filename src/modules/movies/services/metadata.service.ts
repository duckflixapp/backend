import { AppError } from '../../../shared/errors';
import { fillFromTMDBUrl } from '../providers/tmdb.provider';
import { isVideoMetadata } from '../validators/metadata.validator';
import type { CreateMovieInput, UpdateMovieInput } from '../validators/movies.validator';

export interface VideoMetadata {
    title: string;
    overview?: string | null;
    releaseYear?: number | null;
    posterUrl?: string | null;
    bannerUrl?: string | null;
    genreIds: string[];
    imdbId: string | null;
    rating: number | null;
}

export const fillFromUrl = async (url: string): Promise<Partial<VideoMetadata> | null> => {
    if (url.includes('themoviedb.org/movie')) return await fillFromTMDBUrl(url);
    return null;
};

export const enrichMetadata = async (url: string | undefined | null, manualData: CreateMovieInput): Promise<VideoMetadata> => {
    let externalData: Partial<VideoMetadata> = {};

    if (url) {
        const partialData = await fillFromUrl(url);
        if (partialData) externalData = partialData;
    }

    const enrichedMetadata = {
        title: externalData.title || manualData.title || '',
        overview: externalData.overview || manualData.overview || '',
        releaseYear: externalData.releaseYear || manualData.releaseYear || new Date().getFullYear(),
        posterUrl: externalData.posterUrl || manualData.posterUrl,
        bannerUrl: externalData.bannerUrl || manualData.bannerUrl,
        genreIds: externalData.genreIds?.length ? externalData.genreIds : manualData.genreIds || [],
        imdbId: externalData.imdbId ?? null,
        rating: externalData.rating ?? null,
    };

    if (!isVideoMetadata(enrichedMetadata)) throw new AppError('Failed to enrich metadata', { statusCode: 500 });

    return enrichedMetadata;
};

export const enrichUpdateMetadata = async (
    url: string | undefined | null,
    manualData: UpdateMovieInput
): Promise<Partial<VideoMetadata>> => {
    let externalData: Partial<VideoMetadata> = {};

    if (url) {
        const partialData = await fillFromUrl(url);
        if (partialData) externalData = partialData;
    }

    const result: Partial<VideoMetadata> = {};

    const title = externalData.title || manualData.title;
    if (title !== undefined) result.title = title ?? undefined;

    const overview = externalData.overview || manualData.overview;
    if (overview !== undefined) result.overview = overview;

    const releaseYear = externalData.releaseYear || manualData.releaseYear;
    if (releaseYear !== undefined) result.releaseYear = releaseYear;

    const posterUrl = externalData.posterUrl || manualData.posterUrl;
    if (posterUrl !== undefined) result.posterUrl = posterUrl;

    const bannerUrl = externalData.bannerUrl || manualData.bannerUrl;
    if (bannerUrl !== undefined) result.bannerUrl = bannerUrl;

    if (manualData.genreIds !== undefined) {
        result.genreIds = externalData.genreIds?.length ? externalData.genreIds : manualData.genreIds;
    }

    if (externalData.imdbId) result.imdbId = externalData.imdbId;
    if (externalData.rating) result.rating = externalData.rating;

    return result;
};

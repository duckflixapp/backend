import { parseIdFromUrl } from './providers/imdb.provider';
import { fillFromIMDBId, fillFromTMDBUrl } from './providers/tmdb.provider';
import type { CreateVideoInput } from '../../modules/videos/video.validator';

export interface MovieMetadata {
    type: 'movie';
    title: string;
    overview?: string | null;
    releaseYear?: number | null;
    posterUrl?: string | null;
    bannerUrl?: string | null;
    genres: string[];
    imdbId: string | null;
    rating: number | null;
}

// export interface TVEpisodeMetadata {
//     type: 'episode';
//     name: string;
//     overview?: string | null;
//     airDate: string;
//     rating: number | null;
//     stillUrl?: string | null;
//     seasonId: string;
// }

export type VideoMetadata = MovieMetadata; // | TVEpisodeMetadata;

export const fillFromUrl = async (url: string): Promise<Partial<MovieMetadata> | null> => {
    if (url.includes('themoviedb.org/movie')) return await fillFromTMDBUrl(url);
    if (url.includes('imdb.com/title')) {
        const imdbId = parseIdFromUrl(url);
        return await fillFromIMDBId(imdbId);
    }
    return null;
};

type MetadataEnricher<TInput, TOutput extends VideoMetadata> = (url: string | undefined | null, manual: TInput) => Promise<TOutput | null>;
export type VideoType = keyof typeof metadataEnrichers;

const enrichMovieMetadata: MetadataEnricher<CreateVideoInput, MovieMetadata> = async (url, manual) => {
    let external: Partial<MovieMetadata> = {};

    if (url) {
        const partial = await fillFromUrl(url);
        if (partial) external = partial;
    }

    if (!external.title && !manual.title) return null;

    const metadata: MovieMetadata = {
        type: 'movie',
        title: external.title || manual.title!,
        overview: external.overview ?? manual.overview ?? '',
        releaseYear: external.releaseYear ?? manual.releaseYear ?? new Date().getFullYear(),
        posterUrl: external.posterUrl ?? manual.posterUrl,
        bannerUrl: external.bannerUrl ?? manual.bannerUrl,
        genres: external.genres?.length ? external.genres : (manual.genreIds ?? []),
        imdbId: external.imdbId ?? null,
        rating: external.rating ?? null,
    };

    return metadata;
};

export const metadataEnrichers = {
    movie: enrichMovieMetadata,
    // episode: enrichEpisodeMetadata,
} as const;

// export const enrichMetadata = async (url: string | undefined | null, manualData: CreateVideoInput): Promise<VideoMetadata | null> => {
//     let externalData: Partial<VideoMetadata> = {};

//     if (url) {
//         const partialData = await fillFromUrl(url);
//         if (partialData) externalData = partialData;
//     }

//     if (!externalData.title && !manualData.title) return null;

//     const enrichedMetadata = {
//         title: externalData.title || manualData.title || null,
//         overview: externalData.overview || manualData.overview || '',
//         releaseYear: externalData.releaseYear || manualData.releaseYear || new Date().getFullYear(),
//         posterUrl: externalData.posterUrl || manualData.posterUrl,
//         bannerUrl: externalData.bannerUrl || manualData.bannerUrl,
//         genreIds: externalData.genreIds?.length ? externalData.genreIds : manualData.genreIds || [],
//         imdbId: externalData.imdbId ?? null,
//         rating: externalData.rating ?? null,
//     };

//     if (!isVideoMetadata(enrichedMetadata)) throw new AppError('Failed to enrich metadata', { statusCode: 500 });

//     return enrichedMetadata;
// };

// export const enrichUpdateMetadata = async (
//     url: string | undefined | null,
//     manualData: UpdateMovieInput
// ): Promise<Partial<VideoMetadata>> => {
//     let externalData: Partial<VideoMetadata> = {};

//     if (url) {
//         const partialData = await fillFromUrl(url);
//         if (partialData) externalData = partialData;
//     }

//     const result: Partial<VideoMetadata> = {};

//     const title = externalData.title || manualData.title;
//     if (title !== undefined) result.title = title ?? undefined;

//     const overview = externalData.overview || manualData.overview;
//     if (overview !== undefined) result.overview = overview;

//     const releaseYear = externalData.releaseYear || manualData.releaseYear;
//     if (releaseYear !== undefined) result.releaseYear = releaseYear;

//     const posterUrl = externalData.posterUrl || manualData.posterUrl;
//     if (posterUrl !== undefined) result.posterUrl = posterUrl;

//     const bannerUrl = externalData.bannerUrl || manualData.bannerUrl;
//     if (bannerUrl !== undefined) result.bannerUrl = bannerUrl;

//     if (manualData.genreIds !== undefined) {
//         result.genreIds = externalData.genreIds?.length ? externalData.genreIds : manualData.genreIds;
//     }

//     if (externalData.imdbId) result.imdbId = externalData.imdbId;
//     if (externalData.rating) result.rating = externalData.rating;

//     return result;
// };

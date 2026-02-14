import { AppError } from '../../../shared/errors';
import { getTmdbMovieDetails } from '../../../shared/lib/tmdb';
import { getGenreIds } from '../services/genres.service';
import type { VideoMetadata } from '../services/metadata.service';

export const fillFromTMDBUrl = async (url: string): Promise<Partial<VideoMetadata>> => {
    const id = parseIdFromUrl(url);
    if (!id) throw new AppError('Invalid tmdb url', 400);

    const raw = await getTmdbMovieDetails(id);

    const rawGenres = raw.genres.map(({ name }) => name.toLowerCase());
    const genreIds = await getGenreIds(rawGenres);

    return {
        title: raw.title || raw.original_title,
        overview: raw.overview,
        releaseYear: new Date(raw.release_date).getFullYear(),
        posterUrl: raw.poster_path ? `https://image.tmdb.org/t/p/w500${raw.poster_path}` : undefined,
        bannerUrl: raw.backdrop_path ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}` : undefined,
        genreIds,
    };
};

const parseIdFromUrl = (url: string): string | null => {
    const movieMatch = url.match(/themoviedb\.org\/movie\/(\d+)/);
    if (movieMatch) return movieMatch[1] ?? null;
    return null;
};

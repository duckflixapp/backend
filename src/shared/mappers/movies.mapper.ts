import { toUserMinDTO } from './user.mapper';
import type { Genre, Movie, VideoVersion, Subtitle } from '../schema';
import type { MovieDetailedDTO, MovieDTO, MovieMinDTO, MovieVersionDTO, SubtitleDTO, UserRole } from '@duckflix/shared';

export const toMovieMinDTO = (movie: Movie): MovieMinDTO => ({
    id: movie.id,
    title: movie.title,
    bannerUrl: movie.bannerUrl,
    posterUrl: movie.posterUrl,
    rating: movie.rating,
    releaseYear: movie.releaseYear,
    duration: movie.duration,
    status: movie.status,
    createdAt: movie.createdAt,
});

export const toMovieDTO = (movie: Movie & { genres: { genre: Genre }[] }): MovieDTO => ({
    ...toMovieMinDTO(movie),
    genres: movie.genres.map((g) => toGenreDTO(g.genre)),
});

export const toGenreDTO = (genre: Genre) => ({
    id: genre.id,
    name: genre.name,
});

export const toSubtitleDTO = (s: Subtitle): SubtitleDTO => ({
    id: s.id,
    movieId: s.movieId,
    language: s.language,
    subtitleUrl: `${BASE_URL}/media/subtitle/${s.id}`,
    createdAt: s.createdAt,
});

export const toMovieDetailedDTO = (
    movie: Movie & {
        genres: { genre: Genre }[];
        versions: VideoVersion[];
        uploader: { id: string; name: string; role: UserRole; system: boolean } | null;
        subtitles: Subtitle[];
    },
    inUserLibrary?: boolean | null
): MovieDetailedDTO => ({
    ...toMovieDTO(movie),
    description: movie.description,
    versions: movie.versions.map(toMovieVersionDTO),
    generatedVersions: null,
    subtitles: movie.subtitles.map(toSubtitleDTO),
    uploader: movie.uploader ? toUserMinDTO(movie.uploader) : null,
    inUserLibrary: inUserLibrary ?? null,
});

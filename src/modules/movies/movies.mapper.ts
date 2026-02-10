import type { Movie, MovieVersion } from '../../shared/schema';
import type { MovieDetailedDTO, MovieDTO, MovieVersionDTO } from '@duckflix/shared';

const BASE_URL = process.env.BASE_URL ?? '';

export const toMovieVersionDTO = (v: MovieVersion): MovieVersionDTO => ({
    id: v.id,
    height: v.height,
    width: v.width,
    status: v.status,
    fileSize: v.fileSize,
    mimeType: v.mimeType,
    streamUrl: `${BASE_URL}/media/stream/${v.id}`,
});

export const toMovieDTO = (movie: Movie): MovieDTO => ({
    id: movie.id,
    title: movie.title,
    status: movie.status,
    createdAt: movie.createdAt?.toISOString() ?? new Date().toISOString(),
});

export const toMovieDetailedDTO = (movie: Movie & { versions: MovieVersion[] }): MovieDetailedDTO => ({
    ...toMovieDTO(movie),
    versions: movie.versions.map(toMovieVersionDTO),
});

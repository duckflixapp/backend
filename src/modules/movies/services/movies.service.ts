import { and, asc, count, desc, eq, exists, ilike, inArray, isNotNull, sql } from 'drizzle-orm';
import { db } from '../../../shared/configs/db';
import { genres, libraries, libraryItems, movies, moviesToGenres, movieVersions } from '../../../shared/schema';
import { MovieNotCreatedError, MovieNotFoundError } from '../movies.errors';
import type { MovieDetailedDTO, MovieDTO, MovieVersionDTO, PaginatedResponse } from '@duckflix/shared';
import { toMovieDetailedDTO, toMovieDTO } from '../../../shared/mappers/movies.mapper';
import { AppError } from '../../../shared/errors';
import type { VideoMetadata } from './metadata.service';
import { env } from '../../../env';
import path from 'node:path';
import { paths } from '../../../shared/configs/path.config';
import fs from 'node:fs/promises';
import { taskRegistry } from '../../../shared/utils/taskRegistry';
import { taskHandler } from '../../../shared/utils/taskHandler';

export const initiateUpload = async (
    data: {
        userId: string;
        status: 'downloading' | 'processing';
    } & VideoMetadata
): Promise<MovieDTO> => {
    const [dbMovie] = await db
        .insert(movies)
        .values({
            title: data.title,
            description: data.overview,
            bannerUrl: data.bannerUrl,
            posterUrl: data.posterUrl,
            rating: data.rating?.toString() ?? null,
            releaseYear: data.releaseYear,
            duration: null,
            status: data.status,
            uploaderId: data.userId,
        })
        .returning();
    if (!dbMovie) throw new MovieNotCreatedError();

    if (data.genreIds && data.genreIds.length > 0) {
        const values = data.genreIds.map((genreId) => ({ movieId: dbMovie.id, genreId: genreId }));
        await db
            .insert(moviesToGenres)
            .values(values)
            .catch(async (err) => {
                throw new AppError('Database insert failed for movie genres', { statusCode: 500, cause: err });
            });
    }

    const selectedGenres =
        data.genreIds && data.genreIds.length > 0 ? await db.select().from(genres).where(inArray(genres.id, data.genreIds)) : [];
    return toMovieDTO({
        ...dbMovie,
        genres: selectedGenres.map((genre) => ({ genre })),
    });
};

const getOrderBy = (orderBy: string | null) => {
    switch (orderBy) {
        case 'oldest':
            return [asc(movies.createdAt)];
        case 'rating':
            return [sql`cast(${movies.rating} as decimal) DESC NULLS LAST`, desc(movies.createdAt)];
        case 'title':
            return [asc(movies.title)];
        case 'newest':
        default:
            return [desc(movies.createdAt)];
    }
};

export const getMovies = async (options: {
    page: number;
    limit: number;
    search?: string;
    orderBy?: string;
    genreId?: string;
}): Promise<PaginatedResponse<MovieDTO>> => {
    const offset = (options.page - 1) * options.limit;

    const searchFilter = options.search ? ilike(movies.title, `%${options.search}%`) : null;
    const readyFilter = eq(movies.status, 'ready');
    const genreFilter = options.genreId
        ? exists(
              db
                  .select()
                  .from(moviesToGenres)
                  .where(and(eq(moviesToGenres.movieId, movies.id), eq(moviesToGenres.genreId, options.genreId)))
          )
        : null;

    const conditions = [searchFilter, readyFilter, genreFilter];
    const filters = and(...conditions.filter((cond) => cond != null));

    const orderBy = getOrderBy(options.orderBy ?? null);

    const [totalResult, results] = await Promise.all([
        db.select({ value: count() }).from(movies).where(filters),
        db.query.movies.findMany({
            where: filters,
            limit: options.limit,
            offset: offset,
            orderBy,
            with: {
                genres: {
                    with: {
                        genre: true,
                    },
                },
            },
        }),
    ]);

    if (!totalResult[0]) throw new Error('DB Count() failed');

    const totalItems = Number(totalResult[0].value);

    return {
        data: results.map(toMovieDTO),
        meta: {
            totalItems,
            itemCount: results.length,
            itemsPerPage: options.limit,
            totalPages: Math.ceil(totalItems / options.limit),
            currentPage: options.page,
        },
    };
};

export const deleteMovieById = async (id: string) => {
    const movie = await db.query.movies.findFirst({
        where: eq(movies.id, id),
        with: { versions: true },
    });

    if (!movie) throw new MovieNotFoundError();

    if (movie.status === 'processing') throw new AppError('Wait until video is processed', { statusCode: 403 });

    if (movie.status === 'downloading') throw new AppError('Wait until video is downloaded', { statusCode: 403 });

    for (const version of movie.versions) {
        if (version.status === 'processing') {
            await taskRegistry.kill(version.id).catch(() => {});
        } else if (version.status === 'waiting') {
            taskHandler.cancel(version.id);
        }
    }

    const movieDir = path.resolve(paths.storage, 'movies', movie.id);
    await fs.rm(movieDir, { recursive: true, force: true }).catch(() => {});
    await db.delete(movies).where(eq(movies.id, id));
};

export const updateMovieById = async (id: string, data: Partial<VideoMetadata>): Promise<MovieDetailedDTO> => {
    await db.transaction(async (tx) => {
        const modified = await tx
            .update(movies)
            .set({
                title: data.title,
                description: data.overview,
                releaseYear: data.releaseYear,
                rating: data.rating?.toString() ?? null,
                bannerUrl: data.bannerUrl,
                posterUrl: data.posterUrl,
            })
            .where(eq(movies.id, id));

        if (modified.rowCount === 0) throw new MovieNotFoundError();

        if (data.genreIds) {
            await tx.delete(moviesToGenres).where(eq(moviesToGenres.movieId, id));

            if (data.genreIds.length > 0) {
                const values = data.genreIds.map((genreId) => ({ movieId: id, genreId: genreId }));
                await tx
                    .insert(moviesToGenres)
                    .values(values)
                    .catch(async (err) => {
                        throw new AppError('Database insert failed for movie genres', { statusCode: 500, cause: err });
                    });
            }
        }
    });

    return getMovieById(id);
};

export const getMovieById = async (id: string, options: { userId: string | null } = { userId: null }): Promise<MovieDetailedDTO> => {
    const result = await db.query.movies.findFirst({
        where: eq(movies.id, id),
        with: {
            genres: {
                with: {
                    genre: true,
                },
            },
            versions: true,
            subtitles: true,
            uploader: {
                columns: {
                    id: true,
                    name: true,
                    role: true,
                    system: true,
                },
            },
        },
    });

    if (!result) throw new MovieNotFoundError();

    let inLibrary: boolean | null = null;
    if (options.userId) {
        const [libraryCount] = await db
            .select({ value: count() })
            .from(libraries)
            .leftJoin(libraryItems, eq(libraries.id, libraryItems.libraryId))
            .where(and(eq(libraries.type, 'watchlist'), eq(libraries.userId, options.userId), eq(libraryItems.movieId, id)));

        inLibrary = !!libraryCount?.value && libraryCount?.value > 0;
    }

    const dto = toMovieDetailedDTO(result, inLibrary);

    const original = result.versions.find((v) => v.isOriginal);
    if (original && result.duration) {
        const livePresets = [2160, 1440, 1080, 720, 480];
        const existingHeights = result.versions.filter((v) => v.status === 'ready').map((v) => v.height);

        const liveVersions: MovieVersionDTO[] = livePresets
            .filter((h) => h <= original.height && !existingHeights.includes(h))
            .map((h) => ({
                id: `live-${h}`,
                height: h,
                width: Math.round(((original.width ?? 1920) * h) / original.height / 2) * 2,
                mimeType: 'application/x-mpegURL',
                streamUrl: `${env.BASE_URL}/media/live/${id}/${h}/index.m3u8`,
                status: 'ready',
                isOriginal: false,
                fileSize: null,
            }));

        dto.generatedVersions = liveVersions;
    }

    return dto;
};

export const getFeatured = async (options: { userId: string | null } = { userId: null }) => {
    // internal logic to find featured movie...
    const featured = await db.query.movies.findFirst({
        where: and(eq(movies.status, 'ready'), isNotNull(movies.bannerUrl)),
        with: {
            versions: {
                where: and(eq(movieVersions.status, 'ready'), eq(movieVersions.isOriginal, true)),
                columns: { id: true },
            },
        },
        orderBy: desc(movies.createdAt),
    });

    if (!featured) return null;

    return getMovieById(featured.id, options);
};

export const recordWatchStart = async (_movieId: string, _userId: string) => {};

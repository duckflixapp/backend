import type { VideoMinDTO } from '@duckflix/shared';
import { db } from '../../shared/configs/db';
import { movies, moviesToGenres, videos, type Movie, type Video } from '../../shared/schema';
import type { VideoMetadata } from './services/metadata.service';
import { VideoNotCreatedError } from './video.errors';
import { AppError } from '../../shared/errors';
import { toVideoMinDTO } from '../../shared/mappers/video.mapper';

export const initiateUpload = async (
    type: 'movie',
    data: {
        userId: string;
        status: 'downloading' | 'processing';
    } & VideoMetadata
): Promise<VideoMinDTO> => {
    const [video, object] = await db.transaction<[Video, Movie | null]>(async (tx) => {
        const [dbVideo] = await tx
            .insert(videos)
            .values({
                duration: null,
                status: data.status,
                uploaderId: data.userId,
            })
            .returning();

        if (!dbVideo) throw new VideoNotCreatedError();

        let object: Movie | null = null;
        if (type == 'movie') {
            const [movie] = await tx
                .insert(movies)
                .values({
                    videoId: dbVideo.id,
                    title: data.title,
                    overview: data.overview,
                    bannerUrl: data.bannerUrl,
                    posterUrl: data.posterUrl,
                    rating: data.rating?.toString() ?? null,
                    releaseYear: data.releaseYear,
                })
                .returning();

            if (!movie) throw new VideoNotCreatedError();
            object = movie;
        }
        return [dbVideo, object];
    });

    if (type == 'movie') await uploadMovie({ movieId: object!.id, genreIds: data.genreIds });

    return toVideoMinDTO(video);
};

const uploadMovie = async (data: { movieId: string; genreIds: string[] }) => {
    if (data.genreIds && data.genreIds.length > 0) {
        const values = data.genreIds.map((genreId) => ({ movieId: data.movieId, genreId: genreId }));
        await db
            .insert(moviesToGenres)
            .values(values)
            .catch(async (err) => {
                throw new AppError('Database insert failed for movie genres', { statusCode: 500, cause: err });
            });
    }
};

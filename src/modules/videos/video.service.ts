import type { VideoMinDTO } from '@duckflix/shared';
import { db, type Transaction } from '../../shared/configs/db';
import { movies, moviesToGenres, videos, type Video } from '../../shared/schema';
import type { MovieMetadata, VideoMetadata } from '../../shared/metadata/metadata.service';
import { VideoNotCreatedError } from './video.errors';
import { toVideoMinDTO } from '../../shared/mappers/video.mapper';
import { getGenreIds } from '../movies/services/genres.service';

type UploadHandler<T extends VideoMetadata> = (tx: Transaction, video: Video, data: T) => Promise<void>;

const movieUploadHandler: UploadHandler<MovieMetadata> = async (tx, video, data) => {
    const [movie] = await tx
        .insert(movies)
        .values({
            videoId: video.id,
            title: data.title,
            overview: data.overview,
            bannerUrl: data.bannerUrl,
            posterUrl: data.posterUrl,
            rating: data.rating?.toString() ?? null,
            releaseYear: data.releaseYear,
        })
        .returning();

    if (!movie) throw new VideoNotCreatedError();

    const genreIds = await getGenreIds(data.genres);
    if (genreIds.length > 0) {
        await tx.insert(moviesToGenres).values(genreIds.map((genreId) => ({ movieId: movie.id, genreId })));
    }
};

const uploadHandlers: {
    [K in VideoMetadata['type']]: UploadHandler<Extract<VideoMetadata, { type: K }>>;
} = {
    movie: movieUploadHandler,
};

export const initiateUpload = async (
    metadata: VideoMetadata,
    data: { userId: string; status: 'downloading' | 'processing' }
): Promise<VideoMinDTO> => {
    const video = await db.transaction(async (tx) => {
        const [dbVideo] = await tx
            .insert(videos)
            .values({
                duration: null,
                status: data.status,
                uploaderId: data.userId,
            })
            .returning();

        if (!dbVideo) throw new VideoNotCreatedError();

        const handler = uploadHandlers[metadata.type] as UploadHandler<typeof metadata>;
        await handler(tx, dbVideo, metadata);

        return dbVideo;
    });

    return toVideoMinDTO(video);
};

import { db } from '@shared/configs/db';
import { subtitles, videos } from '@schema/video.schema';
import { and, eq } from 'drizzle-orm';
import { AppError } from '@shared/errors';
import fs from 'fs/promises';
import path from 'path';
import { paths } from '@shared/configs/path.config';
import { VideoNotFoundError } from '../video.errors';
import { randomUUID } from 'crypto';
import { convertSRTtoVTT } from '@shared/utils/ffmpeg';
import { toSubtitleDTO, toSubtitleSearchResultDTO } from '@shared/mappers/video.mapper';
import { ffprobe } from '@shared/services/video';
import ISO6391 from 'iso-639-1';
import { subtitlesClient } from '../services/subs.service';
import type { SubtitleSearchResultDTO } from '@duckflixapp/shared';

const ALLOWED_FORMATS = ['srt', 'webvtt'];
const ALLOWED_FORMATS_STRING = ALLOWED_FORMATS.join(',');

export const saveSubtitle = async (data: { videoId: string; tempPath: string; originalName: string; language: string }) => {
    if (!ISO6391.validate(data.language)) throw new AppError('Language code must be in ISO-639-1 standard.', { statusCode: 400 });

    const storageKey = `subtitles/${randomUUID()}.vtt`;
    const finalPath = path.join(paths.storage, storageKey);

    const metadata = await ffprobe(data.tempPath).catch(async () => {
        throw new AppError('Invalid subtitle file', { statusCode: 400 });
    });

    const formatName = metadata.format.format_name;

    if (!ALLOWED_FORMATS.includes(formatName))
        throw new AppError('Invalid subtitle format. Allowed formats: ' + ALLOWED_FORMATS_STRING, { statusCode: 400 });

    try {
        const [video] = await db.select().from(videos).where(eq(videos.id, data.videoId)).limit(1);
        if (!video) throw new VideoNotFoundError();
        await fs.mkdir(path.dirname(finalPath), { recursive: true });

        if (formatName === 'webvtt') {
            await fs.rename(data.tempPath, finalPath).catch(async (e) => {
                if (e.code !== 'EXDEV') throw e; // cross-device
                await fs.copyFile(data.tempPath, finalPath);
                await fs.unlink(data.tempPath).catch(() => {});
            });
        } else if (formatName === 'srt') {
            const stream = (await fs.open(data.tempPath)).readableWebStream();
            await convertSRTtoVTT(stream, finalPath);
            await fs.unlink(data.tempPath).catch(() => {});
        }

        const [subtitle] = await db
            .insert(subtitles)
            .values({ videoId: data.videoId, language: data.language, externalId: null, storageKey })
            .returning();
        if (!subtitle) throw new AppError('Failed inserting subtitle');

        return toSubtitleDTO(subtitle);
    } catch (e) {
        await fs.unlink(data.tempPath).catch(() => {});
        await fs.unlink(finalPath).catch(() => {});
        if (e instanceof AppError) throw e;
        throw new AppError('Saving subtitle failed', { cause: e });
    }
};

export const searchOpenSubtitles = async (data: { videoId: string; language: string }) => {
    if (!ISO6391.validate(data.language)) throw new AppError('Language code must be in ISO-639-1 standard.', { statusCode: 400 });

    const video = await db.query.videos.findFirst({
        where: eq(videos.id, data.videoId),
        with: {
            episode: true,
            movie: true,
        },
    });
    if (!video) throw new VideoNotFoundError();

    const subtitlesRaw = await subtitlesClient.getSubtitles({
        type: video.type,
        languages: [data.language],
        tmdbId: (video.movie?.tmdbId || video.episode?.tmdbId) ?? undefined,
    });

    const subtitles = subtitlesRaw.map(toSubtitleSearchResultDTO).filter((s) => !!s) satisfies SubtitleSearchResultDTO[];

    return subtitles;
};

export const deleteSubtitleById = async (data: { videoId: string; subtitleId: string }) => {
    await db.transaction(async (tx) => {
        const [subtitle] = await tx
            .select()
            .from(subtitles)
            .where(and(eq(subtitles.videoId, data.videoId), eq(subtitles.id, data.subtitleId)));

        if (!subtitle) throw new AppError('Subtitle not found', { statusCode: 404 });

        await tx.delete(subtitles).where(eq(subtitles.id, data.subtitleId));

        const finalPath = path.join(paths.storage, subtitle.storageKey);
        await fs.unlink(finalPath).catch(() => {});
    });
};

import { paths } from '../../../shared/configs/path.config';
import { systemSettings } from '../../../shared/services/system.service';
import { SubtitleDownloadError } from '../movies.errors';
import { mapSubtitles, subtitlesClient } from '../services/subs.service';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import { convertSRTtoVTT } from '../../../shared/utils/ffmpeg';
import { db } from '../../../shared/configs/db';
import { subtitles } from '../../../shared/schema';
import { AppError } from '../../../shared/errors';
import { logger } from '../../../shared/configs/logger';

export const downloadSubtitlesWorkflow = async (data: { movieId: string; imdbId: string; movieHash?: string }) => {
    const sysSettings = await systemSettings.get();
    const preferences = sysSettings.preferences.subtitles;

    const subtitlesRaw = await subtitlesClient.getSubtitles({
        imdbId: data.imdbId,
        languages: preferences.map((p) => p.lang),
        movieHash: data.movieHash,
    });

    const subtitlesMapped = mapSubtitles(subtitlesRaw, preferences);

    for (const subtitle of subtitlesMapped) {
        if (subtitle.files.length < 1) continue;
        try {
            const file = subtitle.files[0]!;
            const { link } = await subtitlesClient.downloadSubtitle(file.file_id, { sub_format: 'srt' }).catch((err) => {
                throw new SubtitleDownloadError('OpenSubs link failed', err);
            });

            const storageKey = `subtitles/${randomUUID()}.vtt`;
            const finalPath = path.join(paths.storage, storageKey);
            await fs.mkdir(path.dirname(finalPath), { recursive: true });

            const response = await fetch(link);
            if (!response.ok) throw new SubtitleDownloadError(`Source file fetch failed: ${response.statusText}`);
            await convertSRTtoVTT(response.body, finalPath);

            await db
                .insert(subtitles)
                .values({ movieId: data.movieId, language: subtitle.language, externalId: subtitle.id, storageKey })
                .catch(async (err) => {
                    await fs.unlink(finalPath).catch(() => {});
                    throw new AppError('Database insert failed for subtitle', { cause: err });
                });

            logger.info(
                {
                    movieId: data.movieId,
                    language: subtitle.language,
                    storageKey,
                },
                'Subtitle processed and saved successfully'
            );
        } catch (err) {
            const log = {
                err,
                movieId: data.movieId,
                language: subtitle.language,
                externalId: subtitle.id,
            };
            if (err instanceof AppError) logger.warn(log, `[Subtitle Skip] ${err.message}`);
            else logger.error(log, 'Critical Error processing subtitle');
        }
    }
};

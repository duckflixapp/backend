import { eq } from 'drizzle-orm';
import { movies, type Movie, type MovieVersion } from '../../shared/schema';
import { db } from '../../shared/configs/db';
import { env } from '../../env';
import { MovieNotFoundError, NoMovieMediaFoundError, NotStandardResolutionError, TooBigResolutionError } from './live.errors';
import { SessionTask } from './sessionTask';
import path from 'node:path';
import { paths } from '../../shared/configs/path.config';
import fs from 'node:fs/promises';
import { AppError } from '../../shared/errors';

const livePresets = [
    { name: '2160p', height: 2160, bitrate: 20000000 },
    { name: '1440p', height: 1440, bitrate: 10000000 },
    { name: '1080p', height: 1080, bitrate: 5000000 },
    { name: '720p', height: 720, bitrate: 2800000 },
    { name: '480p', height: 480, bitrate: 1400000 },
];
const presetHeights = livePresets.map((p) => p.height);

const masterStream = (v: { streamUrl: string; width: number; height: number; bandwidth: number; name: string; session?: string }) => {
    let stream = `#EXT-X-STREAM-INF:BANDWIDTH=${v.height * 2000},RESOLUTION=${v.width}x${v.height},NAME="${v.name}"\n`;
    stream += `${v.streamUrl}${v.session ? '?session=' + v.session : ''}\n`;
    return stream;
};

const mediaBase = `${env.BASE_URL}/media`;

const generatedSessions = new Map<string, { movieId: string; storageKey: string; height: number; duration: number }>();
export const generateMasterFile = async (movieId: string) => {
    const movie = await db.query.movies.findFirst({ where: eq(movies.id, movieId), with: { versions: true } });
    if (!movie) throw new MovieNotFoundError();

    const original = movie.versions.find((v) => v.isOriginal);
    if (!original) throw new NoMovieMediaFoundError();

    const versions = movie.versions.filter((v) => v.mimeType === 'application/x-mpegURL').sort((a, b) => b.height - a.height);
    const includedHeights = versions.map((v) => v.height);

    const session = crypto.randomUUID();
    generatedSessions.set(session, {
        movieId: movie.id,
        storageKey: original.storageKey,
        height: original.height,
        duration: movie.duration!,
    });

    let master = `#EXTM3U\n`;

    // add original if not in versions as original
    if (!includedHeights.includes(original.height)) {
        const originalWidth = original.width || 1920;
        master += `#EXT-X-STREAM-INF:BANDWIDTH=${original.height * 2000},RESOLUTION=${originalWidth}x${original.height},NAME="Original"\n`;
        master += `${mediaBase}/live/${movie.id}/${original.height}/index.m3u8?session=${session}\n\n`;
    }

    // add every existing version
    versions.forEach((v) => {
        master += masterStream({
            streamUrl: `${mediaBase}/stream/${v.id}/index.m3u8`,
            width: v.width ?? 0,
            height: v.height,
            bandwidth: v.height * 2000,
            name: `${v.height}p`,
        });
    });

    // add live presets
    const aspect = (original.width || 16) / original.height;
    livePresets
        .filter((p) => p.height < original.height && !includedHeights.includes(p.height))
        .forEach((p) => {
            const width = Math.round((p.height * aspect) / 2) * 2;
            master += masterStream({
                streamUrl: `${mediaBase}/live/${movie.id}/${p.height}/index.m3u8`,
                width,
                height: p.height,
                bandwidth: p.bitrate,
                name: p.name,
                session,
            });
        });

    return master;
};

export const getMovieWithOriginal = async (movieId: string): Promise<{ movie: Movie; original: MovieVersion }> => {
    const movie = await db.query.movies.findFirst({ where: eq(movies.id, movieId), with: { versions: true } });
    if (!movie) throw new MovieNotFoundError();
    if (!movie.duration) throw new NoMovieMediaFoundError();

    const original = movie.versions.find((v) => v.isOriginal);
    if (!original) throw new NoMovieMediaFoundError();

    return { movie, original };
};

export const generateManifestFile = async (
    movie: Movie,
    original: MovieVersion,
    height: number,
    session: string,
    options = { segmentDuration: 6 }
) => {
    if (height > original.height) throw new TooBigResolutionError();
    if (!presetHeights.includes(height)) throw new NotStandardResolutionError();

    const totalSegments = Math.ceil(movie.duration! / options.segmentDuration);

    let m3u8 = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:${options.segmentDuration}
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD\n`;

    for (let i = 0; i < totalSegments; i++) {
        const duration = i === totalSegments - 1 ? movie.duration! - i * options.segmentDuration : options.segmentDuration;

        m3u8 += `#EXTINF:${duration.toFixed(6)},\n`;
        m3u8 += `${env.BASE_URL}/media/live/${movie.id}/${height}/seg-${i}.ts?session=${session}\n`;
    }
    m3u8 += '#EXT-X-ENDLIST';

    return m3u8;
};

export const sessionRegistry = new Map<string, SessionTask>();
export const ensureLiveSegment = async (movieId: string, session: string, height: number, options = { segment: 0, segmentDuration: 6 }) => {
    const original = generatedSessions.get(session);
    if (!original || original.movieId !== movieId) throw new AppError('Session not found', { statusCode: 404 });
    if (height > original.height) throw new TooBigResolutionError();
    if (!presetHeights.includes(height)) throw new NotStandardResolutionError();

    const sessionPath = path.resolve(paths.live, session);
    let sessionTask = sessionRegistry.get(session);
    if (!sessionTask) {
        const sourcePath = path.resolve(paths.storage, original.storageKey);
        const totalSegments = Math.ceil(original.duration / options.segmentDuration);
        sessionTask = new SessionTask(session, sourcePath, sessionPath, options.segmentDuration, height, totalSegments, () => {
            sessionRegistry.delete(session);
            generatedSessions.delete(session);
            fs.rm(sessionPath, { recursive: true, force: true }).catch(() => {});
        });
        sessionRegistry.set(session, sessionTask);
        await sessionTask.initalize();
    }

    await sessionTask.prepareSegment(options.segment, { height });

    return path.join(sessionPath, `seg-${options.segment}.ts`);
};

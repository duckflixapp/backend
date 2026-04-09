import { Elysia, type Context } from 'elysia';
import { sessionClient } from './session/session.client';
import { AppError } from '@shared/errors';

export const withMediaSession = new Elysia({ name: 'withMediaSession' }).derive({ as: 'global' }, async ({ query, params }) => {
    const session = query.session as string | undefined;
    const resourceId = params.videoId || params.versionId || params.subtitleId;

    if (!session || !resourceId) {
        throw new AppError('Missing session token or resource ID', { statusCode: 400 });
    }

    const sessionData = await sessionClient.validate(session, resourceId);

    return {
        mediaSession: sessionData,
    };
});

export const sessionPlugin = new Elysia({ name: 'session-plugin' }).derive({ as: 'global' }, ({ query }) => ({
    resolveMedia: async (videoId: string | undefined) => {
        const session = query.session as string | undefined;

        if (!session || !videoId) {
            throw new AppError('Missing session token or resource ID', { statusCode: 400 });
        }

        return await sessionClient.validate(session, videoId);
    },
}));

export const sessionGuard = new Elysia({ name: 'session-guard' }).use(sessionPlugin).macro({
    mediaSession: (getVideoId: (context: Context) => undefined | string | Promise<string>) => ({
        async resolve({ resolveMedia, ...context }) {
            const videoId = await getVideoId(context);

            const mediaSession = await resolveMedia(videoId);
            return { mediaSession };
        },
    }),
});

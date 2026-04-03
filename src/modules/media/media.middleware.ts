import type { NextFunction, Request, Response } from 'express';
import { authQuerySchema } from './media.validator';
import { sessionClient } from './session/session.client';
import { catchAsync } from '@shared/utils/catchAsync';

export const validateMediaSession = (getVideoId: (req: Request) => string) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const { session } = authQuerySchema.parse(req.query);
        const videoId = getVideoId(req);
        res.locals.session = await sessionClient.validate(session, videoId);
        next();
    });

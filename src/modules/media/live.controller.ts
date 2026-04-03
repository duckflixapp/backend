import type { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { liveManifestSchema, liveMasterSchema, liveSegmentSchema } from './media.validator';
import * as LiveMediaService from './live.service';
import { AppError } from '@shared/errors';

const segmentDuration = 6;

export const getLiveMaster = catchAsync(async (req: Request, res: Response) => {
    const { videoId } = liveMasterSchema.parse(req.params);
    const { id: session } = res.locals.session;

    const master = await LiveMediaService.generateMasterFile(videoId, session);

    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.send(master);
});

export const getLiveManifest = catchAsync(async (req: Request, res: Response) => {
    const { videoId, height } = liveManifestSchema.parse(req.params);
    const { id: session } = res.locals.session;

    const { video, original } = await LiveMediaService.getVideoWithOriginal(videoId);
    const m3u8 = await LiveMediaService.generateManifestFile(video, original, height, session, { segmentDuration });

    res.setHeader('Content-Type', 'application/x-mpegURL');
    res.send(m3u8);
});

export const getLiveSegment = catchAsync(async (req: Request, res: Response) => {
    const { height, segmentName } = liveSegmentSchema.parse(req.params);
    const { id: session } = res.locals.session;

    const indexMatch = segmentName.match(/\d+/);
    if (!indexMatch) throw new AppError('Invalid segment name', { statusCode: 400 });
    const segmentIndex = parseInt(indexMatch[0]);

    const path = await LiveMediaService.ensureLiveSegment(session, height, res.locals.session.data.original, {
        segment: segmentIndex,
        segmentDuration,
    });

    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Content-Type', 'video/MP2T');
    res.sendFile(path);
});

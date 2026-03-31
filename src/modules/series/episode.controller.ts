import type { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { episodeParamSchema } from './validator';
import { getEpisodeById } from './services/episode.service';

export const getOne = catchAsync(async (req: Request, res: Response) => {
    const { episodeId } = episodeParamSchema.parse(req.params);

    const episode = await getEpisodeById(episodeId);

    res.status(200).json({
        status: 'success',
        data: { episode },
    });
});

import type { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { seasonParamSchema } from './validator';
import { getSeasonById } from './services/season.service';

export const getOne = catchAsync(async (req: Request, res: Response) => {
    const { seasonId } = seasonParamSchema.parse(req.params);

    const season = await getSeasonById(seasonId);

    res.status(200).json({
        status: 'success',
        data: { season },
    });
});

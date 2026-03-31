import type { Request, Response } from 'express';
import { catchAsync } from '@utils/catchAsync';
import { seriesParamSchema } from './validator';
import { getSeriesById } from './services/series.service';

export const getOne = catchAsync(async (req: Request, res: Response) => {
    const { seriesId } = seriesParamSchema.parse(req.params);

    const series = await getSeriesById(seriesId);

    res.status(200).json({
        status: 'success',
        data: { series },
    });
});

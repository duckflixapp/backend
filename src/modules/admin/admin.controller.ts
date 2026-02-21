import type { Request, Response } from 'express';
import { catchAsync } from '../../shared/utils/catchAsync';
import { systemSettings } from '../../shared/services/system.service';
import { toSystemDTO } from '../../shared/mappers/system.mapper';
import { systemSettingsUpdateSchema } from './admin.validator';

export const getSystem = catchAsync(async (req: Request, res: Response) => {
    const system = await systemSettings.get();

    res.status(201).json({
        status: 'success',
        data: { system: toSystemDTO(system) },
    });
});

export const updateSystem = catchAsync(async (req: Request, res: Response) => {
    const validatedData = systemSettingsUpdateSchema.parse(req.body);

    if (validatedData?.external?.tmdb?.apiKey?.includes('**********')) delete validatedData.external.tmdb.apiKey;
    if (validatedData?.external?.openSubtitles?.apiKey?.includes('**********')) delete validatedData.external.openSubtitles.apiKey;
    if (validatedData?.external?.openSubtitles?.password?.includes('**********')) delete validatedData.external.openSubtitles.password;
    if (validatedData?.external?.email?.smtpSettings?.password?.includes('**********'))
        delete validatedData.external.email.smtpSettings.password;

    const system = await systemSettings.update(validatedData);

    res.status(201).json({
        status: 'success',
        data: { system: toSystemDTO(system) },
    });
});

import { getEnvNumber } from '../utils/env.utils';

export const limits = {
    file: {
        upload: getEnvNumber('UPLOAD_FILE_LIMIT', 16384),
    },
} as const;

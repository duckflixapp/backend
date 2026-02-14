import { getEnvNumber } from '../utils/env.utils';

export const limits = {
    file: {
        upload: getEnvNumber('UPLOAD_FILE_LIMIT', 16384),
    },
    processing: {
        concurrent: getEnvNumber('CONCURENT_PROCESS', 1),
    },
} as const;

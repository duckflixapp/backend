import path from 'node:path';
import { env } from '../../env';

export const paths = {
    storage: path.resolve(env.STORAGE_FOLDER),
    live: path.resolve(env.LIVE_FOLDER),
    downloads: path.resolve(env.TEMP_FOLDER, 'downloads/'),
    uploads: path.resolve(env.TEMP_FOLDER, 'uploads/'),
    logs: path.resolve(env.LOG_FOLDER),
} as const;

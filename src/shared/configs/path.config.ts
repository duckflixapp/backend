import path from 'node:path';

const ROOT_STORAGE = process.env.STORAGE_FOLDER || 'storage';
const ROOT_TEMP = process.env.TEMP_FOLDER || 'temp';

export const paths = {
    storage: path.resolve(ROOT_STORAGE),
    downloads: path.resolve(ROOT_TEMP, 'downloads/'),
    uploads: path.resolve(ROOT_TEMP, 'uploads/'),
} as const;

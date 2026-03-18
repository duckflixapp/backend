import fs from 'node:fs/promises';
import { paths } from '../../shared/configs/path.config';
import path from 'node:path';
const clearLiveFolder = async () => {
    try {
        const files = await fs.readdir(paths.live);
        await Promise.all(files.map((file) => fs.rm(path.join(paths.live, file), { recursive: true, force: true })));
    } catch {
        await fs.mkdir(paths.live, { recursive: true });
    }
};

const clearTempFolder = async () => {
    await fs.rm(paths.downloads, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(paths.downloads, { recursive: true });

    await fs.rm(paths.uploads, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(paths.uploads, { recursive: true });
};

export const filesCleanup = async () => {
    await clearLiveFolder();
    await clearTempFolder();
};

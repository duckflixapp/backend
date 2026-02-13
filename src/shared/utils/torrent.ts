import fs from 'node:fs/promises';
import type { Torrent } from 'webtorrent';
import WebTorrent from 'webtorrent';

const client = new WebTorrent();

const defaultMaxSize = 1024 * 1024 * 2; // 2MB
export const validateTorrentSize = async (torrentPath: string, maxSize: number = defaultMaxSize) => {
    const stats = await fs.stat(torrentPath);

    return stats.size < maxSize;
};

export const downloadTorrent = (
    buffer: Buffer,
    downloadPath: string,
    onProgress?: (progress: number, speed: number) => void
): Promise<Torrent> => {
    return new Promise((resolve, reject) => {
        try {
            client.add(buffer, { path: downloadPath }, (torrent) => {
                torrent.on('download', () => onProgress && onProgress(torrent.progress * 100, torrent.downloadSpeed));

                torrent.on('done', () => resolve(torrent));

                torrent.on('error', (err) => {
                    torrent.destroy();
                    reject(err);
                });
            });
        } catch (err) {
            reject(err);
        }
    });
};

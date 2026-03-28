export const videoDefaults: { h: number; limits: { bitrate: string; buf: string; audioBitrate: string } }[] = [
    { h: 2160, limits: { bitrate: '16M', buf: '24M', audioBitrate: '256k' } },
    { h: 1440, limits: { bitrate: '12M', buf: '16M', audioBitrate: '256k' } },
    { h: 1080, limits: { bitrate: '8M', buf: '8M', audioBitrate: '192k' } },
    { h: 720, limits: { bitrate: '4M', buf: '4M', audioBitrate: '128k' } },
    { h: 0, limits: { bitrate: '2M', buf: '4M', audioBitrate: '128k' } },
] as const;

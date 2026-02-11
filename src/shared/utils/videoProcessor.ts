import path from 'node:path';

export interface FFprobeStream {
    index: number;
    codec_name?: string;
    codec_type?: 'video' | 'audio' | 'subtitle' | 'data';
    width?: number;
    height?: number;
    duration?: string;
    bit_rate?: string;
}

export interface FFprobeFormat {
    filename: string;
    nb_streams: number;
    format_name: string;
    duration: string;
    size: string;
    bit_rate: string;
}

export interface FFprobeData {
    streams: FFprobeStream[];
    format: FFprobeFormat;
}

export const ffprobe = async (filePath: string): Promise<FFprobeData> => {
    const absolutePath = path.resolve(filePath);
    const proc = Bun.spawn(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', absolutePath]);

    const text = await new Response(proc.stdout).text();

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        throw new Error('FFprobe failed to read file');
    }

    return JSON.parse(text) as FFprobeData;
};

export const transcode = async (inputPath: string, outputPath: string, targetHeight: number): Promise<string> => {
    const limits: Record<number, { bitrate: string; buf: string }> = {
        2160: { bitrate: '12M', buf: '24M' }, // 4K
        1440: { bitrate: '8M', buf: '16M' }, // 2K
        1080: { bitrate: '4M', buf: '8M' }, // Full HD
        720: { bitrate: '2M', buf: '4M' }, // HD
        480: { bitrate: '1M', buf: '2M' }, // SD
    };
    const config = limits[targetHeight] || { bitrate: '2M', buf: '4M' };

    const proc = Bun.spawn([
        'ffmpeg',
        '-v',
        'error',
        '-i',
        inputPath,
        '-vf',
        `scale=-2:${targetHeight}:flags=lanczos`,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '20',
        '-maxrate',
        config.bitrate,
        '-bufsize',
        config.buf,
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-y',
        outputPath,
    ]);

    await proc.exited;

    if (proc.exitCode !== 0) throw new Error(`FFmpeg transcoding failed for height ${targetHeight}`);
    return outputPath;
};

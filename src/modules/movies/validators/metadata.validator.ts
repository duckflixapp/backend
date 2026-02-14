import type { VideoMetadata } from '../services/metadata.service';

export const isVideoMetadata = (data: unknown): data is VideoMetadata => {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const candidate = data as Partial<VideoMetadata>;

    if (typeof candidate.title !== 'string' || candidate.title.trim() === '') {
        return false;
    }

    if (!Array.isArray(candidate.genreIds) || !candidate.genreIds.every((id) => typeof id === 'string')) {
        return false;
    }

    const optionalStrings: (keyof VideoMetadata)[] = ['overview', 'posterUrl', 'bannerUrl'];
    for (const key of optionalStrings) {
        const val = candidate[key];
        if (val !== undefined && val !== null && typeof val !== 'string') {
            return false;
        }
    }

    if (candidate.releaseYear !== undefined && candidate.releaseYear !== null && typeof candidate.releaseYear !== 'number') {
        return false;
    }

    return true;
};

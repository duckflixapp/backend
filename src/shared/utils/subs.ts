import type { Subtitle } from '@shared/schema';
import { iso6393To1 } from 'iso-639-3';
import ISO6391 from 'iso-639-1';

export const normalizeLanguage = (lang: string | undefined): string | null => {
    if (!lang || lang === 'und') return null;
    if (lang.length === 2) return lang.toLowerCase();
    if (lang.length === 3) return iso6393To1[lang.toLowerCase()] ?? lang.toLowerCase();
    return null;
};

export const createSubtitleName = (lang: string, subtitles: Pick<Subtitle, 'language' | 'name'>[]) => {
    const base = ISO6391.getName(lang) || lang;
    const filtered = subtitles.filter((s) => s.language === lang);

    if (filtered.length === 0) return base;

    const maxIndex = filtered.reduce((max, s) => {
        const match = s.name.match(/ (\d+)$/);
        return match && match[1] ? Math.max(max, parseInt(match[1])) : Math.max(max, 1);
    }, 1);

    return `${base} ${maxIndex + 1}`;
};

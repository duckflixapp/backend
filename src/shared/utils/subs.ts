import { iso6393To1 } from 'iso-639-3';

export const normalizeLanguage = (lang: string | undefined): string | null => {
    if (!lang || lang === 'und') return null;
    if (lang.length === 2) return lang.toLowerCase();
    if (lang.length === 3) return iso6393To1[lang.toLowerCase()] ?? lang.toLowerCase();
    return null;
};

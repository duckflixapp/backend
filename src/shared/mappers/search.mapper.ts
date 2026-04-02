import type { SearchResultDTO } from '@duckflix/shared';

export interface SearchResult {
    type: 'movie' | 'series';
    id: string;
    title: string;
    image: string | null;
    rating: number | null;
    createdAt: string;
    release: string;
}

export const toSearchResultDTO = (r: SearchResult): SearchResultDTO => ({
    type: r.type,
    id: r.id,
    title: r.title,
    image: r.image,
    rating: r.rating,
    createdAt: r.createdAt,
    release: r.release,
});

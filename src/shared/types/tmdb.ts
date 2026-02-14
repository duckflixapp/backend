export interface TMDBGenre {
    id: number;
    name: string;
}

export interface TMDBProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

export interface TMDBProductionCountry {
    iso_3166_1: string;
    name: string;
}

export interface TMDBSpokenLanguage {
    english_name: string;
    iso_639_1: string;
    name: string;
}

export interface TMDBCollection {
    id: number;
    name: string;
    poster_path: string | null;
    backdrop_path: string | null;
}

export interface TMDBMovieDetails {
    adult: boolean;
    backdrop_path: string | null;
    belongs_to_collection: TMDBCollection | null;
    budget: number;
    genres: TMDBGenre[];
    homepage: string;
    id: number;
    imdb_id: string | null;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    production_companies: TMDBProductionCompany[];
    production_countries: TMDBProductionCountry[];
    release_date: string;
    revenue: number;
    runtime: number;
    spoken_languages: TMDBSpokenLanguage[];
    status: 'Rumored' | 'Planned' | 'In Production' | 'Post Production' | 'Released' | 'Canceled';
    tagline: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
}

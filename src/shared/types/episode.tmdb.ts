export interface TMDBEpisodeDetails {
    id: number;
    name: string;
    overview: string;
    air_date: string;
    runtime: number;
    still_path: string;
    vote_average: number;
    vote_count: number;
    episode_number: number;
    season_number: number;
    external_ids?: {
        imdb_id: string | null;
    };
}

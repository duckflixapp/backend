declare module '@duckflixapp/shared' {
    export interface CastMemberDTO {
        id: string;
        name: string;
        character: string | null;
        profileUrl: string | null;
        order: number | null;
    }

    export interface MovieDetailedDTO {
        cast: CastMemberDTO[];
    }

    export interface EpisodeDTO {
        cast: CastMemberDTO[];
    }
}

export {};

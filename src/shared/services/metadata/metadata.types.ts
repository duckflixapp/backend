import type { EpisodeMetadata, MovieMetadata } from './metadata.validator';

export type { EpisodeMetadata, MovieMetadata };
export type VideoMetadata = MovieMetadata | EpisodeMetadata;

export type TorrentState = 'live' | 'error' | 'finished';
export interface TorrentSpeed {
    mbps: number;
    human_readable: string;
}
export interface TorrentTime {
    secs: number;
    nanos: number;
}

export interface TorrentSnapshot {
    downloaded_and_checked_bytes: number;
    fetched_bytes: number;
    uploaded_bytes: number;
    downloaded_and_checked_pieces: number;
    total_piece_download_ms: number;
    peer_stats: {
        queued: number;
        connecting: number;
        live: number;
        seen: number;
        dead: number;
        not_needed: number;
        steals: number;
    };
}

export interface TorrentLiveStats {
    snapshot: TorrentSnapshot;
    average_piece_download_time: TorrentTime;
    download_speed: TorrentSpeed;
    upload_speed: TorrentSpeed;
    time_remaining: {
        duration: TorrentTime;
        human_readable: string;
    } | null;
}

export interface TorrentStats {
    state: TorrentState;
    file_progress: number[];
    error: string | null;
    progress_bytes: number;
    uploaded_bytes: number;
    total_bytes: number;
    finished: boolean;
    live: TorrentLiveStats | null;
}

export interface TorrentFile {
    name: string;
    components: string[];
    length: number;
    included: boolean;
    attributes: {
        symlink: boolean;
        hidden: boolean;
        padding: boolean;
        executable: boolean;
    };
}

export interface RqbitTorrent {
    id: number;
    details: {
        id: number;
        info_hash: string;
        name: string;
        output_folder: string;
        files: Array<TorrentFile>;
    };
    output_folder: string;
    seen_peers: unknown;
}

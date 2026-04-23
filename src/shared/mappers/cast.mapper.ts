import type { CastMemberDTO } from '@duckflixapp/shared';
import type { TMDBCastMember } from '@shared/types/movie.tmdb';

const TMDB_PROFILE_BASE_URL = 'https://image.tmdb.org/t/p/w185';

export const toCastMemberDTO = (member: TMDBCastMember): CastMemberDTO => ({
    id: String(member.id),
    name: member.name,
    character: member.character || null,
    profileUrl: member.profile_path ? `${TMDB_PROFILE_BASE_URL}${member.profile_path}` : null,
    order: typeof member.order === 'number' ? member.order : null,
});

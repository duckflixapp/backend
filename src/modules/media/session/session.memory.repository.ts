import type { SessionData, SessionRepository } from './session.repository';

export class InMemorySessionRepository implements SessionRepository {
    private readonly store = new Map<string, SessionData>();

    async get(id: string): Promise<SessionData | null> {
        return this.store.get(id) ?? null;
    }

    async set(id: string, data: SessionData): Promise<void> {
        this.store.set(id, data);
    }

    async delete(id: string): Promise<void> {
        this.store.delete(id);
    }

    async has(id: string): Promise<boolean> {
        return this.store.has(id);
    }
}

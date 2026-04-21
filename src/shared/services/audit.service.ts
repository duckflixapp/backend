import { db, type Transaction } from '@shared/configs/db';
import { auditLogs } from '@shared/schema';

type AuditClient = typeof db | Transaction;

type CreateAuditLogInput = {
    actorUserId?: string | null;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
};

export const createAuditLog = async (data: CreateAuditLogInput, client: AuditClient = db): Promise<void> => {
    await client.insert(auditLogs).values({
        actorUserId: data.actorUserId ?? null,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId ?? null,
        metadata: data.metadata ?? {},
    });
};

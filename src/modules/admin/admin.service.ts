import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@shared/configs/db';
import { users } from '@schema/user.schema';
import { toUserDTO } from '@shared/mappers/user.mapper';
import { isAtLeast, roleHierarchy, roles, type SystemStatisticsDTO, type UserDTO, type UserRole } from '@duckflixapp/shared';
import { AppError } from '@shared/errors';
import { getStorageStatistics } from '@shared/services/storage.service';
import { toSystemStatisticsDTO } from '@shared/mappers/system.mapper';
import { env } from '@core/env';
import { taskHandler } from '@utils/taskHandler';
import { liveSessionManager } from '@modules/media/live.service';
import { createAuditLog } from '@shared/services/audit.service';

export const getUsersWithRoles = async (): Promise<UserDTO[]> => {
    const rolesIncluded = roles.filter((r) => isAtLeast(r, 'watcher'));
    const results = await db
        .select()
        .from(users)
        .where(and(inArray(users.role, rolesIncluded), eq(users.system, false)));

    return results.sort((a, b) => roleHierarchy[a.role] - roleHierarchy[b.role]).map(toUserDTO);
};

export const changeUserRole = async (email: string, role: UserRole, context: { userId: string }): Promise<void> => {
    return await db.transaction(async (tx) => {
        const [user] = await tx
            .select({ id: users.id, email: users.email, role: users.role })
            .from(users)
            .where(and(eq(users.email, email), eq(users.system, false)));
        if (!user) throw new AppError('User not found, no changes were made', { statusCode: 404 });
        if (user.id == context.userId) throw new AppError('You are not allowed to change your own role', { statusCode: 403 });

        await tx.update(users).set({ role }).where(eq(users.id, user.id));
        await createAuditLog(
            {
                actorUserId: context.userId,
                action: 'admin.user.role_changed',
                targetType: 'user',
                targetId: user.id,
                metadata: {
                    email: user.email,
                    previousRole: user.role,
                    nextRole: role,
                },
            },
            tx
        );
    });
};

export const deleteUser = async (email: string, context: { userId: string }): Promise<void> => {
    return await db.transaction(async (tx) => {
        const [user] = await tx
            .select({ id: users.id, email: users.email, role: users.role })
            .from(users)
            .where(and(eq(users.email, email), eq(users.system, false)));
        if (!user) throw new AppError('User not found, no changes were made', { statusCode: 404 });
        if (user.id == context.userId) throw new AppError('You are not allowed to delete your own account', { statusCode: 403 });

        await tx.delete(users).where(eq(users.id, user.id));
        await createAuditLog(
            {
                actorUserId: context.userId,
                action: 'admin.user.deleted',
                targetType: 'user',
                targetId: user.id,
                metadata: {
                    email: user.email,
                    role: user.role,
                },
            },
            tx
        );
    });
};

export const getSystemStatistics = async (): Promise<SystemStatisticsDTO> => {
    const storageStats = await getStorageStatistics();
    const version = env.VERSION;
    const uptime = process.uptime();

    const sessions = {
        total: liveSessionManager.size(),
    };

    const tasks = {
        working: taskHandler.working,
        queue: taskHandler.queueSize,
    };

    return toSystemStatisticsDTO({ version, uptime, sessions, tasks, storage: storageStats });
};

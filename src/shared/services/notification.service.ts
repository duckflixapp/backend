import { db } from '../configs/db';
import { notifications, users } from '../schema';
import { io } from '../../server';
import { logger } from '../configs/logger';
import { and, eq } from 'drizzle-orm';
import { getSystemUserId } from '../configs/system';

const notifyUser = (userId: string, data: unknown) => {
    io.to(`user:${userId}`).emit('notification', data);
};

export const notifyJobStatus = async (
    userId: string,
    status: 'started' | 'completed' | 'downloaded' | 'canceled' | 'error',
    title: string,
    message: string,
    videoId?: string,
    videoVerId?: string
) => {
    const typeMap = {
        completed: 'success',
        canceled: 'warning',
        error: 'error',
        started: 'info',
        downloaded: 'info',
    } as const;

    const finalType = typeMap[status] || 'info';

    const isSystem = userId === getSystemUserId();
    const targetIds: string[] = [];

    if (isSystem) {
        const admins = await db
            .select({ id: users.id })
            .from(users)
            .where(and(eq(users.role, 'admin'), eq(users.system, false)));
        targetIds.push(...admins.map((a) => a.id));
    } else targetIds.push(userId);

    const values = targetIds.map((id) => ({
        userId: id,
        videoId,
        videoVerId,
        type: finalType,
        title,
        message,
    }));

    await db
        .insert(notifications)
        .values(values)
        .catch((err) => logger.error({ err, userId, videoId, status }, 'Failed to save notification to database'));

    targetIds.forEach((id) => notifyUser(id, { videoId, videoVerId, status, title, message }));
};

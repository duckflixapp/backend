import type { NotificationDTO, UserDTO, UserMinDTO } from '@duckflix/shared';
import type { Notification, User } from '../schema';

export const toUserMinDTO = (user: Pick<User, 'id' | 'name' | 'role' | 'system'>): UserMinDTO => ({
    id: user.id,
    role: user.role,
    name: user.name,
    system: user.system,
});

export const toUserDTO = (user: User): UserDTO => ({
    ...toUserMinDTO(user),
    email: user.email,
    isVerified: user.verified_email,
    createdAt: user.createdAt,
});

export const toNotificationDTO = (notification: Notification): NotificationDTO => ({
    id: notification.id,
    userId: notification.userId,
    videoId: notification.videoId,
    videoVerId: notification.videoVerId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
});

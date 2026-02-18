import z from 'zod';

export const validateMarkUserNotifications = z.object({
    notificationIds: z.preprocess(
        (val) => (Array.isArray(val) ? val : []),
        z.array(z.uuid('Invalid Notification ID')).max(30, 'Too many Notifications, You can send [] to mark all')
    ),
});

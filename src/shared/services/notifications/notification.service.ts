import type { NotificationChannel, NotificationEvent } from './notification.types';
import { DatabaseChannel } from './channels/database.channel';
import { SocketChannel } from './channels/socket.channel';

export class NotificationService {
    constructor(private channels: NotificationChannel[]) {}

    async send(senderId: string, ...events: NotificationEvent[]) {
        return Promise.allSettled(this.channels.map((c) => c.send(senderId, events)));
    }
}

export const notificationService = new NotificationService([new DatabaseChannel(), new SocketChannel()]);

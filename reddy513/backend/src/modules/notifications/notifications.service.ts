import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async createNotification(userId: string, type: string, message: string, relatedRequestId?: string) {
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        type,
        message,
        relatedRequestId: relatedRequestId || null,
        isRead: false,
      },
    });

    // Push socket event to pilot or user room
    this.gateway.broadcastToPilot(userId, 'notification:new', notif);

    return notif;
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

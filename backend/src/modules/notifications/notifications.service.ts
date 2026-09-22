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

  async broadcastCorridorAlert(
    userId: string,
    dto: {
      title: string;
      message: string;
      severity?: string;
      segmentLabel?: string;
      sound?: 'alarm' | 'emergency' | 'warning' | 'chime';
      details?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const senderRole = user?.role || 'SYSTEM';
    const senderDept = user?.department || undefined;

    const alertPayload = {
      id: `manual-alert-${Date.now()}`,
      title: dto.title || '🚨 Corridor Emergency Alert',
      message: dto.message,
      sourceRole: senderRole,
      sourceDepartment: senderDept,
      targetAudience: 'Operations Admin, All Maintenance Gangs, Loco Pilots',
      severity: dto.severity || 'CRITICAL',
      segmentLabel: dto.segmentLabel || 'Secunderabad ↔ Visakhapatnam Mainline',
      priorityScore: dto.severity === 'CRITICAL' ? 95 : 75,
      details: dto.details || `Manual alert triggered by ${user?.fullName || senderRole}`,
      sound: dto.sound || 'emergency',
      timestamp: new Date().toISOString(),
    };

    this.gateway.broadcastCorridorAlert(alertPayload);
    return { success: true, alert: alertPayload };
  }
}


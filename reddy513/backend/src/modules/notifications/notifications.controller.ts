import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }
}

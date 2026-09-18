import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsGateway, NotificationsService, PrismaService],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}

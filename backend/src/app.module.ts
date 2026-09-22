import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { RequestsModule } from './modules/requests/requests.module';
import { OptimizerModule } from './modules/optimizer/optimizer.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { TrainsModule } from './modules/trains/trains.module';

@Module({
  imports: [
    AuthModule,
    RequestsModule,
    OptimizerModule,
    NotificationsModule,
    AuditModule,
    SegmentsModule,
    TrainsModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}

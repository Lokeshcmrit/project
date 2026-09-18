import { Module } from '@nestjs/common';
import { TrainsService } from './trains.service';
import { TrainsController } from './trains.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TrainsController],
  providers: [TrainsService, PrismaService],
  exports: [TrainsService],
})
export class TrainsModule {}

import { Module } from '@nestjs/common';
import { OptimizerService } from './optimizer.service';
import { OptimizerController } from './optimizer.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [OptimizerController],
  providers: [OptimizerService, PrismaService],
  exports: [OptimizerService],
})
export class OptimizerModule {}

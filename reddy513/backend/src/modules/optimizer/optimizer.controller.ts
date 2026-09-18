import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OptimizerService } from './optimizer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('optimizer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OptimizerController {
  constructor(private readonly optimizerService: OptimizerService) {}

  @Get('recommend/:requestId')
  @Roles(Role.ADMIN, Role.DEPARTMENT)
  async getRecommendation(@Param('requestId') requestId: string) {
    return this.optimizerService.getRecommendation(requestId);
  }

  @Get('weekly-schedule')
  @Roles(Role.ADMIN, Role.DEPARTMENT)
  async getWeeklySchedule() {
    return this.optimizerService.getWeeklySchedule();
  }

  @Get('monthly-heatmap')
  @Roles(Role.ADMIN, Role.DEPARTMENT)
  async getMonthlyHeatmap() {
    return this.optimizerService.getMonthlyHeatmap();
  }
}

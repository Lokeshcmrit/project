import { Controller, Get, UseGuards } from '@nestjs/common';
import { TrainsService } from './trains.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('trains')
@UseGuards(JwtAuthGuard)
export class TrainsController {
  constructor(private readonly trainsService: TrainsService) {}

  @Get()
  async getAllTrains() {
    return this.trainsService.getAllTrains();
  }

  @Get('my-train')
  async getMyTrain(@CurrentUser() user: { id: string }) {
    return this.trainsService.getMyTrainData(user.id);
  }

  @Get('block-alerts')
  async getBlockAlerts(@CurrentUser() user: { id: string }) {
    return this.trainsService.getBlockAlertsForPilot(user.id);
  }
}

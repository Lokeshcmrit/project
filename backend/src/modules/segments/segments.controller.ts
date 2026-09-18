import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { SegmentsService } from './segments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, SegmentStatus } from '@prisma/client';

@Controller('corridor')
@UseGuards(JwtAuthGuard)
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get('segments')
  async getSegments() {
    return this.segmentsService.getAllSegments();
  }

  @Get('stations')
  async getStations() {
    return this.segmentsService.getAllStations();
  }

  @Get('network-overview')
  async getNetworkOverview() {
    return this.segmentsService.getNetworkStatusOverview();
  }

  @Patch('segments/:id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SegmentStatus,
  ) {
    return this.segmentsService.updateSegmentStatus(id, status);
  }
}

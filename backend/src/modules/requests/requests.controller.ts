import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ScheduleRequestDto } from './dto/schedule-request.dto';
import { RescheduleRequestDto, RejectRequestDto } from './dto/reschedule-reject.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, RequestStatus, DepartmentType } from '@prisma/client';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles(Role.DEPARTMENT, Role.ADMIN) // LOCO PILOTS ARE STRICTLY FORBIDDEN (403)
  @UseInterceptors(FilesInterceptor('photos', 5))
  async createRequest(
    @CurrentUser() user: { id: string },
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Parse requiredDepartments if passed as JSON string from multipart/form-data
    let requiredDepartments = body.requiredDepartments;
    if (typeof requiredDepartments === 'string') {
      try {
        requiredDepartments = JSON.parse(requiredDepartments);
      } catch (e) {
        requiredDepartments = [requiredDepartments];
      }
    }

    const dto: CreateRequestDto = {
      title: body.title,
      description: body.description,
      segmentId: body.segmentId,
      reportingDepartment: body.reportingDepartment,
      requiredDepartments: Array.isArray(requiredDepartments) ? requiredDepartments : [body.reportingDepartment],
      observedAt: body.observedAt || new Date().toISOString(),
      estimatedDelayMinutes: Number(body.estimatedDelayMinutes || 30),
      severity: body.severity,
    };

    return this.requestsService.createRequest(user.id, dto, files);
  }

  @Get()
  async findAll(
    @Query('status') status?: RequestStatus,
    @Query('department') department?: DepartmentType,
    @Query('segmentId') segmentId?: string,
  ) {
    return this.requestsService.findAll({ status, department, segmentId });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.requestsService.findById(id);
  }

  @Patch(':id/schedule')
  @Roles(Role.ADMIN) // ONLY ADMIN CAN SCHEDULE BLOCKS (PILOT GETS 403)
  async scheduleRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; fullName: string },
    @Body() dto: ScheduleRequestDto,
  ) {
    return this.requestsService.scheduleRequest(id, user, dto);
  }

  @Patch(':id/reschedule')
  @Roles(Role.ADMIN)
  async rescheduleRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RescheduleRequestDto,
  ) {
    return this.requestsService.rescheduleRequest(id, user, dto);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  async rejectRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: RejectRequestDto,
  ) {
    return this.requestsService.rejectRequest(id, user, dto);
  }

  @Patch(':id/start')
  @Roles(Role.ADMIN, Role.DEPARTMENT)
  async startRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.requestsService.startRequest(id, user);
  }

  @Patch(':id/resolve')
  @Roles(Role.ADMIN, Role.DEPARTMENT)
  async resolveRequest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.requestsService.resolveRequest(id, user);
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { StorageAdapter, LocalStorageAdapter } from './storage.adapter';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ScheduleRequestDto } from './dto/schedule-request.dto';
import { RescheduleRequestDto, RejectRequestDto } from './dto/reschedule-reject.dto';
import { BlockOptimizer, OptimizationInput } from '../../engine/blockOptimizer';
import { XAIExplainer } from '../../engine/xaiExplainer';
import { RequestStatus, SegmentStatus, DepartmentType, Role } from '@prisma/client';

@Injectable()
export class RequestsService {
  private storage: StorageAdapter;

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {
    this.storage = new LocalStorageAdapter();
  }

  async createRequest(
    userId: string,
    dto: CreateRequestDto,
    files?: Express.Multer.File[],
  ) {
    const segment = await this.prisma.trackSegment.findUnique({
      where: { id: dto.segmentId },
      include: { fromStation: true, toStation: true },
    });
    if (!segment) {
      throw new NotFoundException(`Track segment #${dto.segmentId} not found`);
    }

    // Save uploaded photos
    const photoUrls: string[] = [];
    if (files && files.length > 0) {
      for (const f of files) {
        const url = await this.storage.saveFile(f);
        photoUrls.push(url);
      }
    } else {
      // Default placeholder if none provided
      photoUrls.push('/uploads/sample-track-defect.svg');
    }

    // AI Priority Scoring
    const priorityScore = BlockOptimizer.calculatePriorityScore(
      dto.severity,
      new Date(dto.observedAt),
      dto.estimatedDelayMinutes,
      dto.reportingDepartment,
      segment.isSingleLine,
    );

    // Initial XAI Recommendation
    const activeRequests = await this.prisma.maintenanceRequest.findMany({
      where: { status: { in: [RequestStatus.SCHEDULED, RequestStatus.IN_PROGRESS] } },
      select: {
        id: true,
        segmentId: true,
        scheduledStart: true,
        scheduledEnd: true,
        assignedCrewId: true,
        status: true,
      },
    });

    const trains = await this.prisma.train.findMany({
      select: { id: true, number: true, name: true, currentSegmentId: true, status: true },
    });

    const optInput: OptimizationInput = {
      requestId: 'NEW',
      title: dto.title,
      severity: dto.severity,
      reportingDepartment: dto.reportingDepartment,
      requiredDepartments: dto.requiredDepartments,
      observedAt: new Date(dto.observedAt),
      estimatedDelayMinutes: dto.estimatedDelayMinutes,
      segment: {
        id: segment.id,
        label: segment.label,
        status: segment.status,
        isSingleLine: segment.isSingleLine,
      },
      activeRequests,
      trainsOnCorridor: trains,
    };

    const candidates = BlockOptimizer.generateWindowCandidates(optInput);
    const recommended = candidates.find((c) => c.isRecommended) || candidates[0];
    const xaiExplanation = XAIExplainer.explain(optInput, priorityScore, recommended);

    const request = await this.prisma.maintenanceRequest.create({
      data: {
        reportedById: userId,
        reportingDepartment: dto.reportingDepartment,
        requiredDepartments: dto.requiredDepartments,
        segmentId: dto.segmentId,
        title: dto.title,
        description: dto.description,
        photoUrls,
        observedAt: new Date(dto.observedAt),
        estimatedDelayMinutes: Number(dto.estimatedDelayMinutes),
        severity: dto.severity,
        priorityScore,
        status: RequestStatus.SUBMITTED,
        xaiExplanation: xaiExplanation as any,
      },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
        reportedBy: true,
      },
    });

    // Immutable Audit Log
    await this.auditService.log(
      userId,
      'REQUEST_SUBMITTED',
      null,
      { id: request.id, title: request.title, severity: request.severity, priorityScore },
      request.id,
    );

    // Real-time Push to Admin Queue & Loco Pilots
    this.gateway.broadcastToAdmins('request:new', request);
    this.gateway.broadcastToDepartment(dto.reportingDepartment, 'request:new', request);
    this.gateway.broadcastAll('request:new', request);

    // Broadcast Corridor Alert with Alarm sound to Admin & Chief Loco Pilots
    this.gateway.broadcastCorridorAlert({
      id: `alert-req-${request.id}-${Date.now()}`,
      title: `🚨 Track Block Possession Request Submitted`,
      message: `${dto.reportingDepartment} department submitted a new maintenance request on ${segment.label}. Priority Score: ${priorityScore}. Caution order advisory for Loco Pilots.`,
      sourceRole: 'DEPARTMENT',
      sourceDepartment: dto.reportingDepartment,
      targetAudience: 'Operations Admin & Chief Loco Pilots',
      targetRoles: ['ADMIN', 'USER_PILOT'],
      severity: request.severity,
      segmentLabel: segment.label,
      priorityScore,
      details: request.description,
      requestId: request.id,
      sound: request.severity === 'CRITICAL' || request.severity === 'HIGH' ? 'emergency' : 'alarm',
      timestamp: new Date().toISOString(),
    });

    // Save persistent notification for reporter
    await this.notificationsService.createNotification(
      userId,
      'request_submitted',
      `New maintenance request #${request.id.slice(-6)} submitted for ${segment.label}. Priority Score: ${priorityScore}.`,
      request.id,
    );

    return request;
  }

  async findAll(params: {
    status?: RequestStatus;
    department?: DepartmentType;
    segmentId?: string;
  }) {
    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.department) {
      where.OR = [
        { reportingDepartment: params.department },
        { requiredDepartments: { has: params.department } },
      ];
    }
    if (params.segmentId) where.segmentId = params.segmentId;

    return this.prisma.maintenanceRequest.findMany({
      where,
      include: {
        segment: { include: { fromStation: true, toStation: true } },
        reportedBy: true,
        reviewedBy: true,
      },
      orderBy: [
        { priorityScore: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findById(id: string) {
    const req = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
        reportedBy: true,
        reviewedBy: true,
        auditLogs: { include: { actor: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!req) {
      throw new NotFoundException(`Maintenance request #${id} not found`);
    }

    return req;
  }

  async scheduleRequest(
    id: string,
    adminUser: { id: string; fullName: string },
    dto: ScheduleRequestDto,
  ) {
    const existing = await this.findById(id);
    const beforeState = {
      status: existing.status,
      scheduledStart: existing.scheduledStart,
      scheduledEnd: existing.scheduledEnd,
      assignedCrewId: existing.assignedCrewId,
    };

    const scheduledStart = new Date(dto.scheduledStart);
    const scheduledEnd = new Date(dto.scheduledEnd);

    // Update request
    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.SCHEDULED,
        scheduledStart,
        scheduledEnd,
        assignedCrewId: dto.assignedCrewId,
        reviewedById: adminUser.id,
      },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
        reportedBy: true,
        reviewedBy: true,
      },
    });

    // Update TrackSegment status to PLANNED_POSSESSION
    await this.prisma.trackSegment.update({
      where: { id: existing.segmentId },
      data: { status: SegmentStatus.PLANNED_POSSESSION },
    });

    // Audit Log
    await this.auditService.log(
      adminUser.id,
      'REQUEST_SCHEDULED',
      beforeState,
      {
        status: updated.status,
        scheduledStart,
        scheduledEnd,
        assignedCrewId: dto.assignedCrewId,
        reviewedBy: adminUser.fullName,
      },
      updated.id,
    );

    // Socket.io Real-Time Broadcasts
    const blockPayload = {
      request: updated,
      message: `Block approved for ${updated.segment.label} (${scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
    };

    this.gateway.broadcastToAdmins('request:statusChanged', updated);
    this.gateway.broadcastToAdmins('block:approved', blockPayload);

    // 1. Notify Reporting Department
    this.gateway.broadcastToDepartment(updated.reportingDepartment, 'request:statusChanged', updated);
    await this.notificationsService.createNotification(
      updated.reportedById,
      'request_scheduled',
      `Approved: Block scheduled on ${updated.segment.label} from ${scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Crew: ${dto.assignedCrewId}.`,
      updated.id,
    );

    // 2. Notify all Co-Required Departments
    for (const dept of updated.requiredDepartments) {
      if (dept !== updated.reportingDepartment) {
        this.gateway.broadcastToDepartment(dept, 'request:statusChanged', updated);
        // Find users in that department to persist notification
        const deptUsers = await this.prisma.user.findMany({ where: { department: dept } });
        for (const du of deptUsers) {
          await this.notificationsService.createNotification(
            du.id,
            'request_scheduled',
            `Coordinated Block: Your department (${dept}) is required for joint possession on ${updated.segment.label} starting ${scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            updated.id,
          );
        }
      }
    }

    // 3. Notify Affected Loco Pilots running trains across this corridor segment
    const pilots = await this.prisma.user.findMany({
      where: { role: Role.USER_PILOT },
    });
    for (const pilot of pilots) {
      this.gateway.broadcastToPilot(pilot.id, 'block:approved', blockPayload);
      await this.notificationsService.createNotification(
        pilot.id,
        'block_alert',
        `BLOCK ALERT: Track possession approved on section '${updated.segment.label}'. Expect speed caution orders and caution signalling.`,
        updated.id,
      );
    }

    // 4. Corridor-Wide Emergency/Operation Alert Broadcast with Alarm Sound
    this.gateway.broadcastCorridorAlert({
      id: `alert-sched-${updated.id}-${Date.now()}`,
      title: `🗓️ Maintenance Block Possession Scheduled by Admin`,
      message: `OCC Admin scheduled track block on ${updated.segment.label} (${scheduledStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${scheduledEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}). Caution orders active.`,
      sourceRole: 'ADMIN',
      sourceDepartment: 'OPERATIONS_CONTROL',
      targetAudience: 'All Maintenance Departments & Loco Pilots',
      severity: updated.severity,
      segmentLabel: updated.segment.label,
      priorityScore: updated.priorityScore,
      details: `Crew: ${dto.assignedCrewId}. Co-departments: ${updated.requiredDepartments.join(', ')}`,
      requestId: updated.id,
      sound: 'alarm',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async rescheduleRequest(
    id: string,
    adminUser: { id: string },
    dto: RescheduleRequestDto,
  ) {
    const existing = await this.findById(id);
    const beforeState = {
      status: existing.status,
      scheduledStart: existing.scheduledStart,
      scheduledEnd: existing.scheduledEnd,
    };

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.UNDER_REVIEW,
        scheduledStart: new Date(dto.newStart),
        scheduledEnd: new Date(dto.newEnd),
        reviewedById: adminUser.id,
      },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
      },
    });

    await this.auditService.log(
      adminUser.id,
      'REQUEST_RESCHEDULED',
      beforeState,
      { newStart: dto.newStart, newEnd: dto.newEnd, reason: dto.reason },
      updated.id,
    );

    this.gateway.broadcastToAdmins('request:statusChanged', updated);
    this.gateway.broadcastToDepartment(existing.reportingDepartment, 'request:statusChanged', updated);
    await this.notificationsService.createNotification(
      existing.reportedById,
      'status_change',
      `Request #${id.slice(-6)} rescheduled. Reason: ${dto.reason}`,
      updated.id,
    );

    return updated;
  }

  async rejectRequest(
    id: string,
    adminUser: { id: string },
    dto: RejectRequestDto,
  ) {
    const existing = await this.findById(id);
    const beforeState = { status: existing.status };

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.REJECTED,
        reviewedById: adminUser.id,
      },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
      },
    });

    await this.auditService.log(
      adminUser.id,
      'REQUEST_REJECTED',
      beforeState,
      { reason: dto.reason },
      updated.id,
    );

    this.gateway.broadcastToAdmins('request:statusChanged', updated);
    this.gateway.broadcastToDepartment(existing.reportingDepartment, 'request:statusChanged', updated);
    await this.notificationsService.createNotification(
      existing.reportedById,
      'status_change',
      `Request #${id.slice(-6)} rejected by Chief Controller. Reason: ${dto.reason}`,
      updated.id,
    );

    return updated;
  }

  async startRequest(id: string, user: { id: string }) {
    const existing = await this.findById(id);
    const beforeState = { status: existing.status };

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: { status: RequestStatus.IN_PROGRESS },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
        reportedBy: true,
      },
    });

    // Mark segment as OCCUPIED while work is in progress
    await this.prisma.trackSegment.update({
      where: { id: existing.segmentId },
      data: { status: SegmentStatus.OCCUPIED },
    });

    await this.auditService.log(
      user.id,
      'REQUEST_STARTED',
      beforeState,
      { status: RequestStatus.IN_PROGRESS },
      updated.id,
    );

    this.gateway.broadcastToAdmins('request:statusChanged', updated);
    this.gateway.broadcastToDepartment(existing.reportingDepartment, 'request:statusChanged', updated);

    this.gateway.broadcastCorridorAlert({
      id: `alert-start-${updated.id}-${Date.now()}`,
      title: `⚡ Track Possession Commenced (Gang on Track)`,
      message: `${existing.reportingDepartment} maintenance gang has commenced physical work on ${updated.segment.label}. Track status is now OCCUPIED.`,
      sourceRole: 'DEPARTMENT',
      sourceDepartment: existing.reportingDepartment,
      targetAudience: 'Operations Admin, All Maintenance Gangs, Loco Pilots',
      severity: updated.severity,
      segmentLabel: updated.segment.label,
      priorityScore: updated.priorityScore,
      details: updated.title,
      requestId: updated.id,
      sound: 'warning',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async resolveRequest(id: string, user: { id: string }) {
    const existing = await this.findById(id);
    const beforeState = { status: existing.status };

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: RequestStatus.RESOLVED,
      },
      include: {
        segment: { include: { fromStation: true, toStation: true } },
      },
    });

    // Check if segment has any other active requests; if not, restore NORMAL
    const otherActive = await this.prisma.maintenanceRequest.count({
      where: {
        segmentId: existing.segmentId,
        id: { not: id },
        status: { in: [RequestStatus.SCHEDULED, RequestStatus.IN_PROGRESS] },
      },
    });

    if (otherActive === 0) {
      await this.prisma.trackSegment.update({
        where: { id: existing.segmentId },
        data: { status: SegmentStatus.NORMAL },
      });
    }

    await this.auditService.log(
      user.id,
      'REQUEST_RESOLVED',
      beforeState,
      { status: RequestStatus.RESOLVED },
      updated.id,
    );

    this.gateway.broadcastAll('request:statusChanged', updated);

    this.gateway.broadcastCorridorAlert({
      id: `alert-res-${updated.id}-${Date.now()}`,
      title: `✅ Track Block Cleared & Operations Restored`,
      message: `Maintenance completed on ${updated.segment.label}. Track possession returned to Traffic. Normal speed resumed.`,
      sourceRole: 'DEPARTMENT',
      sourceDepartment: existing.reportingDepartment,
      targetAudience: 'Operations Admin, All Maintenance Gangs, Loco Pilots',
      severity: 'LOW',
      segmentLabel: updated.segment.label,
      priorityScore: 0,
      details: updated.title,
      requestId: updated.id,
      sound: 'chime',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }
}

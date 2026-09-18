import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { BlockOptimizer, OptimizationInput } from '../../engine/blockOptimizer';
import { XAIExplainer } from '../../engine/xaiExplainer';
import { WeeklyMonthlyPlanner } from '../../engine/weeklyMonthlyPlanner';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class OptimizerService {
  constructor(private prisma: PrismaService) {}

  async getRecommendation(requestId: string) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        segment: true,
        reportedBy: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request #${requestId} not found`);
    }

    const activeRequests = await this.prisma.maintenanceRequest.findMany({
      where: {
        id: { not: requestId },
        status: { in: [RequestStatus.SCHEDULED, RequestStatus.IN_PROGRESS, RequestStatus.UNDER_REVIEW] },
      },
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
      select: {
        id: true,
        number: true,
        name: true,
        currentSegmentId: true,
        status: true,
      },
    });

    const optInput: OptimizationInput = {
      requestId: request.id,
      title: request.title,
      severity: request.severity,
      reportingDepartment: request.reportingDepartment,
      requiredDepartments: request.requiredDepartments,
      observedAt: request.observedAt,
      estimatedDelayMinutes: request.estimatedDelayMinutes,
      segment: {
        id: request.segment.id,
        label: request.segment.label,
        status: request.segment.status,
        isSingleLine: request.segment.isSingleLine,
      },
      activeRequests,
      trainsOnCorridor: trains,
    };

    const priorityScore = BlockOptimizer.calculatePriorityScore(
      request.severity,
      request.observedAt,
      request.estimatedDelayMinutes,
      request.reportingDepartment,
      request.segment.isSingleLine,
    );

    const candidates = BlockOptimizer.generateWindowCandidates(optInput);
    const recommendedCandidate = candidates.find((c) => c.isRecommended) || candidates[0];

    const xaiExplanation = XAIExplainer.explain(optInput, priorityScore, recommendedCandidate);

    return {
      requestId: request.id,
      computedPriorityScore: priorityScore,
      candidates,
      recommended: recommendedCandidate,
      xaiExplanation,
    };
  }

  async getWeeklySchedule() {
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        status: { in: [RequestStatus.SCHEDULED, RequestStatus.IN_PROGRESS, RequestStatus.SUBMITTED, RequestStatus.UNDER_REVIEW] },
      },
      include: {
        segment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return WeeklyMonthlyPlanner.buildWeeklySwimlanes(requests);
  }

  async getMonthlyHeatmap() {
    const requests = await this.prisma.maintenanceRequest.findMany({
      select: {
        id: true,
        scheduledStart: true,
        scheduledEnd: true,
        status: true,
      },
    });

    return WeeklyMonthlyPlanner.buildMonthlyHeatmap(requests);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SegmentStatus } from '@prisma/client';

@Injectable()
export class SegmentsService {
  constructor(private prisma: PrismaService) {}

  async getAllSegments() {
    return this.prisma.trackSegment.findMany({
      include: {
        fromStation: true,
        toStation: true,
        maintenanceRequests: {
          where: {
            status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS'] },
          },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            reportingDepartment: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllStations() {
    return this.prisma.station.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async getNetworkStatusOverview() {
    const segments = await this.prisma.trackSegment.findMany();
    const counts = {
      NORMAL: 0,
      OCCUPIED: 0,
      PLANNED_POSSESSION: 0,
      DISRUPTED: 0,
      CONFLICT: 0,
      total: segments.length,
    };

    for (const seg of segments) {
      counts[seg.status] = (counts[seg.status] || 0) + 1;
    }

    return counts;
  }

  async updateSegmentStatus(id: string, status: SegmentStatus) {
    const segment = await this.prisma.trackSegment.findUnique({ where: { id } });
    if (!segment) {
      throw new NotFoundException(`Segment #${id} not found`);
    }

    return this.prisma.trackSegment.update({
      where: { id },
      data: { status },
    });
  }
}

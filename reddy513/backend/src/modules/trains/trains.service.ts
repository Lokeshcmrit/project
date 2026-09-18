import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class TrainsService {
  constructor(private prisma: PrismaService) {}

  async getAllTrains() {
    return this.prisma.train.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async getMyTrainData(userId: string) {
    // Find pilot user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Pilot user not found');
    }

    // Find assigned train
    let train = null;
    if (user.assignedTrainId) {
      train = await this.prisma.train.findUnique({
        where: { id: user.assignedTrainId },
      });
    }

    if (!train) {
      // If no assigned train, fallback to first train
      train = await this.prisma.train.findFirst({
        where: { pilotUserId: userId },
      }) || await this.prisma.train.findFirst();
    }

    if (!train) {
      throw new NotFoundException('No train assigned');
    }

    // Load origin and destination stations
    const [originStation, destStation] = await Promise.all([
      this.prisma.station.findUnique({ where: { id: train.originStationId } }),
      this.prisma.station.findUnique({ where: { id: train.destinationStationId } }),
    ]);

    // Load current segment if any
    let currentSegment = null;
    if (train.currentSegmentId) {
      currentSegment = await this.prisma.trackSegment.findUnique({
        where: { id: train.currentSegmentId },
        include: { fromStation: true, toStation: true },
      });
    }

    // Find all track segments on the route
    const allSegments = await this.prisma.trackSegment.findMany({
      include: { fromStation: true, toStation: true },
      orderBy: { createdAt: 'asc' },
    });

    // Find active maintenance blocks on the corridor
    const activeBlocks = await this.prisma.maintenanceRequest.findMany({
      where: {
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        segment: {
          include: { fromStation: true, toStation: true },
        },
      },
      orderBy: { scheduledStart: 'asc' },
    });

    return {
      train,
      originStation,
      destinationStation: destStation,
      currentSegment,
      allSegments,
      activeBlocks,
    };
  }

  async getBlockAlertsForPilot(userId: string) {
    const trainData = await this.getMyTrainData(userId);
    return trainData.activeBlocks;
  }
}

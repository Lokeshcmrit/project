import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(actorId: string, action: string, beforeState: any, afterState: any, relatedRequestId?: string) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        beforeState: beforeState || {},
        afterState: afterState || {},
        relatedRequestId: relatedRequestId || null,
      },
    });
  }

  async getAllLogs() {
    return this.prisma.auditLog.findMany({
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            employeeId: true,
            role: true,
            department: true,
          },
        },
        relatedRequest: {
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

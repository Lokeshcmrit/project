import { DepartmentType, RequestStatus } from '@prisma/client';

export interface WeeklySwimlaneItem {
  id: string;
  requestId: string;
  title: string;
  department: DepartmentType;
  requiredDepartments: DepartmentType[];
  segmentLabel: string;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  dateStr: string;
  startHour: number;
  durationHours: number;
  status: RequestStatus;
  crewName?: string;
  isMultiDept: boolean;
}

export interface MonthlyHeatmapCell {
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  availabilityPercentage: number; // 0 to 100%
  totalDowntimeMinutes: number;
  blocksScheduled: number;
  conflictCount: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export class WeeklyMonthlyPlanner {
  /**
   * Builds 7-day department swimlanes for Gantt scheduling
   */
  static buildWeeklySwimlanes(
    requests: Array<{
      id: string;
      title: string;
      reportingDepartment: DepartmentType;
      requiredDepartments: DepartmentType[];
      status: RequestStatus;
      scheduledStart: Date | null;
      scheduledEnd: Date | null;
      assignedCrewId: string | null;
      segment: { label: string };
    }>,
  ): Record<DepartmentType, WeeklySwimlaneItem[]> {
    const swimlanes: Record<DepartmentType, WeeklySwimlaneItem[]> = {
      [DepartmentType.ENGINEERING]: [],
      [DepartmentType.TRACTION_DISTRIBUTION]: [],
      [DepartmentType.SIGNAL_TELECOM]: [],
    };

    const now = new Date();

    for (const req of requests) {
      const start = req.scheduledStart ? new Date(req.scheduledStart) : new Date(now.getTime() + 4 * 3600 * 1000);
      const end = req.scheduledEnd ? new Date(req.scheduledEnd) : new Date(start.getTime() + 2.5 * 3600 * 1000);

      const durationHours = Math.max(1, Math.round(((end.getTime() - start.getTime()) / (1000 * 3600)) * 10) / 10);
      const dayOfWeek = start.getDay();
      const dateStr = start.toISOString().split('T')[0];
      const startHour = start.getHours() + Math.round((start.getMinutes() / 60) * 10) / 10;
      const isMultiDept = req.requiredDepartments.length > 1;

      const item: WeeklySwimlaneItem = {
        id: `SWIM-${req.id}`,
        requestId: req.id,
        title: req.title,
        department: req.reportingDepartment,
        requiredDepartments: req.requiredDepartments,
        segmentLabel: req.segment?.label || 'Corridor Segment',
        dayOfWeek,
        dateStr,
        startHour,
        durationHours,
        status: req.status,
        crewName: req.assignedCrewId || 'Assigned Gang',
        isMultiDept,
      };

      // Push into all required department swimlanes so multi-department coordination is visually obvious
      for (const dept of req.requiredDepartments) {
        swimlanes[dept].push({ ...item, department: dept });
      }
    }

    return swimlanes;
  }

  /**
   * Generates 30-day corridor asset availability heatmap
   */
  static buildMonthlyHeatmap(
    requests: Array<{
      id: string;
      scheduledStart: Date | null;
      scheduledEnd: Date | null;
      status: RequestStatus;
    }>,
  ): MonthlyHeatmapCell[] {
    const cells: MonthlyHeatmapCell[] = [];
    const today = new Date();

    for (let dayOffset = -7; dayOffset < 23; dayOffset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Find blocks falling on this date
      const dayBlocks = requests.filter((r) => {
        if (!r.scheduledStart) return false;
        const blockDate = new Date(r.scheduledStart).toISOString().split('T')[0];
        return blockDate === dateStr;
      });

      let totalDowntimeMinutes = 0;
      for (const b of dayBlocks) {
        if (b.scheduledStart && b.scheduledEnd) {
          totalDowntimeMinutes += Math.round(
            (new Date(b.scheduledEnd).getTime() - new Date(b.scheduledStart).getTime()) / (60 * 1000),
          );
        } else {
          totalDowntimeMinutes += 120; // Default estimate
        }
      }

      // 24 hours = 1440 minutes corridor availability capacity
      const maxCorridorMinutes = 1440;
      const availabilityPercentage = Math.max(
        65,
        Math.round(((maxCorridorMinutes - totalDowntimeMinutes) / maxCorridorMinutes) * 1000) / 10,
      );

      let riskLevel: MonthlyHeatmapCell['riskLevel'] = 'LOW';
      if (availabilityPercentage < 80) riskLevel = 'CRITICAL';
      else if (availabilityPercentage < 88) riskLevel = 'HIGH';
      else if (availabilityPercentage < 94) riskLevel = 'MODERATE';

      cells.push({
        dateStr,
        dayOfMonth: d.getDate(),
        availabilityPercentage,
        totalDowntimeMinutes,
        blocksScheduled: dayBlocks.length,
        conflictCount: dayBlocks.filter((b) => b.status === RequestStatus.UNDER_REVIEW).length,
        riskLevel,
      });
    }

    return cells;
  }
}

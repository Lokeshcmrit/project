import { Severity, SegmentStatus, DepartmentType } from '@prisma/client';

export interface BlockWindowCandidate {
  id: string;
  label: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  possessionType: 'FULL_BLOCK' | 'SHADOW_BLOCK' | 'POWER_BLOCK' | 'CAUTION_ORDER';
  recommendedCrewId: string;
  crewName: string;
  conflicts: string[];
  fitnessScore: number; // 0 to 100
  isRecommended: boolean;
  xaiReasoning: string[];
}

export interface OptimizationInput {
  requestId: string;
  title: string;
  severity: Severity;
  reportingDepartment: DepartmentType;
  requiredDepartments: DepartmentType[];
  observedAt: Date;
  estimatedDelayMinutes: number;
  segment: {
    id: string;
    label: string;
    status: SegmentStatus;
    isSingleLine: boolean;
  };
  activeRequests: Array<{
    id: string;
    segmentId: string;
    scheduledStart: Date | null;
    scheduledEnd: Date | null;
    assignedCrewId: string | null;
    status: string;
  }>;
  trainsOnCorridor: Array<{
    id: string;
    number: string;
    name: string;
    currentSegmentId: string | null;
    status: string;
  }>;
}

export class BlockOptimizer {
  // Configured weights:
  private static readonly W_SEVERITY = 0.35;
  private static readonly W_URGENCY = 0.25;
  private static readonly W_SAFETY = 0.20;
  private static readonly W_ASSET = 0.20;

  /**
   * Computes multi-factor priority score (0 - 100)
   */
  static calculatePriorityScore(
    severity: Severity,
    observedAt: Date,
    estimatedDelayMinutes: number,
    reportingDepartment: DepartmentType,
    isSingleLine: boolean,
  ): number {
    // 1. Severity weight
    let sevScore = 25;
    if (severity === Severity.CRITICAL) sevScore = 100;
    else if (severity === Severity.HIGH) sevScore = 75;
    else if (severity === Severity.MEDIUM) sevScore = 50;

    // 2. Urgency calculation based on hours elapsed vs delay impact
    const hoursElapsed = Math.max(0, (Date.now() - new Date(observedAt).getTime()) / (1000 * 3600));
    let urgencyScore = Math.min(100, Math.max(20, (hoursElapsed * 15) + (estimatedDelayMinutes * 0.4)));

    // 3. Department Safety risk weight
    let safetyScore = 50;
    if (reportingDepartment === DepartmentType.TRACTION_DISTRIBUTION) {
      safetyScore = 90; // 25kV OHE electrical & pantograph entanglement hazard
    } else if (reportingDepartment === DepartmentType.SIGNAL_TELECOM) {
      safetyScore = 95; // Electronic interlocking / Point failure collision hazard
    } else if (reportingDepartment === DepartmentType.ENGINEERING) {
      safetyScore = severity === Severity.CRITICAL ? 100 : 80; // Derailment risk
    }

    // 4. Asset Availability impact (Single line is a severe network bottleneck)
    const assetScore = isSingleLine ? 95 : 65;

    const composite = (
      this.W_SEVERITY * sevScore +
      this.W_URGENCY * urgencyScore +
      this.W_SAFETY * safetyScore +
      this.W_ASSET * assetScore
    );

    return Math.round(composite * 10) / 10;
  }

  /**
   * Detects operational conflicts against candidate block window
   */
  static detectConflicts(
    startTime: Date,
    endTime: Date,
    segmentId: string,
    crewId: string,
    activeRequests: OptimizationInput['activeRequests'],
    trains: OptimizationInput['trainsOnCorridor'],
    isSingleLine: boolean,
  ): string[] {
    const conflicts: string[] = [];

    // Rule (a): Same crew double-booked in overlapping windows
    const crewCollision = activeRequests.find(
      (r) =>
        r.assignedCrewId === crewId &&
        r.scheduledStart &&
        r.scheduledEnd &&
        this.timeOverlaps(startTime, endTime, new Date(r.scheduledStart), new Date(r.scheduledEnd)),
    );
    if (crewCollision) {
      conflicts.push(`Crew '${crewId}' is already deployed on Request #${crewCollision.id.slice(-5)} in this time window.`);
    }

    // Rule (b): Two possessions overlapping the same segment
    const segmentOverlap = activeRequests.find(
      (r) =>
        r.segmentId === segmentId &&
        r.scheduledStart &&
        r.scheduledEnd &&
        this.timeOverlaps(startTime, endTime, new Date(r.scheduledStart), new Date(r.scheduledEnd)),
    );
    if (segmentOverlap) {
      conflicts.push(`Overlapping track possession scheduled on this segment (#${segmentOverlap.id.slice(-5)}).`);
    }

    // Rule (c): Scheduled train slot overlap on single-line section
    if (isSingleLine) {
      const activeTrain = trains.find((t) => t.currentSegmentId === segmentId);
      if (activeTrain) {
        conflicts.push(`Single-line bottleneck: Train ${activeTrain.number} (${activeTrain.name}) is actively scheduled across this block.`);
      }
    }

    return conflicts;
  }

  /**
   * Generates candidate block windows and selects optimal proposal
   */
  static generateWindowCandidates(input: OptimizationInput): BlockWindowCandidate[] {
    const baseDate = new Date();
    const candidates: BlockWindowCandidate[] = [];

    // Candidate 1: Immediate Shadow Block Window (Next 2-3 hours)
    const start1 = new Date(baseDate.getTime() + 90 * 60 * 1000);
    start1.setMinutes(0, 0, 0);
    const end1 = new Date(start1.getTime() + 150 * 60 * 1000); // 2.5 hours

    // Candidate 2: Midday Traffic Lull Window (11:30 - 13:45)
    const start2 = new Date(baseDate);
    start2.setHours(11, 30, 0, 0);
    if (start2.getTime() < baseDate.getTime()) {
      start2.setDate(start2.getDate() + 1);
    }
    const end2 = new Date(start2.getTime() + 135 * 60 * 1000); // 2 hrs 15 mins

    // Candidate 3: Night Shadow Window (01:00 - 04:00 off-peak)
    const start3 = new Date(baseDate);
    start3.setDate(start3.getDate() + 1);
    start3.setHours(1, 0, 0, 0);
    const end3 = new Date(start3.getTime() + 180 * 60 * 1000); // 3 hours

    const crews = [
      { id: 'CREW-KZJ-01', name: 'Kazipet Rapid Action Maintenance Gang #1' },
      { id: 'CREW-BZA-04', name: 'Vijayawada Heavy Track Machines & OHE Squad' },
      { id: 'CREW-RJY-02', name: 'Rajahmundry Integrated S&T & P-Way Team' },
    ];

    const windowDefs = [
      {
        id: 'WIN-OPT-1',
        label: 'Priority Operational Window (Integrated Joint Block)',
        startTime: start1,
        endTime: end1,
        durationMinutes: 150,
        possessionType: 'FULL_BLOCK' as const,
        crew: crews[0],
      },
      {
        id: 'WIN-OPT-2',
        label: 'Passenger Off-Peak Traffic Lull Window',
        startTime: start2,
        endTime: end2,
        durationMinutes: 135,
        possessionType: 'SHADOW_BLOCK' as const,
        crew: crews[1],
      },
      {
        id: 'WIN-OPT-3',
        label: 'Night Low-Density Corridor Window',
        startTime: start3,
        endTime: end3,
        durationMinutes: 180,
        possessionType: 'POWER_BLOCK' as const,
        crew: crews[2],
      },
    ];

    for (let i = 0; i < windowDefs.length; i++) {
      const def = windowDefs[i];
      const conflicts = this.detectConflicts(
        def.startTime,
        def.endTime,
        input.segment.id,
        def.crew.id,
        input.activeRequests,
        input.trainsOnCorridor,
        input.segment.isSingleLine,
      );

      // Score fitness: penalize conflicts heavily
      let fitnessScore = 95 - (conflicts.length * 40);
      if (input.severity === Severity.CRITICAL && i === 0) {
        fitnessScore += 5; // Urgency bonus for immediate window on critical defects
      }

      candidates.push({
        id: def.id,
        label: def.label,
        startTime: def.startTime,
        endTime: def.endTime,
        durationMinutes: def.durationMinutes,
        possessionType: def.possessionType,
        recommendedCrewId: def.crew.id,
        crewName: def.crew.name,
        conflicts,
        fitnessScore: Math.max(10, Math.min(100, fitnessScore)),
        isRecommended: false,
        xaiReasoning: [],
      });
    }

    // Mark top candidate as recommended
    candidates.sort((a, b) => b.fitnessScore - a.fitnessScore);
    if (candidates.length > 0) {
      candidates[0].isRecommended = true;
    }

    return candidates;
  }

  private static timeOverlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
  }
}

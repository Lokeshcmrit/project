import { BlockOptimizer, OptimizationInput } from './blockOptimizer';
import { Severity, SegmentStatus, DepartmentType } from '@prisma/client';

describe('BlockOptimizer Unit Tests', () => {
  describe('Priority Scoring Formula', () => {
    it('should compute highest priority for Critical S&T defect on single-line section', () => {
      const score = BlockOptimizer.calculatePriorityScore(
        Severity.CRITICAL,
        new Date(Date.now() - 3600 * 1000 * 3), // 3 hours ago
        90, // 90 min delay
        DepartmentType.SIGNAL_TELECOM,
        true, // isSingleLine
      );

      // Should be heavily weighted towards maximum
      expect(score).toBeGreaterThanOrEqual(85);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should compute lower priority score for Low severity non-single line defect', () => {
      const score = BlockOptimizer.calculatePriorityScore(
        Severity.LOW,
        new Date(), // just now
        10, // 10 min delay
        DepartmentType.ENGINEERING,
        false, // double line
      );

      expect(score).toBeLessThan(65);
    });
  });

  describe('Conflict Detection Engine', () => {
    const activeRequests: OptimizationInput['activeRequests'] = [
      {
        id: 'REQ-101',
        segmentId: 'SEG-1',
        scheduledStart: new Date('2026-09-17T10:00:00Z'),
        scheduledEnd: new Date('2026-09-17T12:00:00Z'),
        assignedCrewId: 'CREW-ALPHA',
        status: 'SCHEDULED',
      },
    ];

    const trains: OptimizationInput['trainsOnCorridor'] = [
      {
        id: 'TRN-1',
        number: '12727',
        name: 'Godavari Express',
        currentSegmentId: 'SEG-1',
        status: 'on_time',
      },
    ];

    it('should detect crew double-booking conflict', () => {
      const conflicts = BlockOptimizer.detectConflicts(
        new Date('2026-09-17T10:30:00Z'),
        new Date('2026-09-17T11:30:00Z'),
        'SEG-OTHER',
        'CREW-ALPHA',
        activeRequests,
        trains,
        false,
      );

      expect(conflicts.some((c) => c.includes('already deployed'))).toBe(true);
    });

    it('should detect segment possession overlap conflict', () => {
      const conflicts = BlockOptimizer.detectConflicts(
        new Date('2026-09-17T11:00:00Z'),
        new Date('2026-09-17T13:00:00Z'),
        'SEG-1',
        'CREW-BETA',
        activeRequests,
        trains,
        false,
      );

      expect(conflicts.some((c) => c.includes('Overlapping track possession'))).toBe(true);
    });

    it('should return no conflicts for non-overlapping window and unique crew', () => {
      const conflicts = BlockOptimizer.detectConflicts(
        new Date('2026-09-17T14:00:00Z'),
        new Date('2026-09-17T16:00:00Z'),
        'SEG-2',
        'CREW-GAMMA',
        activeRequests,
        trains,
        false,
      );

      expect(conflicts.length).toBe(0);
    });
  });
});

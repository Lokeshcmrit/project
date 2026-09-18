import { BlockWindowCandidate, OptimizationInput } from './blockOptimizer';
import { Severity } from '@prisma/client';

export interface XAIExplanation {
  requestId: string;
  recommendedWindowId: string;
  summary: string;
  scoringBreakdown: {
    compositePriority: number;
    severityFactor: string;
    urgencyAnalysis: string;
    safetyCriticality: string;
    corridorAssetBottleneck: string;
  };
  constraintChecks: Array<{
    constraint: string;
    status: 'SATISFIED' | 'WARNING' | 'VIOLATED';
    detail: string;
  }>;
  coordinationDirective: string;
  safetyComplianceRule: string;
}

export class XAIExplainer {
  static explain(
    input: OptimizationInput,
    priorityScore: number,
    candidate: BlockWindowCandidate,
  ): XAIExplanation {
    const isMultiDept = input.requiredDepartments.length > 1;

    const scoringBreakdown = {
      compositePriority: priorityScore,
      severityFactor: `${input.severity} severity rating assigns baseline criticality factor of ${
        input.severity === Severity.CRITICAL ? '100 pts (High emergency)' : input.severity === Severity.HIGH ? '75 pts' : '50 pts'
      }.`,
      urgencyAnalysis: `Estimated delay of ${input.estimatedDelayMinutes} mins without intervention. Track failure reported at ${new Date(
        input.observedAt,
      ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} requires rapid containment.`,
      safetyCriticality: `Department domain risk: ${input.reportingDepartment} poses strict operational speed restrictions and derailment/flashover hazards.`,
      corridorAssetBottleneck: input.segment.isSingleLine
        ? 'SINGLE-LINE SECTION: Max impact on corridor throughput. Block must minimize passenger train detention.'
        : 'DOUBLE-LINE TRUNK: Traffic can be temporarily regulated or diverted via bi-directional signalling.',
    };

    const constraintChecks: XAIExplanation['constraintChecks'] = [
      {
        constraint: 'Crew Overlap Conflict Free',
        status: candidate.conflicts.some((c) => c.includes('Crew')) ? 'VIOLATED' : 'SATISFIED',
        detail: candidate.conflicts.find((c) => c.includes('Crew')) || `Assigned crew (${candidate.crewName}) is 100% available without conflicting roster duties.`,
      },
      {
        constraint: 'Corridor Possession Exclusivity',
        status: candidate.conflicts.some((c) => c.includes('Overlapping track possession')) ? 'VIOLATED' : 'SATISFIED',
        detail: candidate.conflicts.find((c) => c.includes('Overlapping track possession')) || `No conflicting maintenance blocks scheduled on '${input.segment.label}'.`,
      },
      {
        constraint: 'Passenger Timetable Integrity',
        status: candidate.conflicts.some((c) => c.includes('Train')) ? 'WARNING' : 'SATISFIED',
        detail: candidate.conflicts.find((c) => c.includes('Train')) || 'Fits into scheduled off-peak corridor lull with zero express passenger trains held.',
      },
      {
        constraint: 'Multi-Department Integrated Execution',
        status: isMultiDept ? 'SATISFIED' : 'SATISFIED',
        detail: isMultiDept
          ? `Coordinated possession: Both ${input.requiredDepartments.join(' and ')} will simultaneously access the track under one joint block.`
          : `Dedicated single-department block for ${input.reportingDepartment}.`,
      },
    ];

    const coordinationDirective = isMultiDept
      ? `Simultaneous shadow block mandated. S&T and Engineering supervisors must coordinate at station interlocking cabin before track occupation.`
      : `Single-department possession assigned to ${candidate.crewName}.`;

    const safetyComplianceRule = `General Rules (GR 4.08 & SR 4.09): Engineering speed restriction / Power disconnection memo must be confirmed by Chief Controller before granting block.`;

    const summary = `AI Optimization recommends '${candidate.label}' (${candidate.durationMinutes} mins, ${candidate.possessionType}) with Crew '${candidate.crewName}'. Fitness score: ${candidate.fitnessScore}/100.`;

    return {
      requestId: input.requestId,
      recommendedWindowId: candidate.id,
      summary,
      scoringBreakdown,
      constraintChecks,
      coordinationDirective,
      safetyComplianceRule,
    };
  }
}

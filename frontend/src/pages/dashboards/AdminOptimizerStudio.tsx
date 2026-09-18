import React, { useEffect, useState } from 'react';
import { requestsAPI, optimizerAPI } from '../../api/client';
import {
  Brain,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckSquare,
  Users,
  Calendar,
  Layers,
  Zap,
  ArrowRight,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminOptimizerStudio() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const [optResult, setOptResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduledSuccess, setScheduledSuccess] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const res = await requestsAPI.getAll();
      setRequests(res.data || []);
      if (res.data?.length > 0 && !selectedRequestId) {
        // Pick first pending or un-scheduled request by default
        const pending = res.data.find((r: any) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW') || res.data[0];
        setSelectedRequestId(pending.id);
      }
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const runOptimizer = async (reqId: string) => {
    if (!reqId) return;
    try {
      setOptimizing(true);
      setScheduledSuccess(false);
      const res = await optimizerAPI.recommend(reqId);
      setOptResult(res.data);
      if (res.data?.recommended?.id) {
        setSelectedCandidateId(res.data.recommended.id);
      }
    } catch (err) {
      console.error('Optimizer execution failed:', err);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    if (selectedRequestId) {
      runOptimizer(selectedRequestId);
    }
  }, [selectedRequestId]);

  const activeRequest = requests.find((r) => r.id === selectedRequestId);

  const handleScheduleCandidate = async (candidate: any) => {
    if (!selectedRequestId || !candidate) return;
    try {
      setScheduling(true);
      await requestsAPI.schedule(selectedRequestId, {
        scheduledStart: new Date(candidate.startTime).toISOString(),
        scheduledEnd: new Date(candidate.endTime).toISOString(),
        assignedCrewId: candidate.recommendedCrewId,
      });
      setScheduledSuccess(true);
      await loadRequests();
      await runOptimizer(selectedRequestId);
    } catch (err) {
      console.error('Failed to schedule block window:', err);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card p-6 border-l-4 border-yellow-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
            <Brain size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Outfit' }}>
                AI Block Optimization Studio
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50 uppercase">
                Explainable AI (XAI)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Multi-factor heuristic scheduling algorithm computing conflict-free possession windows across the corridor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => runOptimizer(selectedRequestId)}
            disabled={optimizing || !selectedRequestId}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-semibold text-xs transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={15} className={optimizing ? 'animate-spin' : ''} />
            {optimizing ? 'Calculating Solutions…' : 'Re-Run Optimizer'}
          </button>
        </div>
      </div>

      {/* Target Request Selector & Overview Bar */}
      <div className="glass-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Select Defect Request to Optimize
            </label>
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="w-full bg-[#0a192f] border border-[#1f3e72] rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.severity}] {r.title} — {r.segment?.label} ({r.reportingDepartment}) [{r.status}]
                </option>
              ))}
            </select>
          </div>

          {activeRequest && (
            <div className="flex items-center gap-4 bg-[#0a192f]/60 p-3 rounded-xl border border-[#1f3e72] text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Section</span>
                <span className="font-bold text-slate-200">{activeRequest.segment?.label}</span>
              </div>
              <div className="border-l border-[#1f3e72] pl-3">
                <span className="text-slate-500 block text-[10px] uppercase">Severity</span>
                <span
                  className={`font-bold uppercase ${
                    activeRequest.severity === 'CRITICAL'
                      ? 'text-red-400'
                      : activeRequest.severity === 'HIGH'
                      ? 'text-orange-400'
                      : 'text-amber-400'
                  }`}
                >
                  {activeRequest.severity}
                </span>
              </div>
              <div className="border-l border-[#1f3e72] pl-3">
                <span className="text-slate-500 block text-[10px] uppercase">Current Status</span>
                <span className="font-bold text-blue-400">{activeRequest.status}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {scheduledSuccess && (
        <div className="glass-card p-4 border-l-4 border-emerald-500 bg-emerald-950/30 text-emerald-200 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-400" size={20} />
            <span>
              <strong>Success!</strong> Block window officially approved and scheduled into railway operational roster.
              Audit log recorded and Loco Pilots notified via real-time WebSocket alert.
            </span>
          </div>
          <button onClick={() => setScheduledSuccess(false)} className="text-xs text-emerald-400 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Optimizer Workbench Content */}
      {optimizing ? (
        <div className="glass-card p-16 text-center text-slate-400">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base font-bold text-white">Running Multi-Agent Block Optimizer…</p>
          <p className="text-xs text-slate-500 mt-1">Analyzing timetable train slots, crew availability, and single-line bottlenecks</p>
        </div>
      ) : !optResult ? (
        <div className="glass-card p-12 text-center text-slate-400">
          Select a request above to run the block optimization engine.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Priority Score & Core Formulation Metric Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 border-l-4 border-blue-500">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Calculated Priority Score
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Outfit' }}>
                  {optResult.computedPriorityScore}
                </span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <p className="text-[11px] text-blue-400 mt-1 font-semibold">
                {optResult.computedPriorityScore >= 80
                  ? 'Critical Dispatch Priority'
                  : optResult.computedPriorityScore >= 60
                  ? 'High Priority Allocation'
                  : 'Normal Maintenance Window'}
              </p>
            </div>

            <div className="glass-card p-5 border-l-4 border-amber-500">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Recommended Window
              </span>
              <p className="text-lg font-bold text-amber-300 mt-2 truncate">
                {optResult.recommended?.label}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Duration: <strong className="text-white">{optResult.recommended?.durationMinutes} mins</strong> (
                {optResult.recommended?.possessionType?.replace('_', ' ')})
              </p>
            </div>

            <div className="glass-card p-5 border-l-4 border-emerald-500">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Optimal Crew Allocation
              </span>
              <p className="text-sm font-bold text-emerald-300 mt-2 truncate">
                {optResult.recommended?.crewName}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">ID: {optResult.recommended?.recommendedCrewId}</p>
            </div>

            <div className="glass-card p-5 border-l-4 border-purple-500">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                AI Optimization Confidence
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-extrabold text-purple-300" style={{ fontFamily: 'Outfit' }}>
                  {optResult.recommended?.fitnessScore}%
                </span>
              </div>
              <p className="text-[11px] text-purple-400 mt-1 font-semibold">
                {optResult.recommended?.conflicts?.length === 0 ? 'Zero Corridor Conflicts' : `${optResult.recommended?.conflicts?.length} Non-Fatal Warnings`}
              </p>
            </div>
          </div>

          {/* Candidate Block Windows Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'Outfit' }}>
                  Candidate Block Windows Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  Select between the AI-generated window alternatives and inspect operational trade-offs.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {optResult.candidates?.map((cand: any, idx: number) => {
                const isRec = cand.isRecommended;
                const isSelected = selectedCandidateId === cand.id;
                const hasConflicts = cand.conflicts && cand.conflicts.length > 0;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={`glass-card p-5 cursor-pointer border transition-all duration-200 relative flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-blue-400 border-blue-500 shadow-2xl bg-[#0f2850]'
                        : 'hover:border-slate-600'
                    }`}
                  >
                    {isRec && (
                      <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-[10px] uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Sparkles size={11} /> AI Top Recommendation
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-slate-400 uppercase font-semibold">Option {idx + 1}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-950 border border-blue-800 text-blue-300">
                          {cand.possessionType?.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
                        {cand.label}
                      </h4>

                      {/* Window Time */}
                      <div className="bg-[#0a192f] p-3 rounded-xl border border-[#1f3e72] space-y-1 text-xs mb-4">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Start Time:</span>
                          <span className="font-bold text-slate-200">
                            {format(new Date(cand.startTime), 'dd MMM, HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">End Time:</span>
                          <span className="font-bold text-slate-200">
                            {format(new Date(cand.endTime), 'dd MMM, HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-[#1f3e72]/60">
                          <span className="text-slate-400">Total Duration:</span>
                          <span className="font-bold text-yellow-400">{cand.durationMinutes} Minutes</span>
                        </div>
                      </div>

                      {/* Crew Assignment */}
                      <div className="text-xs mb-4">
                        <span className="text-slate-400 block mb-1">Recommended Gang:</span>
                        <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <Users size={13} className="text-blue-400" />
                          {cand.crewName}
                        </p>
                      </div>

                      {/* Fitness Score Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Schedule Fitness Score</span>
                          <span className="font-bold text-white">{cand.fitnessScore} / 100</span>
                        </div>
                        <div className="w-full bg-[#0a192f] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cand.fitnessScore >= 90
                                ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                                : cand.fitnessScore >= 75
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                                : 'bg-gradient-to-r from-amber-500 to-orange-400'
                            }`}
                            style={{ width: `${cand.fitnessScore}%` }}
                          />
                        </div>
                      </div>

                      {/* Conflicts Check */}
                      <div className="mb-4">
                        {hasConflicts ? (
                          <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-2.5 space-y-1">
                            {cand.conflicts.map((c: string, ci: number) => (
                              <p key={ci} className="text-[11px] text-red-300 flex items-start gap-1.5">
                                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5 text-red-400" />
                                {c}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-2 text-[11px] text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-emerald-400" />
                            No operational schedule conflicts detected.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Schedule Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScheduleCandidate(cand);
                      }}
                      disabled={scheduling}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all shadow-md mt-2 flex items-center justify-center gap-1.5 ${
                        isRec
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-[#0a192f] border border-[#1f3e72] hover:border-blue-500 text-slate-300 hover:text-white'
                      }`}
                    >
                      {scheduling ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <CheckSquare size={13} />
                      )}
                      Approve & Schedule Window
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainable AI (XAI) Deep Dive Card */}
          {optResult.xaiExplanation && (
            <div className="glass-card p-6 border-t-2 border-yellow-500/80">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'Outfit' }}>
                    Explainable AI (XAI) Recommendation Rationale
                  </h3>
                  <p className="text-xs text-slate-400">
                    Transparent mathematical justification for auditability and compliance with Indian Railways safety codes.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Scoring Factor Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Multi-Factor Weight Scoring Breakdown
                  </h4>
                  <div className="bg-[#0a192f] p-4 rounded-xl border border-[#1f3e72] space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-blue-400">1. Severity Factor (Weight: 35%)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {optResult.xaiExplanation.scoringBreakdown?.severityFactor}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1f3e72]/60">
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-amber-400">2. Urgency Analysis (Weight: 25%)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {optResult.xaiExplanation.scoringBreakdown?.urgencyAnalysis}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1f3e72]/60">
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-red-400">3. Safety Criticality (Weight: 20%)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {optResult.xaiExplanation.scoringBreakdown?.safetyCriticality}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#1f3e72]/60">
                      <div className="flex justify-between font-semibold mb-1">
                        <span className="text-purple-400">4. Corridor Asset Bottleneck (Weight: 20%)</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {optResult.xaiExplanation.scoringBreakdown?.corridorAssetBottleneck}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Constraint Verification Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Operational Constraint Verifications
                  </h4>
                  <div className="bg-[#0a192f] p-4 rounded-xl border border-[#1f3e72] space-y-3 text-xs">
                    {optResult.xaiExplanation.constraintChecks?.map((chk: any, ci: number) => (
                      <div key={ci} className="flex items-start gap-3">
                        <span className="mt-0.5">
                          {chk.status === 'SATISFIED' ? (
                            <CheckCircle size={15} className="text-emerald-400" />
                          ) : chk.status === 'WARNING' ? (
                            <AlertTriangle size={15} className="text-amber-400" />
                          ) : (
                            <AlertTriangle size={15} className="text-red-400" />
                          )}
                        </span>
                        <div>
                          <p className="font-bold text-white">{chk.constraint}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">{chk.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Directives Banner */}
                  <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3.5 space-y-2 text-xs">
                    <div>
                      <span className="text-blue-300 font-bold uppercase text-[10px] block">
                        Coordination Directive
                      </span>
                      <p className="text-slate-200 text-[11px] mt-0.5">
                        {optResult.xaiExplanation.coordinationDirective}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-blue-900/60">
                      <span className="text-yellow-400 font-bold uppercase text-[10px] block">
                        Safety Compliance Rule
                      </span>
                      <p className="text-slate-200 text-[11px] mt-0.5">
                        {optResult.xaiExplanation.safetyComplianceRule}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

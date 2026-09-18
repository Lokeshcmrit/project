import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import CorridorTrackMap from '../../components/CorridorTrackMap';
import AdminOptimizerStudio from './AdminOptimizerStudio';
import { requestsAPI, corridorAPI, optimizerAPI, auditAPI, notificationsAPI } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { getSocket } from '../../sockets/socket';
import {
  LayoutDashboard, ClipboardList, Brain, Map, Calendar, ClipboardCheck, Bell, AlertTriangle, X, Check, RefreshCw, ChevronDown, ChevronRight, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

// ── Severity helpers ──────────────────────────────────────
const sevColor: Record<string, string> = {
  CRITICAL: 'bg-red-900/50 text-red-300 border-red-700/50',
  HIGH: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  MEDIUM: 'bg-amber-900/50 text-amber-300 border-amber-700/50',
  LOW: 'bg-green-900/50 text-green-300 border-green-700/50',
};
const statusColor: Record<string, string> = {
  SUBMITTED: 'text-blue-400',
  UNDER_REVIEW: 'text-amber-400',
  SCHEDULED: 'text-emerald-400',
  IN_PROGRESS: 'text-cyan-400',
  RESOLVED: 'text-green-400',
  REJECTED: 'text-red-400',
};

// ── Admin Home ────────────────────────────────────────────
function AdminHome() {
  const [overview, setOverview] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      corridorAPI.networkOverview(),
      requestsAPI.getAll({ status: 'SUBMITTED' }),
    ]).then(([ov, rq]) => {
      setOverview(ov.data);
      setRequests(rq.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Normal', val: overview?.NORMAL ?? '…', color: 'bg-green-900/40 text-green-400 border-green-800/50' },
    { label: 'Occupied', val: overview?.OCCUPIED ?? '…', color: 'bg-blue-900/40 text-blue-400 border-blue-800/50' },
    { label: 'Planned Possession', val: overview?.PLANNED_POSSESSION ?? '…', color: 'bg-amber-900/40 text-amber-400 border-amber-800/50' },
    { label: 'Disrupted', val: overview?.DISRUPTED ?? '…', color: 'bg-orange-900/40 text-orange-400 border-orange-800/50' },
    { label: 'Conflict', val: overview?.CONFLICT ?? '…', color: 'bg-red-900/40 text-red-400 border-red-800/50' },
    { label: 'Total Segments', val: overview?.total ?? '…', color: 'bg-[#132d56] text-slate-300 border-[#1f3e72]' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Operations Control Centre</h1>
      <p className="text-slate-400 text-sm mb-8">Secunderabad ↔ Visakhapatnam Corridor — Real-Time Block Management</p>

      {/* Network Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statCards.map(c => (
          <div key={c.label} className={`glass-card border p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.val}</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider mt-1 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Live Corridor Track Topology */}
      <div className="mb-8">
        <CorridorTrackMap userRole="ADMIN" />
      </div>

      {/* Pending Requests */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Pending Queue</h2>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full live-dot" />LIVE
          </span>
        </div>
        {loading ? <p className="text-slate-500 text-sm">Loading…</p> : requests.length === 0 ? (
          <p className="text-slate-400 text-sm">✅ No pending requests</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-[#1f3e72]">
                  <th className="pb-3 pr-4">Request</th>
                  <th className="pb-3 pr-4">Segment</th>
                  <th className="pb-3 pr-4">Dept</th>
                  <th className="pb-3 pr-4">Severity</th>
                  <th className="pb-3">Priority Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f3e72]">
                {requests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-blue-900/10 transition-colors">
                    <td className="py-3 pr-4 font-medium text-white">{r.title.length > 40 ? r.title.slice(0, 40) + '…' : r.title}</td>
                    <td className="py-3 pr-4 text-slate-400">{r.segment?.label}</td>
                    <td className="py-3 pr-4 text-slate-400">{r.reportingDepartment}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${sevColor[r.severity]}`}>{r.severity}</span>
                    </td>
                    <td className="py-3">
                      <span className={`font-bold ${r.priorityScore >= 80 ? 'text-red-400' : r.priorityScore >= 60 ? 'text-amber-400' : 'text-green-400'}`}>
                        {r.priorityScore?.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Requests Queue ────────────────────────────────────────
function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [action, setAction] = useState<'schedule' | 'reschedule' | 'reject' | null>(null);
  const [form, setForm] = useState({ scheduledStart: '', scheduledEnd: '', assignedCrewId: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [photoModal, setPhotoModal] = useState<string | null>(null);
  const { user } = useAuth();

  const loadRequests = async () => {
    const res = await requestsAPI.getAll();
    setRequests(res.data);
  };

  useEffect(() => {
    loadRequests();
    const socket = getSocket();
    socket.on('request:new', () => loadRequests());
    socket.on('request:statusChanged', () => loadRequests());
    return () => { socket.off('request:new'); socket.off('request:statusChanged'); };
  }, []);

  const loadRecommendation = async (id: string) => {
    setRecLoading(true);
    try {
      const res = await optimizerAPI.recommend(id);
      setRecommendation(res.data);
    } finally {
      setRecLoading(false);
    }
  };

  const handleSelect = (r: any) => {
    setSelected(r);
    setRecommendation(null);
    setAction(null);
  };

  const applyRecommendation = () => {
    if (!recommendation?.recommended) return;
    const rec = recommendation.recommended;
    setForm({
      scheduledStart: new Date(rec.startTime).toISOString().slice(0, 16),
      scheduledEnd: new Date(rec.endTime).toISOString().slice(0, 16),
      assignedCrewId: rec.recommendedCrewId,
      reason: '',
    });
    setAction('schedule');
  };

  const handleSubmitAction = async () => {
    if (!selected || !action) return;
    setSubmitting(true);
    try {
      if (action === 'schedule') {
        await requestsAPI.schedule(selected.id, {
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          scheduledEnd: new Date(form.scheduledEnd).toISOString(),
          assignedCrewId: form.assignedCrewId,
        });
      } else if (action === 'reschedule') {
        await requestsAPI.reschedule(selected.id, {
          newStart: new Date(form.scheduledStart).toISOString(),
          newEnd: new Date(form.scheduledEnd).toISOString(),
          reason: form.reason,
        });
      } else if (action === 'reject') {
        await requestsAPI.reject(selected.id, { reason: form.reason });
      }
      setSelected(null);
      setAction(null);
      setRecommendation(null);
      await loadRequests();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* Left - Request List */}
      <div className="w-80 flex-shrink-0 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Incoming Requests</h2>
          <button onClick={loadRequests} className="p-1.5 rounded hover:bg-[#132d56] text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        {requests.map(r => (
          <div
            key={r.id}
            onClick={() => handleSelect(r)}
            className={`glass-card p-4 cursor-pointer transition-all border ${selected?.id === r.id ? 'border-blue-500' : 'border-transparent hover:border-[#1f3e72]'}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${sevColor[r.severity]}`}>{r.severity}</span>
              <span className={`text-xs font-semibold ${statusColor[r.status]}`}>{r.status}</span>
            </div>
            <p className="text-sm font-medium text-white mt-1 line-clamp-2">{r.title}</p>
            <p className="text-xs text-slate-500 mt-1">{r.segment?.label}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">{r.reportingDepartment}</span>
              <span className={`text-xs font-bold ${r.priorityScore >= 80 ? 'text-red-400' : r.priorityScore >= 60 ? 'text-amber-400' : 'text-green-400'}`}>
                Score: {r.priorityScore?.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right - Detail + AI Panel */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {!selected ? (
          <div className="glass-card p-12 text-center text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-4 opacity-40" />
            <p className="text-sm">Select a request from the queue to review</p>
          </div>
        ) : (
          <>
            {/* Request Detail */}
            <div className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>{selected.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{selected.segment?.label}</p>
                </div>
                <span className={`px-2 py-1 rounded border text-xs font-bold uppercase ${sevColor[selected.severity]}`}>{selected.severity}</span>
              </div>
              <p className="text-slate-300 text-sm mb-4">{selected.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                <div><p className="text-slate-500">Reported By</p><p className="text-slate-200">{selected.reportedBy?.fullName}</p></div>
                <div><p className="text-slate-500">Department</p><p className="text-slate-200">{selected.reportingDepartment}</p></div>
                <div><p className="text-slate-500">Required Depts</p><p className="text-slate-200">{selected.requiredDepartments?.join(', ')}</p></div>
                <div><p className="text-slate-500">Delay Risk</p><p className="text-amber-300">{selected.estimatedDelayMinutes} min</p></div>
              </div>
              {/* Photos */}
              {selected.photoUrls?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Evidence Photos</p>
                  <div className="flex gap-2 flex-wrap">
                    {selected.photoUrls.map((url: string) => (
                      <img
                        key={url}
                        src={`http://localhost:4000${url}`}
                        alt="Evidence"
                        className="photo-thumb"
                        onClick={() => setPhotoModal(url)}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Recommendation Panel */}
            <div className="glass-card p-6 border border-blue-900/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-blue-400" />
                  <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit' }}>AI Block Optimizer</h3>
                </div>
                <button
                  onClick={() => loadRecommendation(selected.id)}
                  disabled={recLoading}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60"
                >
                  {recLoading ? <><RefreshCw size={12} className="animate-spin" /> Analyzing…</> : '⚡ Run AI Analysis'}
                </button>
              </div>

              {recommendation && (
                <div className="space-y-4">
                  {/* Priority Score */}
                  <div className="flex items-center gap-3 bg-[#0a192f] rounded-lg p-3">
                    <div className={`text-3xl font-bold ${recommendation.computedPriorityScore >= 80 ? 'text-red-400' : recommendation.computedPriorityScore >= 60 ? 'text-amber-400' : 'text-green-400'}`}>
                      {recommendation.computedPriorityScore}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">AI Priority Score</p>
                      <p className="text-xs text-slate-500 mt-0.5">{recommendation.xaiExplanation?.summary}</p>
                    </div>
                  </div>

                  {/* Recommended Window */}
                  {recommendation.recommended && (
                    <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-emerald-400 text-xs font-bold uppercase">✅ Recommended Window</span>
                      </div>
                      <p className="text-white font-semibold text-sm">{recommendation.recommended.label}</p>
                      <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                        <div><p className="text-slate-500">Start</p><p className="text-slate-200">{format(new Date(recommendation.recommended.startTime), 'dd MMM, HH:mm')}</p></div>
                        <div><p className="text-slate-500">End</p><p className="text-slate-200">{format(new Date(recommendation.recommended.endTime), 'dd MMM, HH:mm')}</p></div>
                        <div><p className="text-slate-500">Type</p><p className="text-slate-200">{recommendation.recommended.possessionType}</p></div>
                        <div><p className="text-slate-500">Crew</p><p className="text-slate-200 truncate">{recommendation.recommended.crewName}</p></div>
                      </div>
                      {recommendation.recommended.conflicts?.length > 0 && (
                        <div className="mt-2 bg-red-900/30 rounded p-2 text-xs text-red-300">
                          ⚠️ {recommendation.recommended.conflicts[0]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* XAI Breakdown */}
                  {recommendation.xaiExplanation?.constraintChecks && (
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">XAI Constraint Analysis</p>
                      <div className="space-y-2">
                        {recommendation.xaiExplanation.constraintChecks.map((c: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className={c.status === 'SATISFIED' ? 'text-green-400' : c.status === 'WARNING' ? 'text-amber-400' : 'text-red-400'}>
                              {c.status === 'SATISFIED' ? '✓' : c.status === 'WARNING' ? '⚠' : '✗'}
                            </span>
                            <div>
                              <span className="text-slate-300 font-medium">{c.constraint}: </span>
                              <span className="text-slate-400">{c.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(selected.status === 'SUBMITTED' || selected.status === 'UNDER_REVIEW') && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={applyRecommendation}
                        className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                      >
                        <Check size={14} /> Approve & Schedule
                      </button>
                      <button onClick={() => setAction('reschedule')} className="flex-1 py-2.5 bg-amber-700/60 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                        <RefreshCw size={14} /> Reschedule
                      </button>
                      <button onClick={() => setAction('reject')} className="py-2.5 px-4 bg-red-900/50 hover:bg-red-800 text-red-300 text-sm font-semibold rounded-lg flex items-center gap-2">
                        <X size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Form */}
            {action && (
              <div className="glass-card p-6 border border-blue-700/50">
                <h4 className="font-bold text-white mb-4 capitalize" style={{ fontFamily: 'Outfit' }}>
                  {action === 'schedule' ? 'Approve & Schedule Block' : action === 'reschedule' ? 'Reschedule Block' : 'Reject Request'}
                </h4>
                <div className="space-y-3">
                  {(action === 'schedule' || action === 'reschedule') && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Start Time</label>
                          <input type="datetime-local" className="w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-3 py-2 text-sm text-white" value={form.scheduledStart} onChange={e => setForm(f => ({ ...f, scheduledStart: e.target.value }))} />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">End Time</label>
                          <input type="datetime-local" className="w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-3 py-2 text-sm text-white" value={form.scheduledEnd} onChange={e => setForm(f => ({ ...f, scheduledEnd: e.target.value }))} />
                        </div>
                      </div>
                      {action === 'schedule' && (
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Assigned Crew ID</label>
                          <input className="w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-3 py-2 text-sm text-white" value={form.assignedCrewId} onChange={e => setForm(f => ({ ...f, assignedCrewId: e.target.value }))} />
                        </div>
                      )}
                    </>
                  )}
                  {(action === 'reject' || action === 'reschedule') && (
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Reason</label>
                      <textarea className="w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-3 py-2 text-sm text-white h-20 resize-none" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={handleSubmitAction} disabled={submitting} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                      {submitting ? 'Processing…' : 'Confirm ' + (action === 'schedule' ? 'Approval' : action === 'reschedule' ? 'Reschedule' : 'Rejection')}
                    </button>
                    <button onClick={() => setAction(null)} className="px-4 py-2.5 bg-[#0a192f] border border-[#1f3e72] text-slate-400 text-sm rounded-lg hover:text-white">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Photo Modal */}
      {photoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setPhotoModal(null)}>
          <img src={`http://localhost:4000${photoModal}`} className="max-w-2xl max-h-[80vh] rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}

// ── Weekly Schedule ───────────────────────────────────────
function AdminSchedule() {
  const [swimlanes, setSwimlanes] = useState<any>({});
  useEffect(() => { optimizerAPI.weeklySchedule().then(r => setSwimlanes(r.data)).catch(() => {}); }, []);

  const depts = ['ENGINEERING', 'TRACTION_DISTRIBUTION', 'SIGNAL_TELECOM'];
  const deptColors: Record<string, string> = {
    ENGINEERING: 'bg-blue-700',
    TRACTION_DISTRIBUTION: 'bg-purple-700',
    SIGNAL_TELECOM: 'bg-amber-700',
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>7-Day Maintenance Schedule</h2>
      <div className="space-y-4">
        {depts.map(dept => (
          <div key={dept} className="glass-card p-5">
            <h3 className="text-sm font-bold text-slate-300 mb-4">{dept.replace(/_/g, ' ')}</h3>
            <div className="space-y-2">
              {(swimlanes[dept] || []).length === 0 ? (
                <p className="text-slate-500 text-xs">No scheduled blocks this week</p>
              ) : (
                (swimlanes[dept] || []).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <span className={`${deptColors[dept]} px-2 py-1 rounded text-white font-semibold min-w-[120px] truncate`}>
                      {item.dateStr}
                    </span>
                    <span className="text-slate-300 flex-1 truncate">{item.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.status === 'SCHEDULED' ? 'bg-emerald-900/50 text-emerald-300' :
                      item.status === 'IN_PROGRESS' ? 'bg-cyan-900/50 text-cyan-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>{item.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Audit Log ─────────────────────────────────────────────
function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { auditAPI.getLogs().then(r => setLogs(r.data)).catch(() => {}); }, []);

  const actionColor: Record<string, string> = {
    REQUEST_SUBMITTED: 'text-blue-400',
    REQUEST_SCHEDULED: 'text-emerald-400',
    REQUEST_REJECTED: 'text-red-400',
    REQUEST_RESCHEDULED: 'text-amber-400',
    REQUEST_RESOLVED: 'text-green-400',
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Immutable Audit Log</h2>
      <div className="space-y-2">
        {logs.map((l: any) => (
          <div key={l.id} className="glass-card p-4 flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#0a192f] border border-[#1f3e72] flex items-center justify-center flex-shrink-0">
              <ClipboardCheck size={14} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs font-bold ${actionColor[l.action] || 'text-slate-400'}`}>{l.action}</span>
                <span className="text-xs text-slate-500">by {l.actor?.fullName}</span>
                {l.relatedRequest && <span className="text-xs text-slate-600 truncate">{l.relatedRequest.title}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-1">{format(new Date(l.createdAt), 'dd MMM yyyy HH:mm:ss')}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && <div className="glass-card p-8 text-center text-slate-400 text-sm">No audit logs found</div>}
      </div>
    </div>
  );
}

// ── Notifications ─────────────────────────────────────────
function AdminNotifications() {
  const [notifs, setNotifs] = useState<any[]>([]);
  useEffect(() => { notificationsAPI.getAll().then(r => setNotifs(r.data)).catch(() => {}); }, []);
  const markRead = async (id: string) => {
    await notificationsAPI.markRead(id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Notifications</h2>
      <div className="space-y-2">
        {notifs.map(n => (
          <div key={n.id} className={`glass-card p-4 cursor-pointer ${n.isRead ? 'opacity-60' : ''}`} onClick={() => !n.isRead && markRead(n.id)}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{n.type === 'block_alert' ? '⚠️' : n.type === 'request_scheduled' ? '✅' : '🔔'}</span>
              <div>
                <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-white font-medium'}`}>{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{format(new Date(n.createdAt), 'dd MMM, HH:mm')}</p>
              </div>
              {!n.isRead && <span className="ml-auto w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Corridor Map View ─────────────────────────────────────
function AdminMap() {
  return (
    <div className="space-y-6">
      <CorridorTrackMap userRole="ADMIN" />
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Overview', to: '/dashboard/admin' },
  { icon: Map, label: 'Corridor Map', to: '/dashboard/admin/map' },
  { icon: ClipboardList, label: 'Request Queue', to: '/dashboard/admin/requests' },
  { icon: Brain, label: 'AI Optimizer', to: '/dashboard/admin/optimizer' },
  { icon: Calendar, label: 'Weekly Schedule', to: '/dashboard/admin/schedule' },
  { icon: ClipboardCheck, label: 'Audit Log', to: '/dashboard/admin/audit' },
  { icon: Bell, label: 'Notifications', to: '/dashboard/admin/notifications' },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="Operations Admin" roleColor="text-yellow-400">
      <Routes>
        <Route index element={<AdminHome />} />
        <Route path="map" element={<AdminMap />} />
        <Route path="requests" element={<AdminRequests />} />
        <Route path="optimizer" element={<AdminOptimizerStudio />} />
        <Route path="schedule" element={<AdminSchedule />} />
        <Route path="audit" element={<AdminAudit />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { requestsAPI, corridorAPI, notificationsAPI } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { getSocket } from '../../sockets/socket';
import {
  LayoutDashboard, ClipboardList, Bell, CheckSquare, PlusCircle,
  Upload, X, Loader2, MapPin, Play, CheckCircle2, AlertTriangle,
  Zap, Wrench, Activity, ShieldCheck, ArrowRight, Filter
} from 'lucide-react';
import { format } from 'date-fns';

// ── Status helpers ────────────────────────────────────────
const statusSteps = ['SUBMITTED', 'UNDER_REVIEW', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED'];
const statusColor: Record<string, string> = {
  SUBMITTED: 'text-blue-400 border-blue-700/50 bg-blue-900/30',
  UNDER_REVIEW: 'text-amber-400 border-amber-700/50 bg-amber-900/30',
  SCHEDULED: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/30',
  IN_PROGRESS: 'text-cyan-400 border-cyan-700/50 bg-cyan-900/30',
  RESOLVED: 'text-green-400 border-green-700/50 bg-green-900/30',
  REJECTED: 'text-red-400 border-red-700/50 bg-red-900/30',
};

const deptNames: Record<string, string> = {
  ENGINEERING: 'Civil Engineering (P-Way)',
  TRACTION_DISTRIBUTION: 'Traction Distribution (25kV OHE)',
  SIGNAL_TELECOM: 'Signal & Telecommunication (S&T)',
};

// ── New Request Form ─────────────────────────────────────
function NewRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [segments, setSegments] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    segmentId: '',
    reportingDepartment: user?.department || 'ENGINEERING',
    requiredDepartments: [user?.department || 'ENGINEERING'],
    observedAt: new Date().toISOString().slice(0, 16),
    estimatedDelayMinutes: 30,
    severity: 'MEDIUM',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    corridorAPI.segments().then(r => setSegments(r.data)).catch(() => {});
  }, []);

  const toggleDept = (dept: string) => {
    setForm(f => ({
      ...f,
      requiredDepartments: f.requiredDepartments.includes(dept)
        ? f.requiredDepartments.filter(d => d !== dept)
        : [...f.requiredDepartments, dept],
    }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5);
    setPhotos(arr);
    setPreviews(arr.map(f => URL.createObjectURL(f)));
  };

  const selectedSegment = segments.find(s => s.id === form.segmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.segmentId) { setError('Please select a track segment'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'requiredDepartments') {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, String(v));
        }
      });
      photos.forEach(f => fd.append('photos', f));
      await requestsAPI.create(fd);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        navigate('/dashboard/department/my-requests');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const depts = ['ENGINEERING', 'TRACTION_DISTRIBUTION', 'SIGNAL_TELECOM'];
  const deptLabels: Record<string, string> = {
    ENGINEERING: '🔧 Civil Engineering (P-Way)',
    TRACTION_DISTRIBUTION: '⚡ Traction Distribution (OHE)',
    SIGNAL_TELECOM: '📡 Signal & Telecom (S&T)',
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          File Maintenance Block Request
        </h2>
        <p className="text-xs text-slate-400">
          Submit track defects or routine overhaul requirements for AI shadow scheduling and Operations Admin possession approval.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-900/40 border border-emerald-600 text-emerald-200 p-4 rounded-xl text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-400" />
          <span>Maintenance request filed successfully! Forwarded to Operations Control Centre (OCC).</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-xl text-sm flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Defect / Maintenance Title *
          </label>
          <input
            className={inputCls}
            placeholder="e.g. 25kV Catenary Wire Sag inspection between KM 48-52"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Engineering Scope & Tooling Description *
          </label>
          <textarea
            className={inputCls + ' h-24 resize-none'}
            placeholder="Specify chainage KM, track machine requirements (e.g. BCM, Tamping machine), power block requirement, and crew gang size…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            required
          />
        </div>

        {/* Track Segment & Severity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Corridor Track Segment *
            </label>
            <select
              className={inputCls}
              value={form.segmentId}
              onChange={e => setForm(f => ({ ...f, segmentId: e.target.value }))}
              required
            >
              <option value="">Select affected section…</option>
              {segments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.code} · {s.lengthKm} KM)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Severity Level *
            </label>
            <select
              className={inputCls}
              value={form.severity}
              onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
            >
              <option value="LOW">LOW — Routine Overhaul (Sleeper/Gasket)</option>
              <option value="MEDIUM">MEDIUM — Track Inspection / Insulator Clean</option>
              <option value="HIGH">HIGH — Speed Restriction Imposed (TSR)</option>
              <option value="CRITICAL">CRITICAL — Immediate Safety Hazard / Broken Rail</option>
            </select>
          </div>
        </div>

        {/* Pre-Flight Conflict Info if segment selected */}
        {selectedSegment && (
          <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400">Current Section Status: </span>
              <span className="font-bold text-white uppercase">{selectedSegment.status}</span>
              <span className="text-slate-500 ml-2">({selectedSegment.trackType} line · Max {selectedSegment.maxSpeedKmH} km/h)</span>
            </div>
            <span className="text-emerald-400 font-semibold text-[11px]">AI Shadow Block Eligible</span>
          </div>
        )}

        {/* Co-Required Departments */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Joint / Co-Required Maintenance Departments (Shadow Blocks)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {depts.map(d => {
              const active = form.requiredDepartments.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDept(d)}
                  className={`p-3 rounded-lg border text-left text-xs transition-all ${
                    active
                      ? 'bg-blue-900/30 border-blue-500 text-white font-semibold'
                      : 'bg-[#0a192f] border-[#1f3e72] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{deptLabels[d]}</span>
                    {active && <CheckCircle2 size={14} className="text-blue-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Estimated Block Window Duration (Minutes)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              className={inputCls}
              value={form.estimatedDelayMinutes}
              onChange={e => setForm(f => ({ ...f, estimatedDelayMinutes: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Defect Observed Date & Time
            </label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.observedAt}
              onChange={e => setForm(f => ({ ...f, observedAt: e.target.value }))}
            />
          </div>
        </div>

        {/* Photo Evidence Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Photographic Evidence / Defect Inspection Proof
          </label>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[#1f3e72] hover:border-blue-500/80 rounded-xl p-5 text-center cursor-pointer transition-colors bg-[#0a192f]/50"
          >
            <Upload size={24} className="mx-auto text-slate-500 mb-2" />
            <p className="text-xs text-slate-300 font-semibold">Click to upload defect inspection photos</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Supports PNG, JPG up to 5 photos for OCC inspection</p>
          </div>

          {previews.length > 0 && (
            <div className="flex gap-3 mt-3 overflow-x-auto py-2">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#1f3e72] flex-shrink-0 group">
                  <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotos(p => p.filter((_, idx) => idx !== i));
                      setPreviews(pr => pr.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Action */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Submitting to OCC…
              </>
            ) : (
              <>
                Submit Block Request <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── My Requests ───────────────────────────────────────────
function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [acting, setActing] = useState<string | null>(null);

  const loadRequests = () => {
    requestsAPI.getAll({ department: user?.department }).then(r => setRequests(r.data)).catch(() => {});
  };

  useEffect(() => { loadRequests(); }, [user]);

  const handleStart = async (id: string) => {
    setActing(id);
    try {
      await requestsAPI.start(id);
      loadRequests();
    } finally {
      setActing(null);
    }
  };

  const handleResolve = async (id: string) => {
    setActing(id);
    try {
      await requestsAPI.resolve(id);
      loadRequests();
    } finally {
      setActing(null);
    }
  };

  const filtered = requests.filter(r => filterStatus === 'ALL' || r.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Department Maintenance Dossier
          </h2>
          <p className="text-xs text-slate-400">
            Track status, review priority scores, and execute on-track possessions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0a192f] p-1 rounded-lg border border-[#1f3e72]">
          {['ALL', 'SUBMITTED', 'SCHEDULED', 'IN_PROGRESS', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                filterStatus === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">
          No maintenance requests found matching current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r.id} className="glass-card p-5 border border-[#1f3e72] hover:border-slate-600 transition-all">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-blue-400 font-bold">{r.segment?.label}</span>
                    <span className="text-[11px] text-slate-500">· {r.reportingDepartment}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{r.title}</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{r.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase ${statusColor[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* 5-Step Progress Stepper */}
              {r.status !== 'REJECTED' && (
                <div className="my-4 pt-2 border-t border-[#1f3e72]/60">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>1. SUBMITTED</span>
                    <span>2. REVIEW</span>
                    <span>3. SCHEDULED</span>
                    <span>4. ON-TRACK WORK</span>
                    <span>5. LINE SAFE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusSteps.map((s, i) => {
                      const activeIndex = statusSteps.indexOf(r.status);
                      const isDone = activeIndex >= i;
                      const isCurrent = activeIndex === i;
                      return (
                        <div key={s} className="flex-1 flex items-center">
                          <div
                            className={`h-2 rounded-full w-full transition-all ${
                              isCurrent
                                ? 'bg-blue-400 shadow-md shadow-blue-400/50 animate-pulse'
                                : isDone
                                ? 'bg-emerald-500'
                                : 'bg-slate-800'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Meta Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mt-3 pt-3 border-t border-[#1f3e72]/60">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Severity</p>
                  <p className="text-slate-200 font-semibold">{r.severity}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">AI Priority Score</p>
                  <p className={`font-bold font-mono ${
                    r.priorityScore >= 80 ? 'text-red-400' : r.priorityScore >= 60 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {r.priorityScore ? r.priorityScore.toFixed(1) : 'Calculated in OCC'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Possession Window</p>
                  <p className="text-slate-200 font-mono">
                    {r.scheduledStart ? format(new Date(r.scheduledStart), 'dd MMM, HH:mm') : 'Pending OCC'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Assigned Gang Crew</p>
                  <p className="text-slate-200 truncate">{r.assignedCrewId || 'Field Gang #4'}</p>
                </div>

                {/* Direct Action execution */}
                <div className="flex items-center justify-end gap-2">
                  {r.status === 'SCHEDULED' && (
                    <button
                      type="button"
                      disabled={acting === r.id}
                      onClick={() => handleStart(r.id)}
                      className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      Start Work
                    </button>
                  )}
                  {r.status === 'IN_PROGRESS' && (
                    <button
                      type="button"
                      disabled={acting === r.id}
                      onClick={() => handleResolve(r.id)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Mark Line Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Approved Blocks ────────────────────────────────────────
function ApprovedBlocks() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const loadBlocks = () => {
    Promise.all([
      requestsAPI.getAll({ department: user?.department, status: 'SCHEDULED' }),
      requestsAPI.getAll({ department: user?.department, status: 'IN_PROGRESS' }),
    ]).then(([sc, ip]) => {
      setRequests([...sc.data, ...ip.data]);
    }).catch(() => {});
  };

  useEffect(() => { loadBlocks(); }, [user]);

  const handleStart = async (id: string) => {
    setActing(id);
    try { await requestsAPI.start(id); loadBlocks(); } finally { setActing(null); }
  };

  const handleResolve = async (id: string) => {
    setActing(id);
    try { await requestsAPI.resolve(id); loadBlocks(); } finally { setActing(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Approved Possession Permits & Work Windows
        </h2>
        <p className="text-xs text-slate-400">
          Corridor track possessions sanctioned by Chief Controller. Mobilize maintenance gang & execute work safely.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">
          No active or scheduled possession blocks for your department right now.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div
              key={r.id}
              className={`glass-card p-5 border ${
                r.status === 'IN_PROGRESS' ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-emerald-600/50'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                      Sanctioned Block
                    </span>
                    <span className="text-xs font-mono text-slate-300">{r.segment?.label}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{r.title}</h3>
                </div>

                <span className={`px-2.5 py-1 rounded border text-xs font-bold uppercase ${
                  r.status === 'IN_PROGRESS'
                    ? 'bg-cyan-900/50 border-cyan-700 text-cyan-300'
                    : 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
                }`}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4 pt-3 border-t border-[#1f3e72]">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Permit Start</p>
                  <p className="text-emerald-300 font-mono font-bold">
                    {r.scheduledStart ? format(new Date(r.scheduledStart), 'dd MMM yyyy, HH:mm') : 'Immediate'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Permit End</p>
                  <p className="text-emerald-300 font-mono font-bold">
                    {r.scheduledEnd ? format(new Date(r.scheduledEnd), 'dd MMM yyyy, HH:mm') : 'Immediate'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Assigned Gang</p>
                  <p className="text-slate-200">{r.assignedCrewId || 'SSE Maintenance Gang'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Safety Checklist</p>
                  <p className="text-green-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={13} /> Power Disconnect Verified
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f3e72]/50">
                {r.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleStart(r.id)}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {acting === r.id ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    Start Field Possession
                  </button>
                )}
                {r.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleResolve(r.id)}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {acting === r.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Certify Track Safe & Release Block
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dept Notifications ─────────────────────────────────────
function DeptNotifications() {
  const [notifs, setNotifs] = useState<any[]>([]);
  useEffect(() => { notificationsAPI.getAll().then(r => setNotifs(r.data)).catch(() => {}); }, []);

  const markRead = async (id: string) => {
    await notificationsAPI.markRead(id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Department Communication Channel
        </h2>
        <p className="text-xs text-slate-400">Direct notifications from OCC Controllers, schedule sanctions, and safety advisories.</p>
      </div>

      <div className="space-y-2">
        {notifs.length === 0 && <div className="glass-card p-8 text-center text-slate-400 text-sm">No notifications yet</div>}
        {notifs.map(n => (
          <div
            key={n.id}
            className={`glass-card p-4 cursor-pointer transition-all ${n.isRead ? 'opacity-60' : 'border-l-4 border-emerald-500 bg-emerald-950/20'}`}
            onClick={() => !n.isRead && markRead(n.id)}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{n.type === 'block_alert' ? '⚠️' : n.type === 'request_scheduled' ? '✅' : '🔔'}</span>
              <div className="flex-1">
                <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-white font-semibold'}`}>{n.message}</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">{format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-1 animate-pulse" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layout & Home ──────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Department Hub', to: '/dashboard/department' },
  { icon: PlusCircle, label: 'New Request', to: '/dashboard/department/new-request' },
  { icon: ClipboardList, label: 'My Requests', to: '/dashboard/department/my-requests' },
  { icon: CheckSquare, label: 'Approved Blocks', to: '/dashboard/department/approved-blocks' },
  { icon: Bell, label: 'Notifications', to: '/dashboard/department/notifications' },
];

function DeptHome() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState<any[]>([]);

  useEffect(() => {
    requestsAPI.getAll({ department: user?.department }).then(r => setMyRequests(r.data)).catch(() => {});
  }, [user]);

  const counts = {
    total: myRequests.length,
    submitted: myRequests.filter(r => r.status === 'SUBMITTED').length,
    scheduled: myRequests.filter(r => r.status === 'SCHEDULED').length,
    inProgress: myRequests.filter(r => r.status === 'IN_PROGRESS').length,
    resolved: myRequests.filter(r => r.status === 'RESOLVED').length,
  };

  const currentDeptLabel = deptNames[user?.department || 'ENGINEERING'] || 'Engineering Department';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {currentDeptLabel} Hub
          </h1>
          <p className="text-slate-400 text-xs">
            Secunderabad ↔ Visakhapatnam Mainline · Maintenance gang mobilization & track possession console
          </p>
        </div>

        <Link
          to="/dashboard/department/new-request"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2"
        >
          <PlusCircle size={15} /> File Maintenance Request
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Filings', val: counts.total, color: 'text-blue-400 border-blue-800/40 bg-blue-950/20' },
          { label: 'Pending OCC Review', val: counts.submitted, color: 'text-amber-400 border-amber-800/40 bg-amber-950/20' },
          { label: 'Sanctioned Blocks', val: counts.scheduled, color: 'text-emerald-400 border-emerald-800/40 bg-emerald-950/20' },
          { label: 'Active on Track', val: counts.inProgress, color: 'text-cyan-400 border-cyan-800/40 bg-cyan-950/20' },
          { label: 'Resolved / Clear', val: counts.resolved, color: 'text-green-400 border-green-800/40 bg-green-950/20' },
        ].map(c => (
          <div key={c.label} className={`glass-card p-4 text-center border ${c.color}`}>
            <p className="text-2xl font-bold font-mono">{c.val}</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold tracking-wider">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Action Shortcut Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 border-l-4 border-blue-500">
          <h3 className="text-sm font-bold text-white mb-1">File Defect / Routine Overhaul</h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload track inspection photos, specify required shadow departments (OHE + P-Way), and request possessions.
          </p>
          <Link
            to="/dashboard/department/new-request"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            Launch Request Form →
          </Link>
        </div>

        <div className="glass-card p-5 border-l-4 border-emerald-500">
          <h3 className="text-sm font-bold text-white mb-1">Approved Field Possessions</h3>
          <p className="text-xs text-slate-400 mb-4">
            View sanctioned possession windows, confirm line isolation, and activate track possession.
          </p>
          <Link
            to="/dashboard/department/approved-blocks"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            Manage Approved Blocks →
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Recent Department Submissions
          </h3>
          <Link to="/dashboard/department/my-requests" className="text-xs text-blue-400 hover:underline">
            View all ({myRequests.length}) →
          </Link>
        </div>

        {myRequests.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No requests filed yet.{' '}
            <Link to="/dashboard/department/new-request" className="text-blue-400">
              Submit your first request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.slice(0, 4).map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2.5 px-3 bg-[#0a192f] border border-[#1f3e72] rounded-lg text-xs"
              >
                <div>
                  <p className="font-semibold text-white">{r.title}</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">{r.segment?.label}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusColor[r.status]}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DepartmentDashboard() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="Department Engineer" roleColor="text-emerald-400">
      <Routes>
        <Route index element={<DeptHome />} />
        <Route path="new-request" element={<NewRequestForm />} />
        <Route path="my-requests" element={<MyRequests />} />
        <Route path="approved-blocks" element={<ApprovedBlocks />} />
        <Route path="notifications" element={<DeptNotifications />} />
        <Route path="*" element={<Navigate to="/dashboard/department" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

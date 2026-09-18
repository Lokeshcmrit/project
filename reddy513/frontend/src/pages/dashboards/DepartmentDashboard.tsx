import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { requestsAPI, corridorAPI, notificationsAPI } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { getSocket } from '../../sockets/socket';
import {
  LayoutDashboard, ClipboardList, Bell, CheckSquare, PlusCircle,
  Upload, X, Loader2, MapPin, Play, CheckCircle2
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

// ── New Request Form ─────────────────────────────────────
function NewRequestForm() {
  const { user } = useAuth();
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
    corridorAPI.segments().then(r => setSegments(r.data));
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
      setTimeout(() => setSuccess(false), 3000);
      setForm(prev => ({ ...prev, title: '', description: '' }));
      setPhotos([]);
      setPreviews([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const depts = ['ENGINEERING', 'TRACTION_DISTRIBUTION', 'SIGNAL_TELECOM'];
  const deptLabels: Record<string, string> = {
    ENGINEERING: '🔧 Engineering',
    TRACTION_DISTRIBUTION: '⚡ Traction Distribution',
    SIGNAL_TELECOM: '📡 Signal & Telecom',
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Submit Maintenance Request</h2>
      <p className="text-slate-400 text-sm mb-6">
        Department: <span className="text-emerald-400 font-semibold">{user?.department?.replace(/_/g, ' ')}</span>
      </p>

      {success && (
        <div className="mb-4 bg-green-900/30 border border-green-700/50 text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          ✅ Request submitted successfully! AI scoring in progress — check Admin queue.
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">⚠️ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Request Title</label>
          <input className={inputCls} placeholder="e.g. Rail weld defect at KM 562/14" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Description</label>
          <textarea className={inputCls + ' h-24 resize-none'} placeholder="Detailed description of the defect / failure observed…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Track Section / Segment</label>
          <select className={inputCls} value={form.segmentId} onChange={e => setForm(f => ({ ...f, segmentId: e.target.value }))} required>
            <option value="">Select corridor segment…</option>
            {segments.map(s => (
              <option key={s.id} value={s.id}>{s.label} ({s.fromStation?.code} – {s.toStation?.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Departments Required (multi-select)</label>
          <div className="flex gap-2 flex-wrap">
            {depts.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDept(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.requiredDepartments.includes(d) ? 'bg-blue-700 border-blue-600 text-white' : 'border-[#1f3e72] text-slate-400 hover:border-blue-700/50'}`}
              >
                {deptLabels[d]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Date & Time Observed</label>
            <input type="datetime-local" className={inputCls} value={form.observedAt} onChange={e => setForm(f => ({ ...f, observedAt: e.target.value }))} required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Severity</label>
            <select className={inputCls} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              <option value="LOW">🟢 Low</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HIGH">🟠 High</option>
              <option value="CRITICAL">🔴 Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Estimated Delay if Unresolved (minutes)</label>
          <input type="number" className={inputCls} min={0} max={999} value={form.estimatedDelayMinutes} onChange={e => setForm(f => ({ ...f, estimatedDelayMinutes: Number(e.target.value) }))} />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Evidence Photos (up to 5)</label>
          <div
            className="border-2 border-dashed border-[#1f3e72] rounded-xl p-6 text-center cursor-pointer hover:border-blue-600 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={24} className="mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-400">Click to upload photos</p>
            <p className="text-xs text-slate-600 mt-1">JPG, PNG, WebP, SVG — max 5MB each</p>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          </div>
          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((p, i) => (
                <div key={i} className="relative">
                  <img src={p} className="photo-thumb" />
                  <button type="button" onClick={() => { setPhotos(ph => ph.filter((_, j) => j !== i)); setPreviews(pv => pv.filter((_, j) => j !== i)); }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          id="submit-request-btn"
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting & Running AI Scoring…</> : <>
            <PlusCircle size={16} /> Submit Maintenance Request
          </>}
        </button>
      </form>
    </div>
  );
}

// ── My Requests ────────────────────────────────────────────
function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);

  const loadRequests = () => {
    requestsAPI.getAll({ department: user?.department }).then(r => setRequests(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadRequests();
    const socket = getSocket();
    socket.on('request:statusChanged', loadRequests);
    return () => {
      socket.off('request:statusChanged', loadRequests);
    };
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>My Requests</h2>
      {requests.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">No requests submitted yet. Use "New Request" to begin.</div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white text-sm">{r.title}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">{r.segment?.label}</p>
                </div>
                <span className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${statusColor[r.status]}`}>{r.status}</span>
              </div>
              {/* Status Progress Bar */}
              {r.status !== 'REJECTED' && (
                <div className="flex items-center gap-1 mb-3">
                  {statusSteps.map((s, i) => {
                    const done = statusSteps.indexOf(r.status) >= i;
                    return (
                      <React.Fragment key={s}>
                        <div className={`w-2 h-2 rounded-full ${done ? 'bg-blue-400' : 'bg-[#1f3e72]'}`} />
                        {i < statusSteps.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-blue-400' : 'bg-[#1f3e72]'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                <div><p className="text-slate-500">Severity</p><p className="text-slate-200 font-semibold">{r.severity}</p></div>
                <div><p className="text-slate-500">Priority Score</p><p className={`font-bold ${r.priorityScore >= 80 ? 'text-red-400' : r.priorityScore >= 60 ? 'text-amber-400' : 'text-green-400'}`}>{r.priorityScore?.toFixed(1)}</p></div>
                <div><p className="text-slate-500">Block Start</p><p className="text-slate-200">{r.scheduledStart ? format(new Date(r.scheduledStart), 'dd MMM HH:mm') : 'TBD'}</p></div>
                <div><p className="text-slate-500">Block End</p><p className="text-slate-200">{r.scheduledEnd ? format(new Date(r.scheduledEnd), 'dd MMM HH:mm') : 'TBD'}</p></div>
                <div><p className="text-slate-500">Crew</p><p className="text-slate-200 truncate">{r.assignedCrewId || 'Not assigned'}</p></div>
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
    // Show both SCHEDULED and IN_PROGRESS so engineers can track active work
    Promise.all([
      requestsAPI.getAll({ department: user?.department, status: 'SCHEDULED' }),
      requestsAPI.getAll({ department: user?.department, status: 'IN_PROGRESS' }),
    ]).then(([sc, ip]) => {
      setRequests([...sc.data, ...ip.data]);
    }).catch(() => {});
  };

  useEffect(() => { loadBlocks(); }, []);

  const handleStart = async (id: string) => {
    setActing(id);
    try { await requestsAPI.start(id); loadBlocks(); } finally { setActing(null); }
  };

  const handleResolve = async (id: string) => {
    setActing(id);
    try { await requestsAPI.resolve(id); loadBlocks(); } finally { setActing(null); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Approved Blocks</h2>
      {requests.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400 text-sm">No approved blocks scheduled for your department</div>
      ) : (
        <div className="space-y-4">
          {requests.map(r => (
            <div key={r.id} className={`glass-card p-5 border ${
              r.status === 'IN_PROGRESS' ? 'border-cyan-900/50' : 'border-emerald-900/50'
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{r.title}</h3>
                  <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                    r.status === 'IN_PROGRESS' ? 'text-cyan-400' : 'text-emerald-400'
                  }`}><MapPin size={10} />{r.segment?.label}</p>
                </div>
                <span className={`px-2 py-0.5 rounded border text-xs font-bold uppercase ${
                  r.status === 'IN_PROGRESS'
                    ? 'bg-cyan-900/50 border-cyan-700/50 text-cyan-300'
                    : 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300'
                }`}>{r.status.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs mb-4">
                <div><p className="text-slate-500">Block Start</p><p className="text-emerald-300 font-semibold">{r.scheduledStart ? format(new Date(r.scheduledStart), 'dd MMM yyyy HH:mm') : 'TBD'}</p></div>
                <div><p className="text-slate-500">Block End</p><p className="text-emerald-300 font-semibold">{r.scheduledEnd ? format(new Date(r.scheduledEnd), 'dd MMM yyyy HH:mm') : 'TBD'}</p></div>
                <div><p className="text-slate-500">Assigned Crew</p><p className="text-slate-200">{r.assignedCrewId || 'To be assigned'}</p></div>
              </div>
              {/* Workflow Action Buttons */}
              <div className="flex gap-2">
                {r.status === 'SCHEDULED' && (
                  <button
                    onClick={() => handleStart(r.id)}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-800/60 hover:bg-cyan-700 text-cyan-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                    Start Field Work
                  </button>
                )}
                {(r.status === 'SCHEDULED' || r.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => handleResolve(r.id)}
                    disabled={acting === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-800/60 hover:bg-green-700 text-green-200 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {acting === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                    Mark Resolved
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
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Notifications</h2>
      <div className="space-y-2">
        {notifs.length === 0 && <div className="glass-card p-8 text-center text-slate-400 text-sm">No notifications yet</div>}
        {notifs.map(n => (
          <div key={n.id} className={`glass-card p-4 cursor-pointer transition-all ${n.isRead ? 'opacity-60' : 'border border-blue-900/30'}`} onClick={() => !n.isRead && markRead(n.id)}>
            <div className="flex items-start gap-3">
              <span className="text-xl">{n.type === 'block_alert' ? '⚠️' : n.type === 'request_scheduled' ? '✅' : '🔔'}</span>
              <div className="flex-1">
                <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-white font-medium'}`}>{n.message}</p>
                <p className="text-xs text-slate-500 mt-1">{format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
              {!n.isRead && <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Layout ────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard/department' },
  { icon: PlusCircle, label: 'New Request', to: '/dashboard/department/new-request' },
  { icon: ClipboardList, label: 'My Requests', to: '/dashboard/department/my-requests' },
  { icon: CheckSquare, label: 'Approved Blocks', to: '/dashboard/department/approved-blocks' },
  { icon: Bell, label: 'Notifications', to: '/dashboard/department/notifications' },
];

function DeptHome() {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState<any[]>([]);
  useEffect(() => {
    requestsAPI.getAll({ department: user?.department }).then(r => setMyRequests(r.data.slice(0, 3))).catch(() => {});
  }, []);

  const counts = {
    total: myRequests.length,
    submitted: myRequests.filter(r => r.status === 'SUBMITTED').length,
    scheduled: myRequests.filter(r => r.status === 'SCHEDULED').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
        {user?.department?.replace(/_/g, ' ')} Department
      </h1>
      <p className="text-slate-400 text-sm mb-8">Submit and track maintenance requests for the Secunderabad-Vizag corridor</p>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Requests', val: counts.total, color: 'text-blue-400' },
          { label: 'Pending Review', val: counts.submitted, color: 'text-amber-400' },
          { label: 'Scheduled Blocks', val: counts.scheduled, color: 'text-emerald-400' },
        ].map(c => (
          <div key={c.label} className="glass-card p-5 text-center">
            <p className={`text-3xl font-bold ${c.color}`}>{c.val}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-slate-300 mb-4">Recent Requests</h3>
        {myRequests.length === 0 ? (
          <p className="text-slate-500 text-sm">No requests yet. <a href="/dashboard/department/new-request" className="text-blue-400">Submit your first request →</a></p>
        ) : (
          <div className="space-y-2">
            {myRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#1f3e72] text-sm">
                <span className="text-slate-200 truncate max-w-xs">{r.title}</span>
                <span className={`text-xs font-bold ${statusColor[r.status]}`}>{r.status}</span>
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
    <DashboardLayout navItems={navItems} roleLabel="Department" roleColor="text-emerald-400">
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

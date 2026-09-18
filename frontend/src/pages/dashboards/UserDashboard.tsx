import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import CorridorTrackMap from '../../components/CorridorTrackMap';
import {
  LayoutDashboard, Train, Map, AlertTriangle, Bell, User,
  Gauge, Zap, ShieldAlert, CheckCircle2, Clock, Navigation, Radio, Info
} from 'lucide-react';
import { trainsAPI, notificationsAPI } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { format } from 'date-fns';

// ── Sub-pages ───────────────────────────────────────────

function PilotHome() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});

  useEffect(() => {
    trainsAPI.myTrain().then(r => setData(r.data)).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = {
    on_time: 'text-green-400',
    delayed: 'text-amber-400',
    held: 'text-red-400',
  };

  const currentSpeed = 92;
  const mps = 110;

  return (
    <div className="space-y-6">
      {/* Welcome & Locomotive Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Loco Pilot Cab Console — {user?.fullName}
          </h1>
          <p className="text-slate-400 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Active Cab Session · Locomotive WAP-7 #30214 · South Central Railway</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#0a192f] border border-blue-500/30 px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <Radio size={14} className="text-green-400 animate-pulse" />
            <span className="text-slate-400">VHF Cab-to-OCC:</span>
            <span className="text-white font-mono font-bold">150.150 MHz (ACTIVE)</span>
          </div>
        </div>
      </div>

      {!data ? (
        <div className="glass-card p-12 text-center text-slate-500 text-sm">
          Fetching live locomotive telemetry and corridor possession data…
        </div>
      ) : (
        <>
          {/* Main Cockpit HUD Telemetry */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Speed Gauge Card */}
            <div className="glass-card p-5 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Speed (MPS: {mps})</span>
                <Gauge size={16} className="text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white font-mono">{currentSpeed}</span>
                <span className="text-sm font-semibold text-slate-400">km/h</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(currentSpeed / mps) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-green-400 mt-2 font-medium">Safe Margin: 18 km/h below MPS</p>
            </div>

            {/* OHE Voltage */}
            <div className="glass-card p-5 border-l-4 border-amber-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">25kV OHE Catenary</span>
                <Zap size={16} className="text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-amber-300 font-mono">24.8</span>
                <span className="text-sm font-semibold text-slate-400">kV AC</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">Pantograph: Rear Up (Maintained)</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">Traction Motor Amps: Normal</p>
            </div>

            {/* Air Brake Pressure */}
            <div className="glass-card p-5 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Brake Pipe (BP)</span>
                <ShieldAlert size={16} className="text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-emerald-300 font-mono">5.0</span>
                <span className="text-sm font-semibold text-slate-400">kg/cm²</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">Main Reservoir: 9.8 kg/cm²</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">Continuous Charge: Verified</p>
            </div>

            {/* Next Signal Aspect */}
            <div className="glass-card p-5 border-l-4 border-yellow-400">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signal Ahead</span>
                <span className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex flex-col gap-1 p-1 bg-black rounded-lg border border-slate-700">
                  <span className="w-3 h-3 rounded-full bg-slate-800" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-md shadow-yellow-400/50" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-md shadow-yellow-400/50" />
                  <span className="w-3 h-3 rounded-full bg-slate-800" />
                </div>
                <div>
                  <p className="text-sm font-bold text-yellow-300">DOUBLE YELLOW</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Attention Aspect</p>
                  <p className="text-[10px] text-amber-300 mt-0.5 font-medium">TSR Caution 30 km/h ahead</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Train Information Banner */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4 border-b border-[#1f3e72] pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚆</span>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Train #{data.train?.number} — {data.train?.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Route: <span className="text-slate-200 font-semibold">{data.originStation?.name} ({data.originStation?.code})</span> →{' '}
                    <span className="text-slate-200 font-semibold">{data.destinationStation?.name} ({data.destinationStation?.code})</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-semibold">Corridor Status</p>
                  <p className={`text-xs font-bold uppercase ${statusColor[data.train?.status] || 'text-slate-300'}`}>
                    {data.train?.status?.replace('_', ' ')}
                    {data.train?.delayMinutes > 0 && ` (+${data.train.delayMinutes} min delay)`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#0a192f] p-3 rounded-lg border border-[#1f3e72]">
                <span className="text-slate-500">Current Track Section</span>
                <p className="text-white font-bold mt-1 text-sm">
                  {data.currentSegment ? data.currentSegment.label : 'Secunderabad Jn Yard'}
                </p>
                <span className="text-[10px] text-blue-400">Chainage KM 42.8</span>
              </div>

              <div className="bg-[#0a192f] p-3 rounded-lg border border-[#1f3e72]">
                <span className="text-slate-500">Next Scheduled Halt</span>
                <p className="text-white font-bold mt-1 text-sm">Warangal Jn (WL)</p>
                <span className="text-[10px] text-slate-400">Distance: 48 KM · ETA 32m</span>
              </div>

              <div className="bg-[#0a192f] p-3 rounded-lg border border-[#1f3e72]">
                <span className="text-slate-500">Track Type & Clearance</span>
                <p className="text-white font-bold mt-1 text-sm">Double Line BG (Broad Gauge)</p>
                <span className="text-[10px] text-emerald-400">Automatic Block Signaling (ABS)</span>
              </div>

              <div className="bg-[#0a192f] p-3 rounded-lg border border-[#1f3e72]">
                <span className="text-slate-500">Caution Orders in Force</span>
                <p className="text-amber-400 font-bold mt-1 text-sm">
                  {data.activeBlocks?.length || 0} Temporary Speed Restrictions
                </p>
                <span className="text-[10px] text-amber-300">TSR speed boards deployed</span>
              </div>
            </div>
          </div>

          {/* Active Caution Orders (TSR) Docket */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  <AlertTriangle size={16} className="text-amber-400" />
                  Official Caution Order Docket (TSRs on SC ↔ VSKP Route)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Mandatory speed reductions and maintenance possessions logged in Operations Control.
                </p>
              </div>
              <span className="text-xs bg-amber-900/30 border border-amber-700/50 text-amber-300 px-2.5 py-1 rounded-full font-bold">
                {data.activeBlocks?.length || 0} ACTIVE RESTRICTIONS
              </span>
            </div>

            {(!data.activeBlocks || data.activeBlocks.length === 0) ? (
              <div className="bg-green-900/20 border border-green-800/40 rounded-lg p-4 text-center text-xs text-green-300">
                ✅ No caution orders or speed restrictions on your active corridor. Full line speed permitted.
              </div>
            ) : (
              <div className="space-y-3">
                {data.activeBlocks.map((b: any) => {
                  const isAck = acknowledged[b.id];
                  return (
                    <div
                      key={b.id}
                      className="bg-[#0a192f] border border-[#1f3e72] hover:border-amber-500/60 rounded-xl p-4 transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-[240px]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-900/50 text-red-300 border border-red-700/50">
                              TSR 30 KM/H
                            </span>
                            <span className="text-xs font-semibold text-slate-300">{b.segment?.label}</span>
                            <span className="text-[10px] text-slate-500">· {b.reportingDepartment}</span>
                          </div>
                          <h4 className="text-sm font-bold text-white">{b.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{b.description}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs">
                            <p className="text-slate-500 text-[10px] uppercase">Possession Window</p>
                            <p className="text-slate-200 font-mono">
                              {b.scheduledStart ? format(new Date(b.scheduledStart), 'dd MMM, HH:mm') : 'Pending'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setAcknowledged(prev => ({ ...prev, [b.id]: true }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isAck
                                ? 'bg-green-900/40 border border-green-600 text-green-300'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md'
                            }`}
                          >
                            {isAck ? (
                              <>
                                <CheckCircle2 size={13} /> Acknowledged
                              </>
                            ) : (
                              'Acknowledge TSR'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PilotBlockAlerts() {
  const [blocks, setBlocks] = useState<any[]>([]);
  useEffect(() => {
    trainsAPI.blockAlerts().then(r => setBlocks(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Corridor Block Alerts & Caution Orders
        </h2>
        <p className="text-xs text-slate-400">
          Official engineering and power possessions requiring loco pilot vigilance on the Secunderabad–Visakhapatnam line.
        </p>
      </div>

      {blocks.length === 0 ? (
        <div className="glass-card p-10 text-center text-slate-400 text-sm">
          ✅ No active maintenance blocks on your corridor route.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b: any) => (
            <div key={b.id} className="glass-card p-5 border-l-4 border-amber-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-900/40 text-amber-300 border border-amber-700/50 rounded text-[10px] font-bold uppercase">
                      Possession Block
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{b.segment?.label}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{b.title}</h3>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed">{b.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  b.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-700/50' :
                  b.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-700/50' :
                  'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                }`}>{b.severity}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-3 border-t border-[#1f3e72] text-xs">
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Executing Dept</p>
                  <p className="text-slate-200 font-semibold">{b.reportingDepartment}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">Start Window</p>
                  <p className="text-slate-200 font-mono">{b.scheduledStart ? format(new Date(b.scheduledStart), 'dd MMM, HH:mm') : 'Pending OCC'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">End Window</p>
                  <p className="text-slate-200 font-mono">{b.scheduledEnd ? format(new Date(b.scheduledEnd), 'dd MMM, HH:mm') : 'Pending OCC'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] uppercase">TSR Restriction</p>
                  <p className="text-amber-400 font-semibold">30 km/h Caution</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PilotRouteStatus() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    trainsAPI.myTrain().then(r => setData(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Live Corridor Route View
          </h2>
          <p className="text-xs text-slate-400">
            Real-time track telemetry, block possessions, and caution orders along your train journey.
          </p>
        </div>
        {data?.train && (
          <div className="bg-[#0a192f] border border-[#1f3e72] px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-slate-400">Locomotive: </span>
            <strong className="text-white font-mono">{data.train.number} {data.train.name}</strong>
          </div>
        )}
      </div>

      <CorridorTrackMap
        userRole="USER_PILOT"
        pilotCurrentSegmentId={data?.currentSegment?.id}
        pilotTrainNumber={data?.train?.number}
      />

      <PilotBlockAlerts />
    </div>
  );
}

function PilotNotifications() {
  const [notifs, setNotifs] = useState<any[]>([]);
  useEffect(() => {
    notificationsAPI.getAll().then(r => setNotifs(r.data)).catch(() => {});
  }, []);

  const markRead = async (id: string) => {
    await notificationsAPI.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Cab Operational Notifications
          </h2>
          <p className="text-xs text-slate-400">Direct OCC broadcasts, Caution Order updates, and signal authorizations.</p>
        </div>
      </div>

      <div className="space-y-3">
        {notifs.length === 0 && (
          <div className="glass-card p-8 text-center text-slate-400 text-sm">
            No active operational notifications.
          </div>
        )}
        {notifs.map(n => (
          <div
            key={n.id}
            className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-all ${
              n.isRead ? 'opacity-60' : 'border-l-4 border-blue-500 bg-blue-950/20'
            }`}
            onClick={() => !n.isRead && markRead(n.id)}
          >
            <span className="text-2xl flex-shrink-0">
              {n.type === 'block_alert' ? '⚠️' : n.type === 'request_scheduled' ? '✅' : '🔔'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-slate-100 font-semibold'}`}>{n.message}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1 animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function PilotProfile() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  useEffect(() => { trainsAPI.myTrain().then(r => setData(r.data)).catch(() => {}); }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Loco Pilot Operational Profile
        </h2>
        <p className="text-xs text-slate-400">Certified locomotive driver dossier and corridor authorization.</p>
      </div>

      <div className="glass-card p-8">
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-[#1f3e72]">
          <div className="w-16 h-16 rounded-full bg-blue-800 border-2 border-blue-400 flex items-center justify-center text-3xl shadow-lg shadow-blue-900/50">
            🚆
          </div>
          <div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {user?.fullName}
            </h3>
            <p className="text-blue-400 text-sm font-semibold">Chief Loco Pilot · {user?.employeeId}</p>
            <p className="text-slate-400 text-xs mt-0.5">South Central Railway · Secunderabad Division</p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Employee ID', val: user?.employeeId },
            { label: 'Official Email', val: user?.email },
            { label: 'Assigned Corridor Train', val: data?.train ? `${data.train.number} ${data.train.name}` : 'Train 12728 Godavari Express' },
            { label: 'Loco Class Competency', val: 'WAP-7, WAP-4, WAG-9 (25kV AC Traction)' },
            { label: 'Medical Category', val: 'Aye-One (A-1) — Valid through 2028' },
            { label: 'Safety Record Rating', val: 'Grade A+ (Zero Signal Passed At Danger / SPAD)' },
          ].map(f => (
            <div key={f.label} className="flex justify-between items-center py-2.5 border-b border-[#1f3e72]/60 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wider">{f.label}</span>
              <span className="text-slate-200 font-medium">{f.val}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-900/20 border border-blue-700/40 rounded-lg p-4 text-xs text-blue-300 flex items-start gap-3">
          <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <span>
            Loco Pilot accounts operate with safety-critical read-only corridor telemetry. Block scheduling modifications and possession authorizations are reserved exclusively for Operations Control (Admin).
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────

const navItems = [
  { icon: LayoutDashboard, label: 'Cockpit HUD', to: '/dashboard/user' },
  { icon: Train, label: 'My Train', to: '/dashboard/user/my-train' },
  { icon: Map, label: 'Corridor Route', to: '/dashboard/user/route' },
  { icon: AlertTriangle, label: 'Caution Orders', to: '/dashboard/user/block-alerts' },
  { icon: Bell, label: 'Notifications', to: '/dashboard/user/notifications' },
  { icon: User, label: 'Pilot Profile', to: '/dashboard/user/profile' },
];

export default function UserDashboard() {
  return (
    <DashboardLayout navItems={navItems} roleLabel="Loco Pilot" roleColor="text-blue-400">
      <Routes>
        <Route index element={<PilotHome />} />
        <Route path="my-train" element={<PilotHome />} />
        <Route path="route" element={<PilotRouteStatus />} />
        <Route path="block-alerts" element={<PilotBlockAlerts />} />
        <Route path="notifications" element={<PilotNotifications />} />
        <Route path="profile" element={<PilotProfile />} />
        <Route path="*" element={<Navigate to="/dashboard/user" replace />} />
      </Routes>
    </DashboardLayout>
  );
}

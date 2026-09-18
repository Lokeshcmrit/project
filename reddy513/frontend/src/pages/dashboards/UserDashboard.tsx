import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import CorridorTrackMap from '../../components/CorridorTrackMap';
import {
  LayoutDashboard, Train, Map, AlertTriangle, Bell, User
} from 'lucide-react';
import { trainsAPI, notificationsAPI } from '../../api/client';
import { useAuth } from '../../store/AuthContext';
import { format } from 'date-fns';

// ── Sub-pages ───────────────────────────────────────────

function PilotHome() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => { trainsAPI.myTrain().then(r => setData(r.data)).catch(() => {}); }, []);

  const statusColor: Record<string, string> = {
    on_time: 'text-green-400',
    delayed: 'text-amber-400',
    held: 'text-red-400',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>
        Welcome, {user?.fullName?.split(' ')[0]} 👋
      </h1>
      {!data ? (
        <div className="text-slate-500 text-sm">Loading train data…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Assigned Train */}
          <div className="glass-card p-6 col-span-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Assigned Train</p>
            <div className="flex items-start gap-6">
              <div className="text-5xl">🚆</div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Train Number</p>
                  <p className="text-lg font-bold text-white">{data.train?.number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Train Name</p>
                  <p className="font-semibold text-slate-200">{data.train?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Route</p>
                  <p className="text-sm font-medium text-slate-200">
                    {data.originStation?.name || '?'} → {data.destinationStation?.name || '?'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className={`font-bold capitalize ${statusColor[data.train?.status] || 'text-slate-300'}`}>
                    {data.train?.status?.replace('_', ' ') || 'N/A'}
                    {data.train?.delayMinutes > 0 && ` (+${data.train.delayMinutes} min)`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Segment */}
          <div className="glass-card p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Current Section</p>
            {data.currentSegment ? (
              <>
                <p className="text-xl font-bold text-white mb-1">{data.currentSegment.fromStation?.name}</p>
                <p className="text-slate-400 text-sm">→ {data.currentSegment.toStation?.name}</p>
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  data.currentSegment.status === 'NORMAL' ? 'bg-green-900/40 text-green-400' :
                  data.currentSegment.status === 'CONFLICT' ? 'bg-red-900/40 text-red-400' :
                  'bg-amber-900/40 text-amber-400'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {data.currentSegment.status?.replace('_', ' ')}
                </div>
              </>
            ) : <p className="text-slate-500 text-sm">No current section assigned</p>}
          </div>

          {/* Active Blocks Alert Preview */}
          <div className="glass-card p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Active Blocks on Your Route</p>
            {data.activeBlocks?.length === 0 ? (
              <p className="text-green-400 text-sm">✅ No active blocks on your route</p>
            ) : (
              <div className="space-y-2">
                {data.activeBlocks?.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="bg-red-900/20 border border-red-800/40 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-red-300">{b.segment?.label}</p>
                    <p className="text-slate-400 text-xs mt-1">{b.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PilotBlockAlerts() {
  const [blocks, setBlocks] = useState<any[]>([]);
  useEffect(() => { trainsAPI.blockAlerts().then(r => setBlocks(r.data)).catch(() => {}); }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Block Alerts & Caution Orders</h2>
      {blocks.length === 0 ? (
        <div className="glass-card p-10 text-center text-slate-400">✅ No active maintenance blocks on your corridor route</div>
      ) : (
        <div className="space-y-3">
          {blocks.map((b: any) => (
            <div key={b.id} className="glass-card p-5 border-l-4 border-amber-500">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{b.title}</p>
                  <p className="text-slate-400 text-sm mt-1">{b.segment?.label}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  b.severity === 'CRITICAL' ? 'bg-red-900/50 text-red-300' :
                  b.severity === 'HIGH' ? 'bg-orange-900/50 text-orange-300' :
                  'bg-amber-900/50 text-amber-300'
                }`}>{b.severity}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-slate-400">
                <div><p className="text-slate-500">Dept</p><p className="text-slate-200">{b.reportingDepartment}</p></div>
                <div><p className="text-slate-500">Start</p><p className="text-slate-200">{b.scheduledStart ? format(new Date(b.scheduledStart), 'dd MMM, HH:mm') : 'TBD'}</p></div>
                <div><p className="text-slate-500">End</p><p className="text-slate-200">{b.scheduledEnd ? format(new Date(b.scheduledEnd), 'dd MMM, HH:mm') : 'TBD'}</p></div>
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
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
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
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Notifications</h2>
      <div className="space-y-3">
        {notifs.length === 0 && <div className="glass-card p-8 text-center text-slate-400 text-sm">No notifications yet</div>}
        {notifs.map(n => (
          <div key={n.id} className={`glass-card p-4 flex items-start gap-4 cursor-pointer transition-opacity ${n.isRead ? 'opacity-60' : ''}`} onClick={() => !n.isRead && markRead(n.id)}>
            <span className="text-2xl flex-shrink-0">
              {n.type === 'block_alert' ? '⚠️' : n.type === 'request_scheduled' ? '✅' : '🔔'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>{n.message}</p>
              <p className="text-xs text-slate-500 mt-1">{format(new Date(n.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            {!n.isRead && <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 mt-1" />}
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
    <div>
      <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>My Profile</h2>
      <div className="glass-card p-8 max-w-lg">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-800 flex items-center justify-center text-3xl">🚆</div>
          <div>
            <h3 className="text-lg font-bold text-white">{user?.fullName}</h3>
            <p className="text-slate-400 text-sm">Chief Loco Pilot · {user?.employeeId}</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Email', val: user?.email },
            { label: 'Employee ID', val: user?.employeeId },
            { label: 'Assigned Train', val: data?.train ? `${data.train.number} ${data.train.name}` : 'Not assigned' },
          ].map(f => (
            <div key={f.label} className="flex justify-between items-center py-3 border-b border-[#1f3e72]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{f.label}</span>
              <span className="text-sm text-slate-200">{f.val}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-amber-900/20 border border-amber-700/40 rounded-lg p-4 text-xs text-amber-300">
          🔒 Loco Pilot accounts have read-only access. Contact Railway Operations Admin to modify scheduling data.
        </div>
      </div>
    </div>
  );
}

// ── Layout ──────────────────────────────────────────────

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard/user' },
  { icon: Train, label: 'My Train', to: '/dashboard/user/my-train' },
  { icon: Map, label: 'My Route', to: '/dashboard/user/route' },
  { icon: AlertTriangle, label: 'Block Alerts', to: '/dashboard/user/block-alerts' },
  { icon: Bell, label: 'Notifications', to: '/dashboard/user/notifications' },
  { icon: User, label: 'Profile', to: '/dashboard/user/profile' },
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

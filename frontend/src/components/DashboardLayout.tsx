import React, { useEffect, useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { notificationsAPI, requestsAPI } from '../api/client';
import { getSocket } from '../sockets/socket';
import {
  Train, Bell, LogOut,
  ChevronLeft, ChevronRight, Shield, Wrench, Activity,
  Volume2, VolumeX, Radio
} from 'lucide-react';
import AlertPopup, { CorridorAlert } from './AlertPopup';
import BroadcastModal from './BroadcastModal';
import {
  initAudioOnUserGesture,
  playAlarmSound,
  stopAlarmSound,
  isAudioMuted,
  setAudioMuted,
  testAlarmSound,
} from '../utils/alarmSound';

interface NavItem {
  icon: React.ElementType;
  label: string;
  to: string;
}

interface Props {
  navItems: NavItem[];
  roleLabel: string;
  roleColor: string;
  children: ReactNode;
}

export default function DashboardLayout({ navItems, roleLabel, roleColor, children }: Props) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [activeAlert, setActiveAlert] = useState<CorridorAlert | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isAudioMuted());

  const isPilot = user?.role === 'USER_PILOT' || roleLabel === 'Loco Pilot' || location.pathname.includes('/dashboard/user');
  const isAdmin = user?.role === 'ADMIN' || roleLabel === 'Operations Admin' || location.pathname.includes('/dashboard/admin');
  const isDepartment = user?.role === 'DEPARTMENT' || roleLabel === 'Department' || location.pathname.includes('/dashboard/department');

  useEffect(() => {
    initAudioOnUserGesture();
    notificationsAPI.unreadCount().then(r => setUnread(r.data.unreadCount)).catch(() => {});

    // When Admin or Loco Pilot opens their dashboard, check if there are pending department requests
    if (isAdmin || isPilot) {
      requestsAPI.getAll({ status: 'SUBMITTED' }).then((res) => {
        const pending = res.data;
        if (pending && pending.length > 0) {
          // Sort by highest priority score
          const topReq = [...pending].sort((a: any, b: any) => (b.priorityScore || 0) - (a.priorityScore || 0))[0];
          const alertKey = `railsync_alerted_pending_${topReq.id}_${isPilot ? 'pilot' : 'admin'}`;
          if (!sessionStorage.getItem(alertKey)) {
            const alertData: CorridorAlert = {
              id: `pending-${topReq.id}-${Date.now()}`,
              title: isPilot
                ? `⚠️ Track Block Caution Notice: ${topReq.title}`
                : `🚨 Urgent: Department Request Pending Review`,
              message: isPilot
                ? `${topReq.reportingDepartment || 'Maintenance'} department requested a track block on ${topReq.segment?.label || 'Corridor Mainline'}. Priority Score: ${topReq.priorityScore || 85}. Caution order active for Loco Pilots.`
                : `${topReq.reportingDepartment || 'Maintenance'} department has requested a track block possession for: "${topReq.title}" on ${topReq.segment?.label || 'Corridor Mainline'}. Priority Score: ${topReq.priorityScore || 85}. Chief Controller approval required.`,
              sourceRole: 'DEPARTMENT',
              sourceDepartment: topReq.reportingDepartment,
              targetAudience: isPilot ? 'Chief Loco Pilot (Train Cab)' : 'Operations Control Centre (OCC Admin)',
              targetRoles: ['ADMIN', 'USER_PILOT'],
              severity: topReq.severity || 'HIGH',
              segmentLabel: topReq.segment?.label || 'Secunderabad ↔ Kazipet',
              priorityScore: topReq.priorityScore,
              details: topReq.description,
              requestId: topReq.id,
              sound: topReq.severity === 'CRITICAL' ? 'emergency' : 'alarm',
              timestamp: topReq.createdAt || new Date().toISOString(),
            };
            setActiveAlert(alertData);
            playAlarmSound(alertData.sound);
            sessionStorage.setItem(alertKey, 'true');
          }
        }
      }).catch(() => {});
    }
  }, [user, location.pathname, roleLabel, isAdmin, isPilot]);

  useEffect(() => {
    const socket = getSocket();

    // High-priority corridor alert with audible alarm pop-up
    socket.on('corridor:alert', (alertData: CorridorAlert) => {
      // 1. If in Department dashboard and this is a department request, do NOT show popup
      if (isDepartment && alertData.sourceRole === 'DEPARTMENT') {
        return;
      }
      // 2. If targetRoles is specified, ensure current user matches
      if (alertData.targetRoles && alertData.targetRoles.length > 0) {
        const allowed =
          (isAdmin && alertData.targetRoles.includes('ADMIN')) ||
          (isPilot && (alertData.targetRoles.includes('USER_PILOT') || alertData.targetRoles.includes('PILOT')));
        if (!allowed) {
          return;
        }
      }

      setActiveAlert(alertData);
      setUnread(prev => prev + 1);
      addToast(`🚨 ${alertData.title}`, alertData.severity === 'CRITICAL' ? 'warning' : 'info');
      const soundType = alertData.sound || (alertData.severity === 'CRITICAL' ? 'emergency' : 'alarm');
      playAlarmSound(soundType);
    });

    socket.on('notification:new', (notif: any) => {
      setUnread(prev => prev + 1);
      addToast(notif.message || 'New notification', 'info');
    });

    // When department files request, trigger instant alert popup + alarm sound for Admin and Loco Pilot ONLY
    socket.on('request:new', (req: any) => {
      if (isAdmin || isPilot) {
        const alertData: CorridorAlert = {
          id: `alert-req-${req.id}-${Date.now()}`,
          title: isPilot ? `⚠️ Track Block Notice: ${req.title}` : `🚨 New Department Block Request Filed`,
          message: isPilot
            ? `${req.reportingDepartment || 'Maintenance'} department requested a track block on ${req.segment?.label || req.segmentId || 'Corridor'}. Caution order alert for Loco Pilots.`
            : `${req.reportingDepartment || 'Maintenance'} department submitted a maintenance block request on ${req.segment?.label || req.segmentId || 'Corridor'}. Priority Score: ${req.priorityScore || 80}. Immediate Controller review needed.`,
          sourceRole: 'DEPARTMENT',
          sourceDepartment: req.reportingDepartment,
          targetAudience: isPilot ? 'Chief Loco Pilot (Train Cab)' : 'Operations Control Centre (OCC Admin)',
          targetRoles: ['ADMIN', 'USER_PILOT'],
          severity: req.severity || 'HIGH',
          segmentLabel: req.segment?.label,
          priorityScore: req.priorityScore,
          details: req.description,
          requestId: req.id,
          sound: req.severity === 'CRITICAL' ? 'emergency' : 'alarm',
          timestamp: new Date().toISOString(),
        };
        setActiveAlert(alertData);
        setUnread(prev => prev + 1);
        playAlarmSound(alertData.sound);
        addToast(alertData.title, 'warning');
      }
    });

    socket.on('request:statusChanged', (req: any) => {
      addToast(`Request updated: ${req.status}`, 'success');
    });
    socket.on('block:approved', (payload: any) => {
      addToast(payload.message || 'Block approved', 'success');
    });

    return () => {
      socket.off('corridor:alert');
      socket.off('notification:new');
      socket.off('request:new');
      socket.off('request:statusChanged');
      socket.off('block:approved');
      stopAlarmSound();
    };
  }, [user]);

  const toggleSound = () => {
    const next = !soundMuted;
    setSoundMuted(next);
    setAudioMuted(next);
  };

  const addToast = (msg: string, type: string) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/select-role');
  };

  const roleIcon = user?.role === 'ADMIN' ? Shield : user?.role === 'DEPARTMENT' ? Wrench : Train;
  const RoleIcon = roleIcon;

  return (
    <div className="flex h-screen bg-[#050b14] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`flex flex-col transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} bg-[#0a192f] border-r border-[#1f3e72] flex-shrink-0 z-20`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[#1f3e72]">
          <span className="text-2xl">🚆</span>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>RailSync AI</div>
              <div className={`text-[10px] font-semibold uppercase tracking-widest ${roleColor}`}>{roleLabel}</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${active ? 'active text-blue-300 bg-[#132d56]' : 'text-slate-400 hover:text-slate-200 hover:bg-[#132d56]/50'}`}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse + User Info */}
        <div className="border-t border-[#1f3e72] p-3">
          <div className={`flex items-center gap-2 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-blue-800/80 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
              <RoleIcon size={14} className="text-blue-300" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{user?.fullName || 'Rail Officer'}</div>
                <div className="text-[10px] text-slate-400 truncate">{user?.employeeId}</div>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 text-xs text-slate-400 hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-900/20 ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
              title="Sign Out"
            >
              <LogOut size={14} />
              {!collapsed && 'Sign Out'}
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-[#132d56]"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-[#1f3e72] flex items-center justify-between px-6 bg-[#0a192f]/80 backdrop-blur-md flex-shrink-0 z-30">
          {/* Corridor Live Status */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity size={14} className="text-green-400 live-dot animate-pulse" />
            <span className="hidden sm:inline">Secunderabad Jn ↔ Visakhapatnam Jn Corridor</span>
            <span className="sm:hidden">SC ↔ VSKP</span>
            <span className="px-2 py-0.5 bg-green-900/40 text-green-400 border border-green-700/40 rounded text-[10px] font-bold uppercase">LIVE</span>
          </div>

          {/* Top Actions: Audio Toggle, Broadcast Alert, Notifications & Sign Out */}
          <div className="flex items-center gap-2.5">
            {/* Audio Alarm Sound Toggle */}
            <div className="flex items-center gap-1.5 bg-[#0e1f3b] border border-[#1f3e72] px-2.5 py-1 rounded-lg">
              <button
                type="button"
                onClick={toggleSound}
                className={`flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${
                  soundMuted ? 'text-slate-400 hover:text-slate-200' : 'text-emerald-400 hover:text-emerald-300'
                }`}
                title={soundMuted ? 'Unmute Audio Alarm' : 'Mute Audio Alarm'}
              >
                {soundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                <span className="hidden md:inline">{soundMuted ? 'Alarm: OFF' : 'Alarm: ON'}</span>
              </button>
              <button
                type="button"
                onClick={testAlarmSound}
                className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer"
                title="Test Alarm Audio Tone"
              >
                Test
              </button>
            </div>

            {/* Corridor Emergency Broadcast Button */}
            <button
              type="button"
              onClick={() => setIsBroadcastOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600/90 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all border border-red-500/50 cursor-pointer animate-pulse hover:animate-none"
              title="Broadcast Corridor Alert to All Roles"
            >
              <Radio size={14} />
              <span className="hidden sm:inline">Broadcast Alert</span>
            </button>

            {/* Notifications Bell */}
            <Link
              to={`/dashboard/${user?.role === 'ADMIN' ? 'admin' : user?.role === 'DEPARTMENT' ? 'department' : 'user'}/notifications`}
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#132d56] transition-colors"
              title="Notifications"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-lg animate-pulse">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>

            {/* Header Sign Out */}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-[#132d56] transition-colors border border-transparent hover:border-red-500/30 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#050b14]">
          {children}
        </div>
      </main>

      {/* Live Toast Alerts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`max-w-sm px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all backdrop-blur-md pointer-events-auto
              ${t.type === 'warning' ? 'bg-amber-950/90 border-amber-600 text-amber-200' :
                t.type === 'success' ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' :
                'bg-blue-950/90 border-blue-600 text-blue-200'}`}
          >
            <span className="mr-2">{t.type === 'warning' ? '⚠️' : t.type === 'success' ? '✅' : '🔔'}</span>
            {t.msg.length > 80 ? t.msg.slice(0, 80) + '…' : t.msg}
          </div>
        ))}
      </div>

      {/* Real-time High Urgency Alert Popup Modal with Audible Alarm */}
      <AlertPopup
        alert={activeAlert}
        onClose={() => {
          stopAlarmSound();
          setActiveAlert(null);
        }}
      />

      {/* Corridor Alert Dispatcher Modal */}
      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        userRole={user?.role}
        department={user?.department}
      />
    </div>
  );
}

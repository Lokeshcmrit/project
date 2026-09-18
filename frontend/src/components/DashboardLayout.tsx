import React, { useEffect, useState, useRef, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { notificationsAPI, authAPI } from '../api/client';
import { getSocket } from '../sockets/socket';
import {
  LayoutDashboard, Train, Map, AlertTriangle, Bell, User, LogOut,
  ChevronLeft, ChevronRight, Shield, Wrench, Activity, ChevronDown,
  Zap, Loader2, ArrowLeftRight, Check
} from 'lucide-react';

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

const SWITCH_ACCOUNTS = [
  {
    roleKey: 'ADMIN',
    label: 'Operations Admin (OCC)',
    sublabel: 'Corridor Control & AI Studio',
    id: 'admin@railsync.ir',
    pw: 'Admin@123',
    icon: Shield,
    color: 'text-yellow-400',
    route: '/dashboard/admin',
  },
  {
    roleKey: 'DEPARTMENT_ENG',
    label: 'Civil Engineering (P-Way)',
    sublabel: 'Track Maintenance Gang',
    id: 'engg@railsync.ir',
    pw: 'Password@123',
    icon: Wrench,
    color: 'text-emerald-400',
    route: '/dashboard/department',
  },
  {
    roleKey: 'DEPARTMENT_TD',
    label: 'Traction Distribution (OHE)',
    sublabel: '25kV Overhead Catenary',
    id: 'td@railsync.ir',
    pw: 'Password@123',
    icon: Zap,
    color: 'text-amber-400',
    route: '/dashboard/department',
  },
  {
    roleKey: 'DEPARTMENT_SNT',
    label: 'Signal & Telecom (S&T)',
    sublabel: 'Point Machines & Signals',
    id: 'sandt@railsync.ir',
    pw: 'Password@123',
    icon: Activity,
    color: 'text-cyan-400',
    route: '/dashboard/department',
  },
  {
    roleKey: 'USER_PILOT',
    label: 'Chief Loco Pilot',
    sublabel: 'Train 12728 Godavari Exp',
    id: 'pilot@railsync.ir',
    pw: 'Password@123',
    icon: Train,
    color: 'text-blue-400',
    route: '/dashboard/user',
  },
];

export default function DashboardLayout({ navItems, roleLabel, roleColor, children }: Props) {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notificationsAPI.unreadCount().then(r => setUnread(r.data.unreadCount)).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    socket.on('notification:new', (notif: any) => {
      setUnread(prev => prev + 1);
      addToast(notif.message || 'New notification', 'info');
    });
    socket.on('request:new', (req: any) => {
      if (user?.role === 'ADMIN') {
        addToast(`New request: ${req.title}`, 'warning');
        setUnread(prev => prev + 1);
      }
    });
    socket.on('request:statusChanged', (req: any) => {
      addToast(`Request updated: ${req.status}`, 'success');
    });
    socket.on('block:approved', (payload: any) => {
      addToast(payload.message || 'Block approved', 'success');
    });
    return () => {
      socket.off('notification:new');
      socket.off('request:new');
      socket.off('request:statusChanged');
      socket.off('block:approved');
    };
  }, [user]);

  const addToast = (msg: string, type: string) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-3), { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleLogout = () => {
    logout();
    navigate('/select-role');
  };

  const handleRoleSwitch = async (acc: typeof SWITCH_ACCOUNTS[0]) => {
    if (user?.email === acc.id) {
      setSwitcherOpen(false);
      return;
    }
    setSwitching(true);
    try {
      const res = await authAPI.login({
        usernameOrEmployeeId: acc.id,
        password: acc.pw,
      });
      login(res.data.token, res.data.user);
      setSwitcherOpen(false);
      navigate(acc.route);
    } catch (err) {
      console.error('Role switch failed', err);
    } finally {
      setSwitching(false);
    }
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

          {/* Top Actions: Role Switcher & Notifications */}
          <div className="flex items-center gap-3">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setSwitcherOpen(!switcherOpen)}
                disabled={switching}
                className="flex items-center gap-2 bg-[#0d2244] border border-blue-500/40 hover:border-blue-400 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm"
              >
                {switching ? (
                  <Loader2 size={13} className="animate-spin text-blue-400" />
                ) : (
                  <ArrowLeftRight size={13} className="text-yellow-400" />
                )}
                <span className="hidden md:inline text-slate-300">Switch Role:</span>
                <span className={roleColor}>{roleLabel}</span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {switcherOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#09172e] border border-[#1f3e72] rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-[#1f3e72] mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Operational Dashboard</p>
                    <p className="text-[10px] text-slate-500">1-click instant login as official personnel</p>
                  </div>

                  <div className="space-y-1">
                    {SWITCH_ACCOUNTS.map(acc => {
                      const Icon = acc.icon;
                      const isCurrent = user?.email === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleRoleSwitch(acc)}
                          className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors text-xs ${
                            isCurrent
                              ? 'bg-blue-900/30 border border-blue-600/40 text-white'
                              : 'hover:bg-[#132d56] text-slate-300'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-md bg-[#050b14] flex items-center justify-center flex-shrink-0">
                            <Icon size={14} className={acc.color} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold flex items-center gap-1.5">
                              <span>{acc.label}</span>
                              {isCurrent && <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-mono">ACTIVE</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{acc.sublabel}</div>
                          </div>
                          {isCurrent && <Check size={14} className="text-blue-400 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#1f3e72] flex items-center justify-between text-xs px-2">
                    <Link
                      to="/select-role"
                      onClick={() => setSwitcherOpen(false)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      Role Portal →
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

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
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#050b14]">
          {children}
        </div>
      </main>

      {/* Live Toast Alerts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`max-w-sm px-4 py-3 rounded-xl text-sm font-medium shadow-2xl border transition-all backdrop-blur-md
              ${t.type === 'warning' ? 'bg-amber-950/90 border-amber-600 text-amber-200' :
                t.type === 'success' ? 'bg-emerald-950/90 border-emerald-600 text-emerald-200' :
                'bg-blue-950/90 border-blue-600 text-blue-200'}`}
          >
            <span className="mr-2">{t.type === 'warning' ? '⚠️' : t.type === 'success' ? '✅' : '🔔'}</span>
            {t.msg.length > 80 ? t.msg.slice(0, 80) + '…' : t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

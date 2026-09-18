import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { authAPI } from '../api/client';
import { Loader2, ArrowRight, Zap, Shield, Wrench, Train } from 'lucide-react';

const roles = [
  {
    icon: '🚆',
    title: 'USER / LOCO PILOT',
    subtitle: 'Chief Loco Pilot Console',
    desc: 'Cab dashboard, train telemetry (speed, 25kV OHE, brake pressure), live route map, and caution orders.',
    demoId: 'pilot@railsync.ir',
    demoPw: 'Password@123',
    color: 'border-blue-600 hover:border-blue-400',
    badge: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
    route: '/login/user',
    dashRoute: '/dashboard/user',
    role: 'USER_PILOT',
    roleIcon: Train,
  },
  {
    icon: '🛡️',
    title: 'OPERATIONS ADMIN',
    subtitle: 'Railway Operations Control (OCC)',
    desc: 'Corridor-wide block management, automated AI optimizer studio, conflict resolution, and audit log.',
    demoId: 'admin@railsync.ir',
    demoPw: 'Admin@123',
    color: 'border-yellow-600 hover:border-yellow-400',
    badge: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
    route: '/login/admin',
    dashRoute: '/dashboard/admin',
    role: 'ADMIN',
    roleIcon: Shield,
  },
  {
    icon: '🏢',
    title: 'DEPARTMENT',
    subtitle: 'Maintenance Department Hub',
    desc: 'File defects (Civil P-Way, 25kV OHE, S&T), upload photo proof, track requests, and execute track possessions.',
    demoId: 'engg@railsync.ir',
    demoPw: 'Password@123',
    color: 'border-emerald-600 hover:border-emerald-400',
    badge: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    route: '/login/department',
    dashRoute: '/dashboard/department',
    role: 'DEPARTMENT',
    roleIcon: Wrench,
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInstantLaunch = async (demoId: string, demoPw: string, dashRoute: string, roleKey: string) => {
    setError(null);
    setLoadingRole(roleKey);
    try {
      const res = await authAPI.login({
        usernameOrEmployeeId: demoId,
        password: demoPw,
      });
      login(res.data.token, res.data.user);
      navigate(dashRoute);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify the backend service is running.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl">
        <div className="text-5xl mb-3">🚆</div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          RailSync AI
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          AI-Powered Automatic Block Planning System — South Central & East Coast Corridor<br />
          <span className="text-yellow-400 font-medium">Secunderabad Jn (`SC`) ↔ Visakhapatnam Jn (`VSKP`)</span>
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Smart India Hackathon Prototype
          </span>
        </div>
      </div>

      {/* Active User Banner if already authenticated */}
      {user && (
        <div className="mb-8 w-full max-w-4xl bg-blue-950/40 border border-blue-800/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <p className="text-xs text-slate-400">Currently Authenticated</p>
              <p className="text-sm font-bold text-white">
                {user.fullName} <span className="text-blue-400 font-normal">({user.role} · {user.employeeId})</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const map: Record<string, string> = {
                ADMIN: '/dashboard/admin',
                DEPARTMENT: '/dashboard/department',
                USER_PILOT: '/dashboard/user',
              };
              navigate(map[user.role] || '/dashboard/admin');
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
          >
            Go to Active Dashboard <ArrowRight size={14} />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 w-full max-w-4xl bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
        {roles.map(r => {
          const isLoading = loadingRole === r.role;
          return (
            <div
              key={r.role}
              className={`glass-card border-2 ${r.color} p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl hover:border-opacity-100 group relative`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{r.icon}</span>
                  <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${r.badge}`}>
                    {r.title}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {r.subtitle}
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">
                  {r.desc}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1f3e72]">
                {/* 1-Click Launch Button */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleInstantLaunch(r.demoId, r.demoPw, r.dashRoute, r.role)}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Launching…
                    </>
                  ) : (
                    <>
                      <Zap size={14} className="text-yellow-300" /> 1-Click Launch Console
                    </>
                  )}
                </button>

                {/* Password Login link */}
                <button
                  type="button"
                  onClick={() => navigate(r.route)}
                  className="w-full py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white border border-[#1f3e72] hover:border-slate-500 transition-colors"
                >
                  Sign In with Password →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Demo Credentials Matrix (Click to Launch) */}
      <div className="glass-card p-6 max-w-4xl w-full">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            ⚡ Quick Demo Accounts (Click Any Card to Launch Instantly)
          </p>
          <span className="text-[11px] text-slate-500">Auto-authenticates with seeded corridor data</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[
            { label: '🛡️ OCC Admin', id: 'admin@railsync.ir', pw: 'Admin@123', route: '/dashboard/admin', roleKey: 'ADMIN' },
            { label: '🔧 Civil Engg', id: 'engg@railsync.ir', pw: 'Password@123', route: '/dashboard/department', roleKey: 'DEPARTMENT_ENG' },
            { label: '⚡ Traction OHE', id: 'td@railsync.ir', pw: 'Password@123', route: '/dashboard/department', roleKey: 'DEPARTMENT_TD' },
            { label: '📡 Signal S&T', id: 'sandt@railsync.ir', pw: 'Password@123', route: '/dashboard/department', roleKey: 'DEPARTMENT_SNT' },
            { label: '🚆 Loco Pilot', id: 'pilot@railsync.ir', pw: 'Password@123', route: '/dashboard/user', roleKey: 'USER_PILOT' },
          ].map(c => (
            <button
              key={c.id}
              type="button"
              disabled={loadingRole !== null}
              onClick={() => handleInstantLaunch(c.id, c.pw, c.route, c.roleKey)}
              className="bg-[#0a192f] border border-[#1f3e72] hover:border-blue-500 rounded-lg p-3 text-left transition-all hover:bg-blue-950/30 group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-blue-400 flex items-center justify-between">
                <span>{c.label}</span>
                <span className="text-[10px] text-slate-500 group-hover:text-blue-300">↗</span>
              </div>
              <div className="text-slate-400 text-[11px] mt-1 font-mono truncate">{c.id}</div>
              <div className="text-slate-500 text-[10px] mt-0.5">Password: {c.pw}</div>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500">
        Need to register a custom staff account?{' '}
        <Link to="/register" className="text-blue-400 hover:text-blue-300 underline">
          Register new personnel
        </Link>
      </p>
    </div>
  );
}

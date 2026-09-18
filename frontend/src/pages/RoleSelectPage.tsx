import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { ArrowRight } from 'lucide-react';

const roles = [
  {
    icon: '🚆',
    title: 'USER / LOCO PILOT',
    subtitle: 'Chief Loco Pilot Console',
    desc: 'Cab dashboard, train telemetry (speed, 25kV OHE, brake pressure), live route map, and caution orders.',
    color: 'border-blue-600 hover:border-blue-400',
    badge: 'bg-blue-900/50 text-blue-300 border border-blue-700/50',
    btnColor: 'bg-blue-600 hover:bg-blue-500',
    route: '/login/user',
    role: 'USER_PILOT',
  },
  {
    icon: '🛡️',
    title: 'OPERATIONS ADMIN',
    subtitle: 'Railway Operations Control (OCC)',
    desc: 'Corridor-wide block management, automated AI optimizer studio, conflict resolution, and audit log.',
    color: 'border-yellow-600 hover:border-yellow-400',
    badge: 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50',
    btnColor: 'bg-yellow-600 hover:bg-yellow-500',
    route: '/login/admin',
    role: 'ADMIN',
  },
  {
    icon: '🏢',
    title: 'DEPARTMENT',
    subtitle: 'Maintenance Department Hub',
    desc: 'File defects (Civil P-Way, 25kV OHE, S&T), upload photo proof, track requests, and execute track possessions.',
    color: 'border-emerald-600 hover:border-emerald-400',
    badge: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50',
    btnColor: 'bg-emerald-600 hover:bg-emerald-500',
    route: '/login/department',
    role: 'DEPARTMENT',
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center px-6 py-12">
      {/* Header - Clean title with corridor and prototype badge removed as requested */}
      <div className="text-center mb-10 max-w-2xl">
        <div className="text-5xl mb-3">🚆</div>
        <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          RailSync AI
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          AI-Powered Automatic Block Planning System
        </p>
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

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
        {roles.map(r => (
          <div
            key={r.role}
            className={`glass-card border-2 ${r.color} p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-2xl group relative rounded-xl bg-[#0a192f]/80`}
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

            <div className="pt-2 border-t border-[#1f3e72]">
              {/* Single Clean Sign In button (1-Click Launch removed as requested) */}
              <button
                type="button"
                onClick={() => navigate(r.route)}
                className={`w-full py-2.5 rounded-lg text-xs font-semibold text-white ${r.btnColor} transition-all flex items-center justify-center gap-2 shadow-lg`}
              >
                Sign In with Password →
              </button>
            </div>
          </div>
        ))}
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

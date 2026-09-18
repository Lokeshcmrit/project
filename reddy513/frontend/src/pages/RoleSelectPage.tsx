import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const roles = [
  {
    icon: '🚆',
    title: 'USER',
    subtitle: 'Loco Pilot',
    desc: 'View assigned train, route, block alerts and operational notifications.',
    cta: 'Continue as User',
    color: 'border-blue-600 hover:border-blue-400',
    badge: 'bg-blue-900/50 text-blue-300',
    route: '/login/user',
    role: 'USER_PILOT',
  },
  {
    icon: '🛡️',
    title: 'ADMIN',
    subtitle: 'Railway Operations Admin',
    desc: 'Manage maintenance requests, generate optimized block plans, monitor conflicts and approve schedules.',
    cta: 'Continue as Admin',
    color: 'border-yellow-600 hover:border-yellow-400',
    badge: 'bg-yellow-900/50 text-yellow-300',
    route: '/login/admin',
    role: 'ADMIN',
  },
  {
    icon: '🏢',
    title: 'DEPARTMENT',
    subtitle: 'Maintenance Department',
    desc: 'Submit maintenance requests, track requests and view approved blocks.',
    cta: 'Continue as Department',
    color: 'border-emerald-600 hover:border-emerald-400',
    badge: 'bg-emerald-900/50 text-emerald-300',
    route: '/login/department',
    role: 'DEPARTMENT',
  },
];

export default function RoleSelectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, go to correct dashboard
  React.useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') navigate('/dashboard/admin');
      else if (user.role === 'DEPARTMENT') navigate('/dashboard/department');
      else navigate('/dashboard/user');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#050b14] flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🚆</div>
        <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>RailSync AI</h1>
        <p className="text-slate-400 max-w-lg mx-auto text-sm">
          AI-Powered Automatic Block Planning System — South Central Railway<br />
          <span className="text-yellow-500 font-medium">Secunderabad Jn ↔ Visakhapatnam Jn Pilot Corridor</span>
        </p>
        <span className="inline-block mt-3 px-3 py-1 bg-yellow-900/30 border border-yellow-700/50 text-yellow-400 rounded text-xs font-bold uppercase tracking-wider">
          Smart India Hackathon 2024 — Prototype / Demo
        </span>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {roles.map(r => (
          <div
            key={r.role}
            onClick={() => navigate(r.route)}
            className={`glass-card border-2 ${r.color} p-7 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-2xl group`}
          >
            <div className="text-5xl mb-4">{r.icon}</div>
            <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-3 ${r.badge}`}>
              {r.title}
            </div>
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>{r.subtitle}</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">{r.desc}</p>
            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white border border-current opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ borderColor: 'currentColor' }}
            >
              {r.cta} →
            </button>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm text-slate-500">
        New to Railway Operations? <Link to="/register" className="text-blue-400 hover:text-blue-300">Register here</Link>
      </p>

      {/* Quick demo credentials */}
      <div className="mt-8 glass-card p-5 max-w-2xl w-full">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Demo Credentials</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            { label: '🛡️ Admin', id: 'admin@railsync.ir', pw: 'Admin@123' },
            { label: '🏢 Engineering', id: 'engg@railsync.ir', pw: 'Password@123' },
            { label: '⚡ TD', id: 'td@railsync.ir', pw: 'Password@123' },
            { label: '📡 S&T', id: 'sandt@railsync.ir', pw: 'Password@123' },
            { label: '🚆 Loco Pilot', id: 'pilot@railsync.ir', pw: 'Password@123' },
          ].map(c => (
            <div key={c.id} className="bg-[#0a192f] border border-[#1f3e72] rounded-lg p-2.5">
              <div className="font-semibold text-slate-300">{c.label}</div>
              <div className="text-slate-500 mt-0.5">{c.id}</div>
              <div className="text-slate-500">{c.pw}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

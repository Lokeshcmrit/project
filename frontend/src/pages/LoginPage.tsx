import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface Props {
  role: 'admin' | 'user' | 'department';
}

const roleConfig = {
  admin: {
    icon: '🛡️',
    label: 'Railway Operations Admin',
    color: 'text-yellow-400',
    borderColor: 'border-yellow-700/50',
    bg: 'bg-yellow-900/20',
    dashRoute: '/dashboard/admin',
    expectedRole: 'ADMIN',
  },
  user: {
    icon: '🚆',
    label: 'Loco Pilot',
    color: 'text-blue-400',
    borderColor: 'border-blue-700/50',
    bg: 'bg-blue-900/20',
    dashRoute: '/dashboard/user',
    expectedRole: 'USER_PILOT',
  },
  department: {
    icon: '🏢',
    label: 'Maintenance Department',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-700/50',
    bg: 'bg-emerald-900/20',
    dashRoute: '/dashboard/department',
    expectedRole: 'DEPARTMENT',
  },
};

export default function LoginPage({ role }: Props) {
  const config = roleConfig[role];
  const navigate = useNavigate();
  const { login, logout, user } = useAuth();

  // If already logged in with the matching role, redirect to their dashboard
  React.useEffect(() => {
    if (user && user.role === config.expectedRole) {
      navigate(config.dashRoute);
    }
  }, [user, config.expectedRole, config.dashRoute, navigate]);

  const [cred, setCred] = useState({ usernameOrEmployeeId: '', password: '', remember: false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [pendingToken, setPendingToken] = useState('');
  const [dept, setDept] = useState('ENGINEERING');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cred.usernameOrEmployeeId.trim()) {
      setError('Please enter your Employee ID or Email.');
      return;
    }

    if (!cred.password) {
      setError('Please enter your password.');
      return;
    }

    const DEMO_IDS = [
      'admin@railsync.ir',
      'engg@railsync.ir',
      'td@railsync.ir',
      'sandt@railsync.ir',
      'pilot@railsync.ir',
      'emp-adm-001',
      'emp-eng-101',
      'emp-td-201',
      'emp-snt-301',
      'emp-plt-501',
    ];

    if (DEMO_IDS.includes(cred.usernameOrEmployeeId.trim().toLowerCase())) {
      setError('Demo accounts are disabled. Please register your own personnel account to log in.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.login({
        usernameOrEmployeeId: cred.usernameOrEmployeeId.trim(),
        password: cred.password,
      });
      const { token, user: loggedUser } = res.data;

      // Role mismatch check: REJECT if credentials do not belong to this portal
      if (loggedUser.role !== config.expectedRole) {
        setError(
          `Invalid Portal: This account is registered as ${loggedUser.role.replace('_', ' ')}. Access to the ${config.label} portal is restricted to ${config.label} personnel only.`
        );
        setLoading(false);
        return;
      }

      // If DEPARTMENT but no department set, show department selector
      if (loggedUser.role === 'DEPARTMENT' && !loggedUser.department) {
        setPendingUser(loggedUser);
        setPendingToken(token);
        setShowDeptModal(true);
        setLoading(false);
        return;
      }

      login(token, loggedUser);
      navigate(config.dashRoute);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid Employee ID / Email or Password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDept = async () => {
    try {
      localStorage.setItem('railsync_token', pendingToken);
      const res = await authAPI.setDepartment(dept);
      login(res.data.token, res.data.user);
      navigate('/dashboard/department');
    } catch {
      login(pendingToken, { ...pendingUser, department: dept });
      navigate('/dashboard/department');
    }
  };

  const inputCls = 'w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';

  return (
    <div className="min-h-screen bg-[#050b14] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back */}
        <Link to="/select-role" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-8 transition-colors">
          ← Back to Role Selection
        </Link>

        {/* Card */}
        <div className={`glass-card border ${config.borderColor} p-8`}>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{config.icon}</div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{config.label}</h1>
            <p className="text-slate-400 text-sm mt-1">RailSync AI — Sign In</p>
          </div>


          {/* Active Session Notice if user is logged into another role */}
          {user && user.role !== config.expectedRole && (
            <div className="bg-blue-950/40 border border-blue-800/60 rounded-lg p-3 text-xs text-slate-300 mb-6 flex items-center justify-between">
              <div>
                <span className="text-slate-400">Currently active session: </span>
                <span className="font-semibold text-white">{user.fullName} ({user.role})</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="text-red-400 hover:text-red-300 font-semibold underline text-[11px]"
              >
                Clear
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm mb-6">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Registered Employee ID / Email
              </label>
              <input
                id="login-credential"
                className={inputCls}
                placeholder="EMP-001 or email@domain"
                value={cred.usernameOrEmployeeId}
                onChange={e => setCred(c => ({ ...c, usernameOrEmployeeId: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className={inputCls + ' pr-10'}
                  placeholder="Your secure password"
                  value={cred.password}
                  onChange={e => setCred(c => ({ ...c, password: e.target.value }))}
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded" checked={cred.remember} onChange={e => setCred(c => ({ ...c, remember: e.target.checked }))} />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="login-submit"
              className={`w-full py-3 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${config.bg} border ${config.borderColor} hover:brightness-125`}
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Authenticating…</> : `Sign In as ${config.label}`}
            </button>
          </form>

          {/* Dedicated Register Button */}
          <div className="mt-6 pt-5 border-t border-[#1f3e72] text-center">
            <p className="text-xs text-slate-400 mb-3">Don't have a registered account yet?</p>
            <Link
              to={`/register?role=${config.expectedRole}`}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500/50 transition-colors shadow-md"
            >
              Register New {config.label} Account →
            </Link>
          </div>
        </div>
      </div>

      {/* Department Selection Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card border border-[#1f3e72] p-8 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Select Your Department</h3>
            <p className="text-slate-400 text-sm mb-6">Your account doesn't have a department assigned. Please select one to continue.</p>
            <select
              className="w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-4 py-2.5 text-sm text-white mb-4 focus:outline-none focus:border-blue-500"
              value={dept}
              onChange={e => setDept(e.target.value)}
            >
              <option value="ENGINEERING">🔧 Engineering</option>
              <option value="TRACTION_DISTRIBUTION">⚡ Traction Distribution (OHE/TD)</option>
              <option value="SIGNAL_TELECOM">📡 Signal & Telecommunication (S&T)</option>
            </select>
            <button
              onClick={handleSetDept}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

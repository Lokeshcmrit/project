import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../api/client';
import { useAuth } from '../store/AuthContext';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    role: 'DEPARTMENT',
    department: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const payload: any = { ...form };
      delete payload.confirmPassword;
      if (!payload.department) delete payload.department;
      const res = await authAPI.register(payload);
      setSuccess(true);
      setTimeout(() => {
        login(res.data.token, res.data.user);
        const r = res.data.user.role;
        if (r === 'ADMIN') navigate('/dashboard/admin');
        else if (r === 'DEPARTMENT') navigate('/dashboard/department');
        else navigate('/dashboard/user');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-[#0a192f] border border-[#1f3e72] rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="min-h-screen bg-[#050b14] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#0a192f] border-r border-[#1f3e72] p-12">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <span className="text-4xl">🚆</span>
            <div>
              <div className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>RailSync AI</div>
              <div className="text-xs text-yellow-400 font-semibold tracking-widest uppercase">Smart India Hackathon 2024</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>Automatic Block Planning</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">AI-Powered system for coordinating maintenance blocks across Engineering, Traction Distribution, and Signal & Telecommunication departments on Indian Railways.</p>
          <div className="space-y-4">
            {[
              { icon: '🛡️', text: 'JWT-secured multi-role authentication' },
              { icon: '🤖', text: 'Real-time AI priority scoring & XAI explanations' },
              { icon: '📡', text: 'Live Socket.io updates across all departments' },
              { icon: '📊', text: 'Weekly Gantt & Monthly availability heatmaps' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="text-lg">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-600">Pilot Corridor: Secunderabad Jn ↔ Visakhapatnam Jn • South Central Railway</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Create Account</h2>
            <span className="px-2 py-1 bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 rounded text-[10px] font-bold uppercase tracking-wider">Prototype / Demo</span>
          </div>

          {success ? (
            <div className="text-center py-10">
              <CheckCircle2 size={56} className="text-green-400 mx-auto mb-4" />
              <p className="text-green-300 font-semibold text-lg">Registration Successful!</p>
              <p className="text-slate-400 text-sm mt-2">Redirecting to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input className={inputCls} placeholder="P. Venkat Reddy" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div>
                  <label className={labelCls}>Employee ID</label>
                  <input className={inputCls} placeholder="EMP-ENG-101" value={form.employeeId} onChange={e => set('employeeId', e.target.value)} required />
                </div>
              </div>

              <div>
                <label className={labelCls}>Email Address</label>
                <input type="email" className={inputCls} placeholder="you@railsync.ir" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>

              <div>
                <label className={labelCls}>Mobile Number</label>
                <input className={inputCls} placeholder="+91 98480 00000" value={form.mobileNumber} onChange={e => set('mobileNumber', e.target.value)} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Role</label>
                  <select className={inputCls} value={form.role} onChange={e => set('role', e.target.value)}>
                    <option value="DEPARTMENT">🏢 Department Staff</option>
                    <option value="USER_PILOT">🚆 Loco Pilot</option>
                    <option value="ADMIN">🛡️ Operations Admin</option>
                  </select>
                </div>
                {form.role === 'DEPARTMENT' && (
                  <div>
                    <label className={labelCls}>Department</label>
                    <select className={inputCls} value={form.department} onChange={e => set('department', e.target.value)}>
                      <option value="">Select Department</option>
                      <option value="ENGINEERING">Engineering</option>
                      <option value="TRACTION_DISTRIBUTION">Traction Distribution (TD)</option>
                      <option value="SIGNAL_TELECOM">Signal & Telecom (S&T)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={inputCls + ' pr-10'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3 text-slate-500 hover:text-slate-300">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>Confirm Password</label>
                <input type="password" className={inputCls} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Register for Railway Operations System'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Already registered? <Link to="/select-role" className="text-blue-400 hover:text-blue-300">Sign In here</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

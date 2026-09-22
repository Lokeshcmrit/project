import React, { useState } from 'react';
import { Radio, AlertTriangle, Send, X, ShieldAlert, Volume2, CheckCircle2, Loader2 } from 'lucide-react';
import { notificationsAPI } from '../api/client';
import { testAlarmSound } from '../utils/alarmSound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
  department?: string | null;
}

const PRESET_TEMPLATES = [
  {
    title: '🚨 Obstacle / Derailment Hazard on Track',
    message: 'Foreign obstruction reported on track section. Immediate speed reduction to 15 km/h. Loco pilots exercise caution.',
    severity: 'CRITICAL',
    sound: 'emergency',
  },
  {
    title: '⚡ 25kV OHE Power Trip / Traction Failure',
    message: 'Sub-station circuit breaker tripped. OHE neutral section isolated. Coasting protocol active between stations.',
    severity: 'HIGH',
    sound: 'alarm',
  },
  {
    title: '⚠️ Emergency Joint Block Possession Requested',
    message: 'Immediate track possession required for urgent ultrasonic flaw inspection and rail replacement.',
    severity: 'HIGH',
    sound: 'alarm',
  },
  {
    title: '🛑 Speed Restriction Caution Order Issued',
    message: 'Temporary speed restriction (30 km/h) active between stations due to heavy rainfall and ballast packing.',
    severity: 'MEDIUM',
    sound: 'warning',
  },
];

export default function BroadcastModal({ isOpen, onClose, userRole, department }: Props) {
  const [title, setTitle] = useState(PRESET_TEMPLATES[0].title);
  const [message, setMessage] = useState(PRESET_TEMPLATES[0].message);
  const [severity, setSeverity] = useState(PRESET_TEMPLATES[0].severity);
  const [sound, setSound] = useState(PRESET_TEMPLATES[0].sound);
  const [segmentLabel, setSegmentLabel] = useState('Secunderabad (SC) ↔ Kazipet (KZJ)');
  const [loading, setLoading] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (t: typeof PRESET_TEMPLATES[0]) => {
    setTitle(t.title);
    setMessage(t.message);
    setSeverity(t.severity);
    setSound(t.sound);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter an alert message.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await notificationsAPI.broadcastAlert({
        title,
        message,
        severity,
        sound,
        segmentLabel,
        details: `Broadcasted via Live Console by ${department ? `${department} Dept` : userRole || 'Operator'}`,
      });

      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to dispatch broadcast alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#091322] border border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.25)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
              <Radio size={18} className="animate-pulse" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Corridor Emergency Broadcast Dispatcher
              </h2>
              <p className="text-[11px] text-slate-400">
                Dispatches real-time pop-up + audio alarm to Admin, All Departments & Loco Pilots
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {sentSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              <span className="font-bold">Broadcast transmitted successfully across corridor network!</span>
            </div>
          )}

          {/* Quick Presets */}
          <div>
            <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
              Quick Incident Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_TEMPLATES.map((tmpl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(tmpl)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    title === tmpl.title
                      ? 'bg-red-900/30 border-red-500/60 text-white font-medium'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="font-bold truncate">{tmpl.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{tmpl.message}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Alert Headline</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Incident Directives / Message</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500 font-sans"
            />
          </div>

          {/* Section & Severity Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Affected Corridor Section</label>
              <input
                type="text"
                value={segmentLabel}
                onChange={(e) => setSegmentLabel(e.target.value)}
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Severity & Siren Profile</label>
              <div className="flex gap-2">
                <select
                  value={severity}
                  onChange={(e) => {
                    setSeverity(e.target.value);
                    if (e.target.value === 'CRITICAL') setSound('emergency');
                    else if (e.target.value === 'HIGH') setSound('alarm');
                    else setSound('warning');
                  }}
                  className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500 font-bold"
                >
                  <option value="CRITICAL">CRITICAL (Emergency Siren)</option>
                  <option value="HIGH">HIGH (Urgent Alarm Beeps)</option>
                  <option value="MEDIUM">MEDIUM (Warning Chime)</option>
                  <option value="LOW">LOW (Notice Chime)</option>
                </select>

                <button
                  type="button"
                  onClick={testAlarmSound}
                  title="Test Sound Tone"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Transmit Corridor Broadcast</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

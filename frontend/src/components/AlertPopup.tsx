import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Volume2,
  VolumeX,
  CheckCircle2,
  X,
  Radio,
  MapPin,
  Clock,
  ShieldAlert,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { stopAlarmSound, isAudioMuted, setAudioMuted, playAlarmSound } from '../utils/alarmSound';

export interface CorridorAlert {
  id: string;
  title: string;
  message: string;
  sourceRole: string;
  sourceDepartment?: string;
  targetAudience?: string;
  targetRoles?: string[];
  severity?: string;
  segmentLabel?: string;
  priorityScore?: number;
  details?: string;
  requestId?: string;
  sound?: 'alarm' | 'emergency' | 'warning' | 'chime';
  timestamp?: string;
}

interface Props {
  alert: CorridorAlert | null;
  onClose: () => void;
}

export default function AlertPopup({ alert, onClose }: Props) {
  const navigate = useNavigate();
  const [muted, setMuted] = useState(isAudioMuted());
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (!alert) return;

    // Start visual pulsing tick
    const interval = setInterval(() => {
      setPulseCount((c) => c + 1);
    }, 500);

    return () => {
      clearInterval(interval);
      stopAlarmSound();
    };
  }, [alert]);

  if (!alert) return null;

  const isEmergency = alert.severity === 'CRITICAL' || alert.sound === 'emergency';
  const isHigh = alert.severity === 'HIGH' || alert.sound === 'alarm';

  const handleAcknowledge = () => {
    stopAlarmSound();
    onClose();
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !muted;
    setMuted(nextMuted);
    setAudioMuted(nextMuted);
    if (nextMuted) {
      stopAlarmSound();
    } else {
      playAlarmSound(alert.sound || (isEmergency ? 'emergency' : 'alarm'));
    }
  };

  const getSourceDisplay = () => {
    if (alert.sourceDepartment) {
      const formatted = alert.sourceDepartment.replace('_', ' ');
      return `${formatted} Department`;
    }
    if (alert.sourceRole === 'ADMIN') return 'Operations Control Centre (OCC Admin)';
    if (alert.sourceRole === 'USER_PILOT') return 'Chief Loco Pilot (Train Cab)';
    return alert.sourceRole || 'Corridor Control';
  };

  const themeColors = isEmergency
    ? {
        border: 'border-red-500',
        glow: 'shadow-[0_0_50px_rgba(239,68,68,0.45)]',
        badge: 'bg-red-950/80 text-red-300 border-red-500/60',
        headerBg: 'bg-gradient-to-r from-red-950/90 via-red-900/60 to-red-950/90',
        btnAction: 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40',
        pingBg: 'bg-red-500',
      }
    : isHigh
    ? {
        border: 'border-amber-500',
        glow: 'shadow-[0_0_40px_rgba(245,158,11,0.35)]',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/60',
        headerBg: 'bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-amber-950/90',
        btnAction: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/40',
        pingBg: 'bg-amber-500',
      }
    : {
        border: 'border-blue-500',
        glow: 'shadow-[0_0_35px_rgba(59,130,246,0.3)]',
        badge: 'bg-blue-950/80 text-blue-300 border-blue-500/60',
        headerBg: 'bg-gradient-to-r from-blue-950/90 via-blue-900/60 to-blue-950/90',
        btnAction: 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40',
        pingBg: 'bg-blue-500',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl bg-[#091322] border-2 ${themeColors.border} ${themeColors.glow} rounded-2xl overflow-hidden transition-all transform scale-100`}
      >
        {/* Top Glowing Alert Banner */}
        <div className={`px-6 py-4 border-b border-slate-800 ${themeColors.headerBg} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${themeColors.pingBg} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-4 w-4 ${themeColors.pingBg}`} />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚨</span>
              <span className="font-bold text-sm tracking-wider uppercase text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Corridor Safety Alert System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Indicator / Toggle */}
            <button
              onClick={handleToggleMute}
              title={muted ? 'Alarm Sound Muted - Click to Unmute' : 'Alarm Sound Active - Click to Mute'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                muted
                  ? 'bg-slate-800/90 text-slate-400 border-slate-700 hover:text-white'
                  : 'bg-red-500/20 text-red-300 border-red-500/50 animate-pulse'
              }`}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} className="animate-bounce" />}
              <span>{muted ? 'Audio Muted' : 'Alarm Sounding'}</span>
            </button>

            {/* Quick close */}
            <button
              onClick={handleAcknowledge}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* From */}
            <div className="bg-[#0e1c31] border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Radio size={16} />
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Originating Source</div>
                <div className="font-bold text-slate-200 truncate">{getSourceDisplay()}</div>
              </div>
            </div>

            {/* Target Audience */}
            <div className="bg-[#0e1c31] border border-slate-700/60 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <ShieldAlert size={16} />
              </div>
              <div className="truncate">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Broadcast Network</div>
                <div className="font-bold text-amber-200 truncate">
                  Admin · All Departments · Loco Pilots
                </div>
              </div>
            </div>
          </div>

          {/* Affected Track Segment & Severity */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <MapPin size={15} className="text-red-400 flex-shrink-0" />
              <span>Corridor Section:</span>
              <span className="font-bold text-white font-mono">
                {alert.segmentLabel || 'Secunderabad ↔ Visakhapatnam Mainline'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {alert.severity && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${themeColors.badge}`}>
                  {alert.severity}
                </span>
              )}
              {alert.priorityScore !== undefined && alert.priorityScore > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/60 text-purple-300 border border-purple-500/40 font-mono">
                  Priority: {alert.priorityScore}/100
                </span>
              )}
            </div>
          </div>

          {/* Main Title & Alert Message */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              <span>{alert.title}</span>
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-[#0b172a] p-3.5 rounded-xl border border-slate-800/80 font-sans">
              {alert.message}
            </p>
            {alert.details && (
              <div className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800 italic">
                {alert.details}
              </div>
            )}
          </div>

          {/* Time & Warning note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-slate-500" />
              <span>
                Timestamp: {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>
            </div>
            <span className="text-amber-400/80 font-medium">Chief Controller Protocol Active</span>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleAcknowledge}
              className={`flex-1 w-full py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${themeColors.btnAction}`}
            >
              <CheckCircle2 size={18} />
              <span>Acknowledge & Silence Alarm</span>
            </button>

            <button
              onClick={() => {
                handleAcknowledge();
                navigate('/dashboard/admin/requests');
              }}
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>View in Queue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

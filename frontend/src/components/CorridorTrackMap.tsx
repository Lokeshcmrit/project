import React, { useEffect, useState } from 'react';
import { corridorAPI, trainsAPI } from '../api/client';
import { getSocket } from '../sockets/socket';
import {
  AlertTriangle,
  Train as TrainIcon,
  Wrench,
  Info,
  CheckCircle2,
  RefreshCw,
  X,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Layers
} from 'lucide-react';

export interface CorridorTrackMapProps {
  onSelectSegment?: (segment: any) => void;
  highlightSegmentId?: string;
  userRole?: 'ADMIN' | 'DEPARTMENT' | 'USER_PILOT';
  pilotCurrentSegmentId?: string;
  pilotTrainNumber?: string;
}

const statusTheme: Record<string, { bg: string; text: string; border: string; glow: string; label: string; icon: string }> = {
  NORMAL: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
    label: 'Normal Flow',
    icon: '🟢',
  },
  OCCUPIED: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    border: 'border-blue-500/40',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]',
    label: 'Train Occupied',
    icon: '🔵',
  },
  PLANNED_POSSESSION: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
    label: 'Planned Block',
    icon: '🟡',
  },
  DISRUPTED: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/50',
    glow: 'shadow-[0_0_20px_rgba(249,115,22,0.35)] animate-pulse',
    label: 'Disrupted',
    icon: '🟠',
  },
  CONFLICT: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/60',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.45)] animate-pulse',
    label: 'Critical Conflict',
    icon: '🔴',
  },
};

export default function CorridorTrackMap({
  onSelectSegment,
  highlightSegmentId,
  userRole = 'ADMIN',
  pilotCurrentSegmentId,
  pilotTrainNumber,
}: CorridorTrackMapProps) {
  const [segments, setSegments] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'DISRUPTED_CONFLICT' | 'POSSESSIONS'>('ALL');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [segRes, statRes, trainRes] = await Promise.all([
        corridorAPI.segments(),
        corridorAPI.stations(),
        trainsAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setSegments(segRes.data || []);
      setStations(statRes.data || []);
      setTrains(trainRes.data || []);

      if (selectedSegment) {
        const fresh = segRes.data?.find((s: any) => s.id === selectedSegment.id);
        if (fresh) setSelectedSegment(fresh);
      }
    } catch (err) {
      console.error('Error loading corridor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const socket = getSocket();
    const handleRefresh = () => loadData();
    socket.on('request:new', handleRefresh);
    socket.on('request:statusChanged', handleRefresh);
    return () => {
      socket.off('request:new', handleRefresh);
      socket.off('request:statusChanged', handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (highlightSegmentId && segments.length > 0) {
      const match = segments.find(s => s.id === highlightSegmentId);
      if (match) setSelectedSegment(match);
    }
  }, [highlightSegmentId, segments]);

  const handleSegmentClick = (segment: any) => {
    setSelectedSegment(segment);
    if (onSelectSegment) onSelectSegment(segment);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedSegment) return;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('railsync_token');
      await fetch(`http://localhost:4000/corridor/segments/${selectedSegment.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to update segment status:', err);
    } finally {
      setUpdatingStatus(false);
      await loadData();
    }
  };

  // Filtered segments
  const displayedSegments = segments.filter(seg => {
    if (filter === 'DISRUPTED_CONFLICT') {
      return seg.status === 'DISRUPTED' || seg.status === 'CONFLICT';
    }
    if (filter === 'POSSESSIONS') {
      return seg.status === 'PLANNED_POSSESSION' || seg.status === 'OCCUPIED';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-700/50 flex items-center justify-center text-blue-400">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide" style={{ fontFamily: 'Outfit' }}>
              Corridor Topology & Block Telemetry
            </h2>
            <p className="text-xs text-slate-400">
              South Central ↔ East Coast Mainline (Secunderabad – Visakhapatnam, 699 KM)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Filters */}
          <div className="flex items-center bg-[#0a192f] border border-[#1f3e72] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
            >
              All Sections ({segments.length})
            </button>
            <button
              onClick={() => setFilter('DISRUPTED_CONFLICT')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filter === 'DISRUPTED_CONFLICT' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
            >
              Disruptions & Conflicts
            </button>
            <button
              onClick={() => setFilter('POSSESSIONS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${filter === 'POSSESSIONS' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
            >
              Active Possessions
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-[#0a192f] border border-[#1f3e72] hover:border-blue-500/50 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Refresh corridor data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Corridor Visual Diagram Track */}
      <div className="glass-card p-6 overflow-x-auto">
        <div className="min-w-[980px] pb-4">
          {/* Track Layout Header Info */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-6 border-b border-[#1f3e72]/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-slate-200">LIVE SECTION STATUS</span>
              <span className="text-slate-500">|</span>
              <span>10 Key Stations · 9 Line Segments</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-blue-400 inline-block rounded" /> Double Line Track
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-amber-400 inline-block rounded" /> Single Line Bottleneck
              </span>
            </div>
          </div>

          {/* Linear Corridor Pipeline */}
          <div className="relative pt-8 pb-12">
            {/* Background Corridor Spine */}
            <div className="absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-slate-800 rounded z-0" />

            <div className="relative z-10 flex items-center justify-between gap-1 px-2">
              {displayedSegments.map((seg, idx) => {
                const theme = statusTheme[seg.status] || statusTheme.NORMAL;
                const isSelected = selectedSegment?.id === seg.id;
                const isPilotSegment = pilotCurrentSegmentId === seg.id;
                const trainsOnSeg = trains.filter(t => t.currentSegmentId === seg.id);
                const reqCount = seg.maintenanceRequests?.length || 0;

                return (
                  <React.Fragment key={seg.id}>
                    {/* Station Node (Left Station) */}
                    <div className="flex flex-col items-center flex-shrink-0 group cursor-pointer">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${seg.fromStation?.type === 'junction'
                          ? 'bg-blue-600/80 text-white ring-2 ring-blue-400/50 shadow-lg'
                          : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        title={`${seg.fromStation?.name} (${seg.fromStation?.code})`}
                      >
                        {seg.fromStation?.code || 'STN'}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-300 mt-2 max-w-[85px] text-center truncate group-hover:text-white transition-colors">
                        {seg.fromStation?.name}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                        {seg.fromStation?.type || 'Station'}
                      </span>
                    </div>

                    {/* Track Segment Connector Line */}
                    <div
                      onClick={() => handleSegmentClick(seg)}
                      className={`relative flex-1 min-w-[75px] mx-1 py-3 px-2 rounded-xl cursor-pointer border transition-all duration-200 group ${theme.bg
                        } ${theme.border} ${theme.glow} ${isSelected ? 'ring-2 ring-white scale-105 z-20 shadow-2xl' : 'hover:scale-[1.02]'
                        }`}
                    >
                      {/* Segment Dual/Single Rail Visual */}
                      <div className="space-y-1 my-1">
                        <div
                          className={`h-1 rounded-full transition-colors ${seg.isSingleLine ? 'bg-amber-400' : theme.text.replace('text-', 'bg-')
                            }`}
                        />
                        {!seg.isSingleLine && (
                          <div
                            className={`h-1 rounded-full opacity-60 transition-colors ${theme.text.replace(
                              'text-',
                              'bg-'
                            )}`}
                          />
                        )}
                      </div>

                      {/* Segment Badges */}
                      <div className="flex items-center justify-between mt-2 text-[10px] font-medium">
                        <span className="text-slate-400 font-mono">{seg.lengthKm} km</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${theme.text} bg-black/40`}>
                          {seg.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Overlays / Badges for Trains & Requests */}
                      <div className="mt-1 flex items-center justify-between gap-1 flex-wrap">
                        {trainsOnSeg.length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-700/60 text-blue-300 text-[10px] font-bold"
                            title={`Train on section: ${trainsOnSeg.map(t => `${t.number} ${t.name}`).join(', ')}`}
                          >
                            <TrainIcon size={10} />
                            {trainsOnSeg[0].number}
                          </span>
                        )}

                        {isPilotSegment && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-900 border border-indigo-500 text-indigo-200 text-[9px] font-bold animate-bounce">
                            🎯 YOUR TRAIN
                          </span>
                        )}

                        {reqCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-700/60 text-red-300 text-[10px] font-bold"
                            title={`${reqCount} Maintenance defect / block`}
                          >
                            <Wrench size={10} />
                            {reqCount}
                          </span>
                        )}

                        {seg.isSingleLine && (
                          <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/40">
                            Single Line
                          </span>
                        )}
                      </div>
                    </div>

                    {/* If last segment, append the final station node */}
                    {idx === displayedSegments.length - 1 && (
                      <div className="flex flex-col items-center flex-shrink-0 group cursor-pointer">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-blue-600/80 text-white ring-2 ring-blue-400/50 shadow-lg"
                          title={`${seg.toStation?.name} (${seg.toStation?.code})`}
                        >
                          {seg.toStation?.code || 'VSKP'}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 mt-2 max-w-[85px] text-center truncate group-hover:text-white transition-colors">
                          {seg.toStation?.name}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                          {seg.toStation?.type || 'Junction'}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-4 border-t border-[#1f3e72]/60 flex-wrap">
            {Object.entries(statusTheme).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span>{val.icon}</span>
                <span className="capitalize">{val.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-4">
              <span className="px-1.5 py-0.5 rounded bg-blue-900/50 border border-blue-700 text-blue-300 text-[10px]">
                <TrainIcon size={10} className="inline mr-1" /> Train Slot
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-red-900/50 border border-red-700 text-red-300 text-[10px]">
                <Wrench size={10} className="inline mr-1" /> Defect / Possession
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Segment Inspection Drawer / Modal */}
      {selectedSegment && (
        <div className="glass-card p-6 border-l-4 border-blue-500 relative animate-fadeIn">
          <button
            onClick={() => setSelectedSegment(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>
                  {selectedSegment.label}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${statusTheme[selectedSegment.status]?.text
                    } ${statusTheme[selectedSegment.status]?.bg} ${statusTheme[selectedSegment.status]?.border}`}
                >
                  {selectedSegment.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>Section Distance: <strong className="text-slate-200">{selectedSegment.lengthKm} KM</strong></span>
                <span>•</span>
                <span>
                  Track Geometry:{' '}
                  <strong className={selectedSegment.isSingleLine ? 'text-amber-400' : 'text-blue-400'}>
                    {selectedSegment.isSingleLine ? 'Single Line (Critical Bottleneck)' : 'Double Line (Bidirectional Signalling)'}
                  </strong>
                </span>
              </p>
            </div>

            {/* Admin Override Segment Status */}
            {userRole === 'ADMIN' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Override Status:</span>
                <select
                  value={selectedSegment.status}
                  disabled={updatingStatus}
                  onChange={e => handleStatusChange(e.target.value)}
                  className="bg-[#0a192f] border border-[#1f3e72] rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="PLANNED_POSSESSION">PLANNED POSSESSION</option>
                  <option value="DISRUPTED">DISRUPTED</option>
                  <option value="CONFLICT">CONFLICT</option>
                </select>
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Active Trains on Section */}
            <div className="bg-[#0a192f]/80 rounded-xl p-4 border border-[#1f3e72]">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <TrainIcon size={14} className="text-blue-400" /> Trains Operating on Section
              </h4>
              {trains.filter(t => t.currentSegmentId === selectedSegment.id).length === 0 ? (
                <p className="text-xs text-slate-500">No scheduled trains currently reported in this block.</p>
              ) : (
                <div className="space-y-2">
                  {trains
                    .filter(t => t.currentSegmentId === selectedSegment.id)
                    .map(t => (
                      <div key={t.id} className="flex items-center justify-between p-2.5 bg-blue-950/40 rounded-lg border border-blue-900/50 text-xs">
                        <div>
                          <p className="font-bold text-white">{t.number} — {t.name}</p>
                          <p className="text-slate-400 text-[11px]">
                            Status: <span className="text-slate-200 capitalize">{t.status.replace('_', ' ')}</span>
                          </p>
                        </div>
                        {t.delayMinutes > 0 ? (
                          <span className="text-amber-400 font-bold">+{t.delayMinutes} min delay</span>
                        ) : (
                          <span className="text-green-400 font-bold">On Time</span>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Maintenance Requests / Defect Alerts on Section */}
            <div className="bg-[#0a192f]/80 rounded-xl p-4 border border-[#1f3e72]">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wrench size={14} className="text-amber-400" /> Active Maintenance / Defect Requests
              </h4>
              {(!selectedSegment.maintenanceRequests || selectedSegment.maintenanceRequests.length === 0) ? (
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> No active track defects or pending block requests.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedSegment.maintenanceRequests.map((r: any) => (
                    <div key={r.id} className="p-2.5 bg-slate-900/80 rounded-lg border border-[#1f3e72] text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-white truncate max-w-[220px]">{r.title}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${r.severity === 'CRITICAL' ? 'bg-red-900/60 text-red-300' :
                          r.severity === 'HIGH' ? 'bg-orange-900/60 text-orange-300' : 'bg-amber-900/60 text-amber-300'
                          }`}>
                          {r.severity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px] mt-1.5">
                        <span>Dept: {r.reportingDepartment}</span>
                        <span className="text-blue-400 font-semibold">{r.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import {
  Navigation,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Mountain,
  Zap,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';
import { RoadStatus } from '../types';

export const RoadsPage: React.FC = () => {
  const { roadSegments, toggleRoadBlockage, setCameraFocus, navigate } = useHealthcareStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const openRoads = roadSegments.filter((r) => r.status === 'OPEN').length;
  const blockedRoads = roadSegments.filter((r) => r.status === 'BLOCKED_LANDSLIDE').length;
  const floodRoads = roadSegments.filter((r) => r.status === 'WARNING_FLOOD').length;

  const filteredRoads = roadSegments
    .filter((r) => {
      if (filterStatus === 'BLOCKED') return r.status === 'BLOCKED_LANDSLIDE';
      if (filterStatus === 'WARNING') return r.status === 'WARNING_FLOOD';
      if (filterStatus === 'OPEN') return r.status === 'OPEN';
      return true;
    })
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.surfaceType.toLowerCase().includes(q) || (r.blockedReason && r.blockedReason.toLowerCase().includes(q));
    });

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              Rural Road Network & Terrain Obstacles
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
              {roadSegments.length} TOPOLOGY EDGES
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Dynamic terrain routing mesh: Landslides, monsoon floods, and bridge closures instantly trigger A* shortest-path recalculation.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search road or obstacle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {['ALL', 'OPEN', 'BLOCKED', 'WARNING'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Network Health Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">CLEAR CORRIDORS</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{openRoads} Segments</div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">LANDSLIDE OBSTACLES</div>
            <div className="text-xl font-bold text-red-600 mt-0.5">{blockedRoads} Blocked</div>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center justify-between bg-white shadow-sm">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-bold">MONSOON FLOOD HAZARDS</div>
            <div className="text-xl font-bold text-amber-600 mt-0.5">{floodRoads} Caution</div>
          </div>
          <CloudRain className="w-8 h-8 text-amber-600" />
        </div>
      </div>

      {/* Road Segment Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRoads.map((road) => {
          const isBlocked = road.status === 'BLOCKED_LANDSLIDE';
          const isFlood = road.status === 'WARNING_FLOOD';

          return (
            <div
              key={road.id}
              className={`glass-panel p-5 rounded-2xl border transition-all space-y-4 bg-white hover:shadow-md ${
                isBlocked
                  ? 'border-red-300 ring-1 ring-red-300'
                  : isFlood
                  ? 'border-amber-300 ring-1 ring-amber-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header: Name & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-mono">{road.name}</h3>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Surface: {road.surfaceType} • Max Speed: {road.maxSpeedKmh} km/h
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                    isBlocked
                      ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                      : isFlood
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {road.status}
                </span>
              </div>

              {/* Specs: Distance, Slope, Resistance */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-700">
                <div>
                  <div className="text-slate-500 font-bold">LENGTH</div>
                  <div className="text-slate-900 font-bold mt-0.5">{road.lengthKm} KM</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold">GRADIENT</div>
                  <div className="text-slate-900 font-bold mt-0.5">{road.elevationSlopePercent || 8}%</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold">A* PENALTY</div>
                  <div className="text-blue-700 font-bold mt-0.5">
                    {isBlocked ? '∞ (AVOID)' : isFlood ? '2.5x Cost' : '1.0x Base'}
                  </div>
                </div>
              </div>

              {/* Obstacle Reason Warning */}
              {road.blockedReason && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-mono text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Hazard: {road.blockedReason}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
                <button
                  onClick={() => toggleRoadBlockage(road.id)}
                  className={`flex-1 py-2 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    isBlocked
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                  }`}
                >
                  {isBlocked ? '✓ Clear Landslide & Open Corridor' : '⚠ Mark Blocked by Landslide'}
                </button>

                <button
                  onClick={() => {
                    const midPos: [number, number, number] = [
                      (road.startPos[0] + road.endPos[0]) / 2,
                      (road.startPos[1] + road.endPos[1]) / 2,
                      (road.startPos[2] + road.endPos[2]) / 2,
                    ];
                    setCameraFocus(midPos, midPos, 14);
                    navigate('dashboard');
                  }}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 transition-colors cursor-pointer"
                  title="Locate Segment on 3D Map"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

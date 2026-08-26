import React, { useState } from 'react';
import {
  Flame,
  Search,
  Filter,
  ArrowRight,
  Clock,
  MapPin,
  Stethoscope,
  Truck,
  Building2,
  Sparkles,
  PhoneCall,
  ChevronRight,
  Plane,
  AlertTriangle,
  Cpu,
  Zap,
  Activity,
  Layers,
  Database,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { Emergency, SeverityLevel } from '../../types';

export const RightIntelligencePanel: React.FC = () => {
  const [panelTab, setPanelTab] = useState<'QUEUE' | 'TELEMETRY'>('QUEUE');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    emergencies,
    ambulances,
    hospitals,
    openDispatchModal,
    selectEntity,
    setCameraFocus,
    navigate,
    startTelemedicineSession,
    doctors,
    priorityQueueList,
    metrics,
    selectedRoutingAlgorithm,
    setRoutingAlgorithm,
    graphVersion,
    routeCacheStats,
  } = useHealthcareStore();

  // Use priority queue sorted list for default display
  const displayQueue = priorityQueueList.length > 0 ? priorityQueueList : emergencies;

  const filteredEmergencies = displayQueue
    .filter((e) => e.status !== 'RESOLVED' && e.status !== 'COMPLETED')
    .filter((e) => {
      if (filterSeverity === 'ALL') return true;
      return e.severity === filterSeverity;
    })
    .filter((e) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.patientName.toLowerCase().includes(q) ||
        e.condition.toLowerCase().includes(q) ||
        e.villageName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-950/80 text-red-300 border-red-500/50 shadow-sm shadow-red-500/20';
      case 'High':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/50';
      case 'Medium':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/50';
      case 'Low':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50';
    }
  };

  return (
    <aside className="w-96 bg-white/95 backdrop-blur-md border-l border-slate-200 flex flex-col justify-between z-20 select-none shadow-sm">
      {/* Tab Header */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-slate-200 text-xs font-mono">
          <button
            onClick={() => setPanelTab('QUEUE')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              panelTab === 'QUEUE'
                ? 'bg-red-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Priority Queue ({filteredEmergencies.length})</span>
          </button>
          <button
            onClick={() => setPanelTab('TELEMETRY')}
            className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
              panelTab === 'TELEMETRY'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Engine Telemetry</span>
          </button>
        </div>
      </div>

      {panelTab === 'QUEUE' ? (
        <>
          {/* Header & Search */}
          <div className="p-3 border-b border-slate-200 space-y-2.5 bg-white">
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search triage priority queue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {/* Severity Filters */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              {['ALL', 'Critical', 'High', 'Medium'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`flex-1 py-1 rounded-lg border transition-all ${
                    filterSeverity === sev
                      ? sev === 'Critical'
                        ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                        : sev === 'High'
                        ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold'
                        : 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Cards Stream */}
          <div className="flex-1 p-3 space-y-2.5 overflow-y-auto pr-2 bg-slate-50/50">
            {filteredEmergencies.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-mono text-xs">
                No active emergencies in queue.
              </div>
            ) : (
              filteredEmergencies.map((emg, idx) => {
                const assignedAmb = ambulances.find((a) => a.id === emg.assignedAmbulanceId);
                const targetHosp = hospitals.find((h) => h.id === emg.targetHospitalId);

                return (
                  <div
                    key={emg.id}
                    onClick={() => {
                      selectEntity('EMERGENCY', emg.id, emg);
                      setCameraFocus(emg.position, emg.position, 14);
                    }}
                    className={`p-3 rounded-xl transition-all cursor-pointer border ${
                      emg.severity === 'Critical'
                        ? 'bg-white border-red-200 shadow-sm hover:border-red-400'
                        : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
                    }`}
                  >
                    {/* Top Row: Priority Rank, ID, Severity, Reported Time */}
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center border border-slate-200">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-blue-600 font-bold">{emg.id}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                            emg.severity === 'Critical'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : emg.severity === 'High'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }`}
                        >
                          {emg.severity}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {emg.reportedAt}
                      </span>
                    </div>

                    {/* Patient Name & Condition */}
                    <div className="mb-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                        <span>
                          {emg.patientName}{' '}
                          <span className="text-slate-500 text-[10px] font-normal">
                            ({emg.patientAge}y, {emg.patientGender})
                          </span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 font-bold">
                          {emg.etaMinutes}m ETA
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mt-0.5 font-sans">
                        {emg.condition}
                      </p>
                    </div>

                    {/* Location & Routing Info Badges */}
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-200 mb-2.5">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="truncate">{emg.villageName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Stethoscope className="w-3 h-3 text-purple-600 shrink-0" />
                        <span className="truncate">{emg.requiredSpecialist.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Truck className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">
                          {assignedAmb ? assignedAmb.callsign.split(' ')[0] : 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {targetHosp ? targetHosp.shortName : 'Trauma Center'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      {emg.status === 'PENDING_TRIAGE' || emg.status === 'QUEUED' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDispatchModal(emg);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] font-mono tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Zap className="w-3 h-3" /> INTELLIGENT DISPATCH
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('emergencies', emg.id);
                          }}
                          className="flex-1 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
                        >
                          TELEMETRY DETAIL <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Tele-Consult Quick Trigger */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const availableDoc = doctors.find((d) => d.status === 'Available') || doctors[0];
                          if (availableDoc) startTelemedicineSession(availableDoc.id, emg.id);
                          navigate('emergencies', emg.id);
                        }}
                        title="Initiate Emergency Tele-Consultation with On-Call Specialist"
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 border border-slate-200 hover:border-purple-300 transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Telemetry & Algorithmic Engine Stats Tab */
        <div className="flex-1 p-4 space-y-4 overflow-y-auto font-mono text-xs bg-slate-50/50">
          {/* Active Engine Switcher */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="text-[10px] text-slate-500 uppercase font-bold flex items-center justify-between">
              <span>Active Pathfinding Algorithm</span>
              <span className="text-blue-600">Graph v{graphVersion}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRoutingAlgorithm('A_STAR')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedRoutingAlgorithm === 'A_STAR'
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="text-blue-700 font-bold">A* Heuristic</div>
                <div className="text-[9px] text-slate-500 mt-0.5">3.8ms • 28 nodes</div>
              </button>
              <button
                onClick={() => setRoutingAlgorithm('DIJKSTRA')}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedRoutingAlgorithm === 'DIJKSTRA'
                    ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="text-purple-700 font-bold">Dijkstra Uniform</div>
                <div className="text-[9px] text-slate-500 mt-0.5">14.2ms • 142 nodes</div>
              </button>
            </div>
          </div>

          {/* Engine Real-time Metrics Grid */}
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase font-bold">
              Computational Performance
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[9px] text-slate-400 block uppercase">A* Compute Time</span>
                <span className="text-sm font-bold text-blue-600">{metrics.aStarComputeTimeMs} ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[9px] text-slate-400 block uppercase">Dijkstra Time</span>
                <span className="text-sm font-bold text-purple-600">{metrics.dijkstraComputeTimeMs} ms</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[9px] text-slate-400 block uppercase">Route Cache Hit Rate</span>
                <span className="text-sm font-bold text-emerald-600">{metrics.routeCacheHitRate}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[9px] text-slate-400 block uppercase">Dynamic Reroutes</span>
                <span className="text-sm font-bold text-amber-600">{metrics.routeRecalculationCount}</span>
              </div>
            </div>
          </div>

          {/* Route Cache Detail */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-700 font-bold">In-Memory Route Cache:</span>
              <span className="text-emerald-600">{routeCacheStats.cacheSize || 0} cached paths</span>
            </div>
            <div className="text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Cache Hits:</span>
                <span className="text-slate-900 font-bold">{routeCacheStats.hits}</span>
              </div>
              <div className="flex justify-between">
                <span>Cache Misses:</span>
                <span className="text-slate-900 font-bold">{routeCacheStats.misses}</span>
              </div>
              <div className="flex justify-between">
                <span>Graph Invalidation Version:</span>
                <span className="text-blue-600 font-bold">v{routeCacheStats.graphVersion}</span>
              </div>
            </div>
          </div>

          {/* Priority Queue Heap Telemetry */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-700 font-bold">Binary Heap Priority Queue:</span>
              <span className="text-red-600 font-bold">{metrics.priorityQueueSize} Items</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              O(log n) min-heap prioritizing Critical Urgency, lowest SLA remaining, and longest wait time.
            </p>
          </div>
        </div>
      )}

      {/* Footer Quick Action */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs font-mono">
        <span className="text-slate-500">Total Emergencies: {emergencies.length}</span>
        <button
          onClick={() => navigate('emergencies')}
          className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
        >
          View Console <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};

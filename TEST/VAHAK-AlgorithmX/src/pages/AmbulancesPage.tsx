import React, { useState } from 'react';
import {
  Truck,
  Plane,
  Battery,
  Fuel,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Shield,
  Activity,
  Plus,
  Navigation,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';

export const AmbulancesPage: React.FC = () => {
  const { ambulances, emergencies, setCameraFocus, navigate } = useHealthcareStore();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAmbId, setSelectedAmbId] = useState<string | null>(null);

  const filteredAmbulances = ambulances
    .filter((a) => {
      if (filterType === 'ALS') return a.type.includes('ALS') || a.type.includes('Advanced');
      if (filterType === '4X4') return a.type.includes('4x4') || a.type.includes('Terrain');
      if (filterType === 'BLS') return a.type.includes('BLS') || a.type.includes('Basic');
      return true;
    })
    .filter((a) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.callsign.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.paramedicLead.toLowerCase().includes(q) ||
        (a.driverName && a.driverName.toLowerCase().includes(q))
      );
    });

  const handleRefuel = (ambId: string) => {
    useHealthcareStore.setState({
      ambulances: ambulances.map((a) =>
        a.id === ambId ? { ...a, fuelPercent: Math.min(100, a.fuelPercent + 25) } : a
      ),
    });
  };

  const handleToggleStatus = (ambId: string, newStatus: any) => {
    useHealthcareStore.setState({
      ambulances: ambulances.map((a) =>
        a.id === ambId ? { ...a, status: newStatus } : a
      ),
    });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              Emergency Ground Fleet & ALS Units
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
              {ambulances.length} UNITS IN ACTIVE FLEET
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Real-time telemetry and management of Advanced Life Support (ALS), 4x4 All-Terrain Trauma, and Basic Life Support (BLS) ambulances.
          </p>
        </div>

        {/* Search & Filter Pills */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search callsign, driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Ground Units ({ambulances.length})
            </button>
            <button
              onClick={() => setFilterType('ALS')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterType === 'ALS'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              ALS Units
            </button>
            <button
              onClick={() => setFilterType('4X4')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterType === '4X4'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              4x4 All-Terrain
            </button>
            <button
              onClick={() => setFilterType('BLS')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterType === 'BLS'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              BLS Units
            </button>
          </div>
        </div>
      </div>

      {/* Ambulance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAmbulances.map((amb) => {
          const isDrone = amb.type.includes('Drone');
          const isEnRoute =
            amb.status === 'Dispatched En Route' || amb.status === 'Transporting to Hospital';
          const assignedEmg = emergencies.find((e) => e.id === amb.assignedEmergencyId);

          return (
            <div
              key={amb.id}
              className={`glass-panel p-5 rounded-2xl border transition-all hover:shadow-md bg-white space-y-4 ${
                isEnRoute
                  ? 'border-blue-400 ring-1 ring-blue-400 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Row: Callsign & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isDrone
                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    {isDrone ? <Plane className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-mono">{amb.callsign}</h3>
                    <div className="text-[10px] text-slate-500 font-mono">{amb.type}</div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                    amb.status === 'Idle / Ready'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : amb.status === 'Dispatched En Route'
                      ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }`}
                >
                  {amb.status}
                </span>
              </div>

              {/* Specs & Hardware */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[10px]">
                <div>
                  <div className="text-slate-500 flex items-center gap-1">
                    {isDrone ? <Battery className="w-3 h-3 text-purple-600" /> : <Fuel className="w-3 h-3 text-blue-600" />}
                    <span>{isDrone ? 'BATTERY' : 'FUEL'}</span>
                  </div>
                  <div className="text-slate-900 font-bold mt-0.5">{amb.fuelPercent}%</div>
                </div>

                <div>
                  <div className="text-slate-500">SPEED</div>
                  <div className="text-slate-900 font-bold mt-0.5">{amb.speedKmh} km/h</div>
                </div>

                <div>
                  <div className="text-slate-500">PARAMEDIC</div>
                  <div className="text-slate-900 font-bold mt-0.5 truncate">{amb.paramedicLead.split(' ')[0]}</div>
                </div>
              </div>

              {/* Assigned Mission Banner if active */}
              {assignedEmg ? (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-mono space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-red-700 font-bold">
                    <span>ACTIVE MISSION: {assignedEmg.id}</span>
                    <span>{amb.estimatedArrivalMinutes}m ETA</span>
                  </div>
                  <div className="text-slate-900 font-sans font-semibold text-[11px]">
                    {assignedEmg.patientName} ({assignedEmg.villageName})
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Stationed at base • Available for dispatch</span>
                </div>
              )}

              {/* Equipment Inventory */}
              <div className="text-[10px] text-slate-500 font-mono">
                <div className="text-slate-500 uppercase text-[9px] mb-1 font-bold">Equipment on Board:</div>
                <div className="flex flex-wrap gap-1">
                  {(amb.equipment || ['ALS Defibrillator', 'Cold-Chain Kit', 'Oxygen Tank']).map((eq, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactive Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleRefuel(amb.id)}
                  className="py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isDrone ? 'Recharge +25%' : 'Refuel +25%'}</span>
                </button>

                <button
                  onClick={() => {
                    handleToggleStatus(amb.id, amb.status === 'Idle / Ready' ? 'Maintenance Standby' : 'Idle / Ready');
                  }}
                  className="py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                  <span>{amb.status === 'Idle / Ready' ? 'Set Standby' : 'Set Ready'}</span>
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  setCameraFocus(amb.position, amb.position, 12);
                  navigate('dashboard');
                }}
                className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Track in 3D Map</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

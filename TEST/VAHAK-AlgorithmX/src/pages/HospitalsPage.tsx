import React, { useState } from 'react';
import {
  Building2,
  Bed,
  Activity,
  Heart,
  Wind,
  ShieldCheck,
  Plane,
  Phone,
  MapPin,
  Navigation,
  Plus,
  Minus,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';

export const HospitalsPage: React.FC = () => {
  const { hospitals, setCameraFocus, navigate } = useHealthcareStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrauma, setFilterTrauma] = useState<string>('ALL');

  const filteredHospitals = hospitals
    .filter((h) => {
      if (filterTrauma === 'LEVEL_1') return h.traumaLevel.includes('Level I');
      if (filterTrauma === 'SURGE') return h.emergencyLoad === 'Critical' || h.emergencyLoad === 'Surge Capacity';
      return true;
    })
    .filter((h) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return h.name.toLowerCase().includes(q) || h.shortName.toLowerCase().includes(q) || h.traumaLevel.toLowerCase().includes(q);
    });

  const handleAdjustBed = (hospId: string, delta: number) => {
    useHealthcareStore.setState({
      hospitals: hospitals.map((h) =>
        h.id === hospId
          ? {
              ...h,
              availableBeds: Math.max(0, Math.min(h.totalBeds, h.availableBeds + delta)),
              occupied_beds: Math.max(0, Math.min(h.totalBeds, h.occupied_beds - delta)),
            }
          : h
      ),
    });
  };

  const handleRestockOxygen = (hospId: string) => {
    useHealthcareStore.setState({
      hospitals: hospitals.map((h) =>
        h.id === hospId ? { ...h, oxygenReservesHours: Math.min(120, h.oxygenReservesHours + 24) } : h
      ),
    });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              Hospital Network & Trauma Centers
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
              {hospitals.length} FACILITIES REGISTERED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Real-time telemetry for ICU bed capacity, operating theater readiness, oxygen banks, and specialist rosters.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospital or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setFilterTrauma('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterTrauma === 'ALL'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({hospitals.length})
            </button>
            <button
              onClick={() => setFilterTrauma('LEVEL_1')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterTrauma === 'LEVEL_1'
                  ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Level I Trauma
            </button>
            <button
              onClick={() => setFilterTrauma('SURGE')}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                filterTrauma === 'SURGE'
                  ? 'bg-red-600 border-red-600 text-white font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Surge Capacity
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredHospitals.map((hosp) => {
          const bedPercent = Math.round(((hosp.totalBeds - hosp.availableBeds) / hosp.totalBeds) * 100);
          const icuPercent = Math.round(((hosp.icuTotal - hosp.icuAvailable) / hosp.icuTotal) * 100);
          const isCriticalLoad = hosp.emergencyLoad === 'Critical' || hosp.emergencyLoad === 'Surge Capacity';

          return (
            <div
              key={hosp.id}
              className="glass-panel p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all space-y-4 bg-white"
            >
              {/* Header: Name, Trauma Level, Load */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{hosp.name}</h3>
                    <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <span className="text-blue-600 font-semibold">{hosp.traumaLevel}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3" /> LAT: {hosp.position[0]}, LON: {hosp.position[2]}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${
                    isCriticalLoad
                      ? 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {hosp.emergencyLoad}
                </span>
              </div>

              {/* Capacity Meters */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs">
                {/* General Beds */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Bed className="w-3.5 h-3.5 text-blue-600" /> General Beds
                    </span>
                    <span className="text-slate-900 font-bold">
                      {hosp.availableBeds} <span className="text-slate-400 text-[10px]">/ {hosp.totalBeds} avail</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        bedPercent > 85 ? 'bg-red-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${bedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleAdjustBed(hosp.id, -1)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] cursor-pointer"
                    >
                      -1 Reserve
                    </button>
                    <button
                      onClick={() => handleAdjustBed(hosp.id, 1)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[10px] cursor-pointer"
                    >
                      +1 Free
                    </button>
                  </div>
                </div>

                {/* ICU Beds */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-600" /> ICU Capacity
                    </span>
                    <span className="text-slate-900 font-bold">
                      {hosp.icuAvailable} <span className="text-slate-400 text-[10px]">/ {hosp.icuTotal} avail</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        icuPercent > 85 ? 'bg-red-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${icuPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                    <span>Ventilators: {hosp.ventilatorsAvailable || 4}</span>
                    <span>{icuPercent}% Occupied</span>
                  </div>
                </div>
              </div>

              {/* Logistics: Oxygen, Helipad, Phone */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-blue-600" />
                    <span>O2: <strong>{hosp.oxygenReservesHours}h</strong></span>
                  </div>
                  <button
                    onClick={() => handleRestockOxygen(hosp.id)}
                    className="text-blue-600 hover:underline cursor-pointer"
                  >
                    +24h
                  </button>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-purple-600" />
                  <span>Helipad: <strong>{hosp.helipadReady ? 'ACTIVE' : 'N/A'}</strong></span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{hosp.contactNumber.slice(0, 10)}</span>
                </div>
              </div>

              {/* Specialties Tag Cloud */}
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  Trauma & Medical Specialties:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(hosp.specialists || hosp.specialties || []).map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => {
                  setCameraFocus(hosp.position, hosp.position, 14);
                  navigate('dashboard');
                }}
                className="w-full py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Inspect Facility in 3D Map</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

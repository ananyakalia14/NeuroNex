import React, { useState } from 'react';
import {
  Pill,
  Plane,
  Thermometer,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Building2,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';

export const MedicinesPage: React.FC = () => {
  const {
    medicines,
    pharmacies,
    villages,
    emergencies,
    requestDroneMedicineDelivery,
    updateMedicineStock,
    navigate,
  } = useHealthcareStore();

  const [selectedVillageId, setSelectedVillageId] = useState<string>(villages[0]?.id || 'vil-01');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const categories = ['ALL', ...Array.from(new Set(medicines.map((m) => m.category)))];

  const filteredMedicines = medicines
    .filter((m) => {
      if (filterCategory !== 'ALL' && m.category !== filterCategory) return false;
      return true;
    })
    .filter((m) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q) || m.lotNumber.toLowerCase().includes(q);
    });

  const handleLaunchDrone = (medId: string) => {
    const targetVillage = villages.find((v) => v.id === selectedVillageId) || villages[0];
    const relatedEmg = emergencies.find((e) => e.villageId === targetVillage.id);

    requestDroneMedicineDelivery(medId, targetVillage.position, relatedEmg?.id);
    setSuccessToast(`eVTOL Drone launched with payload to ${targetVillage.name}!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleRestock = (medId: string) => {
    const targetMed = medicines.find((m) => m.id === medId);
    if (targetMed) {
      updateMedicineStock(medId, targetMed.currentStock + 50);
      setSuccessToast(`Restocked +50 units of ${targetMed.name}`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              Emergency Pharmacy & Drone Logistics Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold">
              COLD-CHAIN VERIFIED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Autonomous eVTOL drone delivery of critical antivenoms, whole blood units, and anti-hemorrhage vials to isolated rural clinics.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-sm"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-mono shadow-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cold Chain Status Summary Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center gap-3 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Thermometer className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">COLD STORAGE TEMP</div>
            <div className="text-base font-bold text-slate-900 font-mono">3.8°C (Optimal 2-8°C)</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center gap-3 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">AIRDROP DRONES</div>
            <div className="text-base font-bold text-slate-900 font-mono">03 eVTOL Ready</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center gap-3 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">CRITICAL SERUMS</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {medicines.filter((m) => m.criticality === 'Critical').length} Vital Lines
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center gap-3 bg-white shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase font-bold">DEPOT HUBS</div>
            <div className="text-base font-bold text-slate-900 font-mono">
              {pharmacies.length} Regional Depots
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMedicines.map((med) => {
          const threshold = med.minThreshold || med.minimumThreshold || 10;
          const isLowStock = med.currentStock <= threshold;
          const stockPercent = Math.min(100, Math.round((med.currentStock / (threshold * 2)) * 100));

          return (
            <div
              key={med.id}
              className={`glass-panel p-5 rounded-2xl border transition-all space-y-3.5 bg-white hover:shadow-md ${
                isLowStock
                  ? 'border-amber-300 ring-1 ring-amber-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header: Name, Category, Stock Pill */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                  <div className="text-xs text-slate-500 font-mono">{med.category}</div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                    med.urgentDroneDeliveryRequired || med.criticality === 'Critical'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {med.urgentDroneDeliveryRequired ? 'CRITICAL DRONE' : med.criticality || 'Essential'}
                </span>
              </div>

              {/* Stock Level Progress */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600">Available In Stock:</span>
                  <span className={`font-bold ${isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {med.currentStock} {med.unit}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                  <span>Minimum Threshold: {threshold} {med.unit}</span>
                  <span>Lot: {med.lotNumber}</span>
                </div>
              </div>

              {/* Specs: Cold Chain & Expiry */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-bold">COLD CHAIN</div>
                  <div className="text-blue-700 font-bold mt-0.5">{med.storageTempCelsius || med.coldChainRequirement || '2°C - 8°C'}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-bold">EXPIRY DATE</div>
                  <div className="text-slate-900 font-bold mt-0.5">{med.expiryDate}</div>
                </div>
              </div>

              {/* Restock & Drone Airdrop Launch Action */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleRestock(med.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" /> Restock +50
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono">Target Destination:</span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedVillageId}
                    onChange={(e) => setSelectedVillageId(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-800"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleLaunchDrone(med.id)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plane className="w-3.5 h-3.5" />
                    <span>Launch eVTOL</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

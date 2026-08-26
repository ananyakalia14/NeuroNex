import React, { useState } from 'react';
import {
  Flame,
  Search,
  Filter,
  Clock,
  MapPin,
  Stethoscope,
  Truck,
  Building2,
  PhoneCall,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Plane,
  Heart,
  Activity,
  ArrowRight,
  User,
  Plus,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';
import { Emergency, SeverityLevel } from '../types';

export const EmergenciesPage: React.FC = () => {
  const {
    emergencies,
    ambulances,
    hospitals,
    doctors,
    openDispatchModal,
    updateEmergencyStatus,
    startTelemedicineSession,
    navigate,
    routeParamId,
    setCameraFocus,
  } = useHealthcareStore();

  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeEmergencyId, setActiveEmergencyId] = useState<string>(
    routeParamId || emergencies[0]?.id || ''
  );
  const [clinicalNoteInput, setClinicalNoteInput] = useState('');

  const filteredEmergencies = emergencies.filter((e) => {
    if (selectedSeverity !== 'ALL' && e.severity !== selectedSeverity) return false;
    if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        e.patientName.toLowerCase().includes(q) ||
        e.condition.toLowerCase().includes(q) ||
        e.villageName.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeEmergency =
    emergencies.find((e) => e.id === activeEmergencyId) || filteredEmergencies[0] || emergencies[0];
  const assignedAmb = ambulances.find((a) => a.id === activeEmergency?.assignedAmbulanceId);
  const targetHosp = hospitals.find((h) => h.id === activeEmergency?.targetHospitalId);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalNoteInput.trim() || !activeEmergency) return;
    const updatedNotes = [...(activeEmergency.notes || []), `[${new Date().toLocaleTimeString()}] ${clinicalNoteInput.trim()}`];
    useHealthcareStore.setState({
      emergencies: emergencies.map((emg) =>
        emg.id === activeEmergency.id ? { ...emg, notes: updatedNotes } : emg
      ),
    });
    setClinicalNoteInput('');
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-50 select-none">
      {/* Left List Column */}
      <div className="w-96 border-r border-slate-200 bg-white flex flex-col justify-between shadow-sm">
        {/* Header & Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <h1 className="text-sm font-bold text-slate-900 font-mono uppercase tracking-wider">
                Emergency Incidents
              </h1>
            </div>
            <button
              onClick={() => useHealthcareStore.setState({ createEmergencyModalOpen: true })}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Log SOS
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, village, condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`flex-1 py-1 rounded-lg border transition-all cursor-pointer ${
                  selectedSeverity === sev
                    ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto pr-2 bg-slate-50/50">
          {filteredEmergencies.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              No matching emergencies found.
            </div>
          ) : (
            filteredEmergencies.map((emg) => {
              const isSelected = activeEmergency?.id === emg.id;
              return (
                <div
                  key={emg.id}
                  onClick={() => setActiveEmergencyId(emg.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-blue-400 text-slate-900 shadow-md ring-1 ring-blue-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-blue-600 font-bold">{emg.id}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${
                        emg.severity === 'Critical'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : emg.severity === 'High'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {emg.severity}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900">{emg.patientName}</div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{emg.condition}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 border-t border-slate-100 pt-1.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {emg.villageName}
                    </span>
                    <span className="text-blue-600 font-bold">{emg.status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detailed Incident Console */}
      {activeEmergency ? (
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50">
          {/* Header Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
                <Flame className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {activeEmergency.patientName}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 font-mono text-xs font-bold">
                    {activeEmergency.severity} URGENCY
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold">
                    STATUS: {activeEmergency.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Incident ID: {activeEmergency.id} • Reported at {activeEmergency.reportedAt} • Location:{' '}
                  {activeEmergency.villageName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCameraFocus(activeEmergency.position, activeEmergency.position, 14);
                  navigate('dashboard');
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <MapPin className="w-4 h-4 text-blue-600" /> Switch to 3D Map
              </button>

              {activeEmergency.status === 'PENDING_TRIAGE' || activeEmergency.status === 'QUEUED' ? (
                <button
                  onClick={() => openDispatchModal(activeEmergency)}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-md shadow-red-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> DISPATCH UNIT
                </button>
              ) : (
                <button
                  onClick={() => updateEmergencyStatus(activeEmergency.id, 'RESOLVED')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                </button>
              )}
            </div>
          </div>

          {/* 3 Columns: Patient Vitals, Assigned Logistics, Telemedicine Uplink */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Patient Vitals & Clinical Data */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
              <div className="text-xs font-mono text-slate-900 font-bold uppercase tracking-wider flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Live Vitals & Symptoms</span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">HEART RATE</div>
                  <div className="text-base font-bold text-red-600 mt-1">
                    {activeEmergency.vitals?.heartRate || 105}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">BPM</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">BLOOD PRESS.</div>
                  <div className="text-base font-bold text-amber-600 mt-1">
                    {activeEmergency.vitals?.bloodPressure || '135/90'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 uppercase">SPO2</div>
                  <div className="text-base font-bold text-emerald-600 mt-1">
                    {activeEmergency.vitals?.spO2 || 94}%
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-sans">
                <div className="font-bold text-slate-900">Reported Clinical Condition:</div>
                <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-700">
                  {activeEmergency.condition}
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5 font-mono pt-2 border-t border-slate-100">
                <div>
                  Required Specialist:{' '}
                  <strong className="text-purple-700">{activeEmergency.requiredSpecialist}</strong>
                </div>
                <div>
                  Required Medicine:{' '}
                  <strong className="text-emerald-700">{activeEmergency.requiredMedicine || 'None'}</strong>
                </div>
                <div>
                  Caller Contact: <strong className="text-slate-900">{activeEmergency.callerPhone}</strong>
                </div>
              </div>
            </div>

            {/* Assigned Logistics & Dispatch State */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
              <div className="text-xs font-mono text-slate-900 font-bold uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Assigned Unit & Target Facility</span>
              </div>

              {assignedAmb ? (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-blue-900">{assignedAmb.callsign}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600 text-white font-bold">
                      {assignedAmb.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                    <div>Status: <strong className="text-blue-800">{assignedAmb.status}</strong></div>
                    <div>Speed: <strong className="text-slate-900">{assignedAmb.speedKmh} km/h</strong></div>
                    <div>Fuel: <strong className="text-slate-900">{assignedAmb.fuelPercent}%</strong></div>
                    <div>Paramedic Lead: <strong className="text-slate-900">{assignedAmb.paramedicLead}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-mono">
                  No ambulance currently assigned to this incident.
                </div>
              )}

              {targetHosp ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-900">{targetHosp.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                      {targetHosp.traumaLevel}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-1 font-mono">
                    <div>Available Beds: <strong className="text-emerald-800">{targetHosp.availableBeds} / {targetHosp.totalBeds}</strong></div>
                    <div>ICU Beds Available: <strong className="text-emerald-800">{targetHosp.icuAvailable} / {targetHosp.icuTotal}</strong></div>
                    <div>Emergency Contact: <strong className="text-slate-900">{targetHosp.contactNumber}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-mono">
                  No destination hospital locked.
                </div>
              )}

              {/* Status Update Quick Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[11px] font-mono text-slate-500 font-bold uppercase block">
                  Update Mission State:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                  {['DISPATCHED', 'ON_SCENE', 'RESOLVED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => updateEmergencyStatus(activeEmergency.id, st as any)}
                      className={`py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                        activeEmergency.status === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Specialist Uplink & Clinical Notes */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200 space-y-4 bg-white shadow-sm">
              <div className="text-xs font-mono text-slate-900 font-bold uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-purple-600" />
                  <span>On-Call Tele-Consult</span>
                </span>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Specialist Uplink
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-sans space-y-2.5">
                <div className="font-bold text-purple-900">
                  Instant Video Uplink to Trauma Specialist
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Establish an encrypted WebRTC voice & video bridge between the field paramedic and available on-call specialist.
                </p>
                <button
                  onClick={() => {
                    const availableDoc = doctors.find((d) => d.status === 'Available') || doctors[0];
                    if (availableDoc) {
                      startTelemedicineSession(availableDoc.id, activeEmergency.id);
                      navigate('doctors');
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Start Tele-Consult
                </button>
              </div>

              {/* Incident Notes Log */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                  Incident Log & Field Notes:
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {(activeEmergency.notes && activeEmergency.notes.length > 0 ? activeEmergency.notes : ['Caller reports sudden onset dizziness.', 'ASHA worker administered oral rehydration.']).map((note, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add clinical note..."
                    value={clinicalNoteInput}
                    onChange={(e) => setClinicalNoteInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 font-mono text-sm">
          Select an incident to view clinical details.
        </div>
      )}
    </div>
  );
};

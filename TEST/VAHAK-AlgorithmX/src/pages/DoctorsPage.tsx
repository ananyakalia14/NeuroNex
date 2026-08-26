import React, { useState } from 'react';
import {
  Stethoscope,
  PhoneCall,
  PhoneOff,
  Video,
  Mic,
  MicOff,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  Activity,
  Search,
  User,
} from 'lucide-react';
import { useHealthcareStore } from '../store/useHealthcareStore';
import { Doctor } from '../types';

export const DoctorsPage: React.FC = () => {
  const { doctors, emergencies, toggleDoctorStatus, startTelemedicineSession } = useHealthcareStore();
  const [activeCallDoc, setActiveCallDoc] = useState<Doctor | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');

  const activeConsultDoctor = doctors.find((d) => d.status === 'On Tele-Consult');

  const specialties = ['ALL', ...Array.from(new Set(doctors.map((d) => d.specialization)))];

  const filteredDoctors = doctors
    .filter((d) => {
      if (filterSpecialty !== 'ALL' && d.specialization !== filterSpecialty) return false;
      return true;
    })
    .filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.specialization.toLowerCase().includes(q) || d.hospitalName.toLowerCase().includes(q);
    });

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono uppercase">
              On-Call Specialists & Telemedicine Roster
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-xs font-mono font-bold">
              {doctors.filter((d) => d.status === 'Available').length} SPECIALISTS AVAILABLE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Connect field paramedics and village health workers with senior surgeons, cardiologists, and toxicologists via WebRTC uplink.
          </p>
        </div>

        {/* Search & Specialty Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-sm"
            />
          </div>

          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-mono shadow-sm"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Telemedicine Call Banner if active */}
      {activeConsultDoctor && (
        <div className="p-5 rounded-2xl bg-white border-2 border-purple-300 shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div>
                <div className="text-xs font-mono font-bold text-purple-700 uppercase tracking-wider">
                  LIVE ENCRYPTED TELEMEDICINE SESSION IN PROGRESS
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {activeConsultDoctor.name} • {activeConsultDoctor.specialization}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  !isVideoOn
                    ? 'bg-red-50 text-red-600 border-red-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleDoctorStatus(activeConsultDoctor.id, 'Available')}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" /> End Tele-Consult
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Simulated Paramedic Camera Stream */}
            <div className="h-44 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between p-3 relative overflow-hidden text-white">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  FIELD STREAM: ALS-01 BODY-CAM
                </span>
                <span>1080p • 60 FPS • 24ms</span>
              </div>
              <div className="text-center text-slate-400 text-xs font-mono">
                [Live Telemetry Video Feed Streamed to Command Center]
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-200 bg-slate-800/80 p-1.5 rounded-lg">
                <span>Patient Vitals: HR 112 | SpO2 94% | BP 138/92</span>
                <span className="text-emerald-400 font-bold">STABLE</span>
              </div>
            </div>

            {/* Specialist Notes & Guidance */}
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-2 text-xs font-sans">
              <div className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                Specialist Remote Directives:
              </div>
              <ul className="space-y-1 text-slate-700 text-[11px] list-disc list-inside leading-relaxed">
                <li>Administer sublingual nitroglycerin 0.4mg if systolic BP remains &gt; 100.</li>
                <li>Maintain 4L/min nasal cannula oxygen support.</li>
                <li>Prepare 300mg Aspirin chewable and transmit 12-lead ECG snapshot to Apollo Trauma bay.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Doctors List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => {
          const isAvailable = doc.status === 'Available';
          const isOnCall = doc.status === 'On Tele-Consult';

          return (
            <div
              key={doc.id}
              className={`glass-panel p-5 rounded-2xl border transition-all bg-white hover:shadow-md ${
                isOnCall
                  ? 'border-purple-400 ring-1 ring-purple-400 shadow-md'
                  : isAvailable
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-slate-200 opacity-80'
              }`}
            >
              {/* Doctor Avatar & Info */}
              <div className="flex items-start gap-3.5 mb-3.5">
                <img
                  src={doc.avatarUrl}
                  alt={doc.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                  <div className="text-xs text-purple-700 font-mono font-medium">{doc.specialization}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.hospitalName}</div>
                </div>
              </div>

              {/* Status & Stats */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[10px] mb-3.5">
                <div>
                  <div className="text-slate-500">EXPERIENCE</div>
                  <div className="text-slate-900 font-bold mt-0.5">{doc.experienceYears} Years</div>
                </div>
                <div>
                  <div className="text-slate-500">LANGUAGES</div>
                  <div className="text-slate-900 font-bold mt-0.5 truncate">{doc.languages.join(', ')}</div>
                </div>
              </div>

              {/* Status Toggle & Tele-Consult Trigger */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 text-[10px] font-bold uppercase">ROSTER STATUS:</span>
                  <select
                    value={doc.status}
                    onChange={(e: any) => toggleDoctorStatus(doc.id, e.target.value)}
                    className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-700"
                  >
                    <option value="Available">Available</option>
                    <option value="In Surgery">In Surgery</option>
                    <option value="On Tele-Consult">On Tele-Consult</option>
                    <option value="Offline / Off-Duty">Offline</option>
                  </select>
                </div>

                <button
                  disabled={!isAvailable && !isOnCall}
                  onClick={() => {
                    const firstPending = emergencies.find((e) => e.status !== 'RESOLVED');
                    if (firstPending) {
                      startTelemedicineSession(doc.id, firstPending.id);
                    } else {
                      startTelemedicineSession(doc.id, emergencies[0]?.id || 'emg-01');
                    }
                  }}
                  className={`w-full py-2 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isOnCall
                      ? 'bg-purple-50 text-purple-700 border border-purple-300'
                      : isAvailable
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{isOnCall ? 'IN ACTIVE SESSION' : 'START TELEMEDICINE CONSULT'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

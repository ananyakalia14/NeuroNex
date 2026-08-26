/* ── HospitalPortal — Doctor & Healthcare Staff Operational Dashboard ──
   Features:
   - 77 Mumbai Hospital Switcher & Facility Identifier
   - Real-time Bed Management (General, ICU Ventilator, High-Flow Oxygen, Trauma Resus, NICU)
   - Emergency Medicine & Universal Blood Bank Stock Manager
   - Live Inbound 108 Emergency Queue with Pre-Arrival Triage Actions
   - Status & Diversion Mode Toggle (Normal Ops / Code Yellow / Critical Divert)
   - On-Duty Specialist Roster with Quick-Dial
*/

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  BedDouble,
  Pill,
  Ambulance,
  Clock,
  Plus,
  Minus,
  AlertTriangle,
  Flame,
  Droplet,
  HeartPulse,
  Users,
  Search,
  PhoneCall,
  Activity,
  Baby,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { Hospital, Dispatch } from '../../db/schema';
import { MUMBAI_MMR_HOSPITALS, type MumbaiHospitalData } from '../../data/mumbaiHospitals';
import { formatTime, formatDistance } from '../../utils/geo';
import './HospitalPortal.css';

interface HospitalPortalProps {
  hospital: Hospital | MumbaiHospitalData;
  allHospitals?: MumbaiHospitalData[];
  onSelectHospital?: (hospitalId: number) => void;
  onUpdateBeds: (id: number, beds: number) => void;
  onUpdateMedicine: (id: number, medicine: string, qty: number) => void;
  incomingDispatches: Dispatch[];
}

export function HospitalPortal({
  hospital,
  allHospitals = MUMBAI_MMR_HOSPITALS,
  onSelectHospital,
  onUpdateBeds,
  onUpdateMedicine,
  incomingDispatches,
}: HospitalPortalProps) {
  const { profile } = useAuth();
  const [hospitalStatus, setHospitalStatus] = useState<'NORMAL' | 'CODE_YELLOW' | 'DIVERT'>('NORMAL');
  const [activeTab, setActiveTab] = useState<'overview' | 'beds' | 'pharmacy' | 'specialists'>('overview');
  const [hospSearch, setHospSearch] = useState('');
  const [showHospDropdown, setShowHospDropdown] = useState(false);

  // Sub-category bed allocations
  const [icuBeds, setIcuBeds] = useState(Math.max(2, Math.floor(hospital.bedsAvailable * 0.25)));
  const [oxygenBeds, setOxygenBeds] = useState(Math.max(4, Math.floor(hospital.bedsAvailable * 0.45)));
  const [traumaBays, setTraumaBays] = useState(3);
  const [nicuBeds, setNicuBeds] = useState(4);

  // Blood Bank stock
  const [bloodStock, setBloodStock] = useState({
    'O-Negative (Universal)': 6,
    'O-Positive': 18,
    'A-Positive': 14,
    'B-Positive': 22,
    'AB-Negative': 4,
  });

  const handleBedAdjust = (delta: number) => {
    const next = Math.max(0, Math.min(hospital.bedsTotal, hospital.bedsAvailable + delta));
    onUpdateBeds(hospital.id, next);
  };

  const handleMedAdjust = (med: string, current: number, delta: number) => {
    const next = Math.max(0, current + delta);
    onUpdateMedicine(hospital.id, med, next);
  };

  const handleBloodAdjust = (type: keyof typeof bloodStock, delta: number) => {
    setBloodStock((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + delta),
    }));
  };

  const bedOccupancy = hospital.bedsTotal > 0
    ? Math.round(((hospital.bedsTotal - hospital.bedsAvailable) / hospital.bedsTotal) * 100)
    : 0;

  // Filtered hospital selector list
  const filteredHospitals = allHospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(hospSearch.toLowerCase()) ||
      h.location.toLowerCase().includes(hospSearch.toLowerCase()) ||
      h.administrativeArea.toLowerCase().includes(hospSearch.toLowerCase())
  );

  // Simulated inbound fallback queue if no active live dispatches exist
  const displayQueue: Dispatch[] = incomingDispatches.length > 0 ? incomingDispatches : [
    {
      id: 101,
      patientId: 'p-sim-881',
      patientName: 'Kailash Patil (Accident / Trauma)',
      patientPhone: '+91 98201 44521',
      driverName: 'Santosh Shinde (108 ALS Pilot)',
      driverPhone: '+91 98200 11080',
      ambulanceNumber: 'MH-05-EM-1080',
      sourceNodeId: 20,
      urgencyTier: 1,
      requiredSpecialty: 'emergency',
      requiredMedicine: 'antivenom',
      assignedHospitalId: hospital.id,
      assignedAmbulanceId: 1,
      routeNodeIds: [20, 21, 22],
      routeDistance: 2.4,
      routeTime: 4.5,
      status: 'EN_ROUTE',
      eta: 4.5,
      rationale: 'High-speed collision on Kalyan-Shilphata Rd. Multiple lacerations.',
      alternativesConsidered: [],
      timestamp: Date.now() - 120000,
    },
    {
      id: 102,
      patientId: 'p-sim-882',
      patientName: 'Sunita Deshmukh (Chest Pain / STEMI)',
      patientPhone: '+91 98330 99881',
      driverName: 'Vikram Jadhav (108 ALS Pilot)',
      driverPhone: '+91 98330 11081',
      ambulanceNumber: 'MH-05-EM-1082',
      sourceNodeId: 21,
      urgencyTier: 1,
      requiredSpecialty: 'cardiology',
      requiredMedicine: 'streptokinase',
      assignedHospitalId: hospital.id,
      assignedAmbulanceId: 2,
      routeNodeIds: [21, 22],
      routeDistance: 4.1,
      routeTime: 7.2,
      status: 'DISPATCHED',
      eta: 7.2,
      rationale: 'Acute STEMI symptoms. ECG transmitted via telemetry.',
      alternativesConsidered: [],
      timestamp: Date.now() - 60000,
    },
  ];


  return (
    <div className="hospital-portal" id="hospital-portal">
      {/* ── 1. Top Identity & Facility Switcher ── */}
      <div className="hospital-portal__card clay-card">
        <div className="hospital-portal__header">
          <div className="hospital-portal__identity">
            <div className="hospital-portal__avatar">🏥</div>
            <div className="hospital-portal__hosp-info">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="hospital-portal__title">{hospital.name}</h2>
                <span className="clay-badge clay-badge--info text-2xs">{hospital.tier}</span>
                <span className="text-3xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  {(hospital as any).location || 'Mumbai MMR'}
                </span>
              </div>
              <p className="text-2xs text-tertiary">
                Duty Officer: <strong>{profile.name || 'Dr. Sneha Kulkarni (ER Chief)'}</strong> • KDMC / MCGM Network
              </p>
            </div>
          </div>

          {/* Quick Status Mode Pill */}
          <div className="hospital-portal__status-actions">
            <select
              value={hospitalStatus}
              onChange={(e) => setHospitalStatus(e.target.value as any)}
              className={`hospital-portal__status-select hospital-portal__status-select--${hospitalStatus.toLowerCase()}`}
            >
              <option value="NORMAL">🟢 NORMAL OPS (Accepting 108)</option>
              <option value="CODE_YELLOW">🟡 CODE YELLOW (Trauma Surge)</option>
              <option value="DIVERT">🔴 CRITICAL DIVERT (Full)</option>
            </select>
          </div>
        </div>

        {/* 77 Hospital Selector Bar */}
        <div className="hospital-portal__switch-bar">
          <div className="hospital-portal__switch-input-wrap">
            <Search size={13} className="text-slate-400" />
            <input
              type="text"
              placeholder="Switch facility across 77 Mumbai hospitals (e.g. Fortis, KEM, Lilavati)..."
              value={hospSearch}
              onChange={(e) => {
                setHospSearch(e.target.value);
                setShowHospDropdown(true);
              }}
              onFocus={() => setShowHospDropdown(true)}
              className="hospital-portal__switch-input"
            />
          </div>

          {showHospDropdown && (
            <div className="hospital-portal__dropdown clay-card">
              <div className="flex justify-between items-center px-2 py-1 border-b border-slate-100 text-2xs font-bold text-slate-500">
                <span>Select Facility ({filteredHospitals.length} Found)</span>
                <button
                  type="button"
                  onClick={() => setShowHospDropdown(false)}
                  className="text-primary hover:underline text-2xs"
                >
                  Close
                </button>
              </div>
              <div className="hospital-portal__dropdown-list">
                {filteredHospitals.slice(0, 10).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className={`hospital-portal__dropdown-item ${h.id === hospital.id ? 'hospital-portal__dropdown-item--active' : ''}`}
                    onClick={() => {
                      onSelectHospital?.(h.id);
                      setShowHospDropdown(false);
                      setHospSearch('');
                    }}
                  >
                    <div className="text-left">
                      <strong className="text-xs text-slate-800 block">{h.name}</strong>
                      <span className="text-3xs text-slate-500">{h.location} • {h.bedsAvailable} Beds Free</span>
                    </div>
                    <span className="clay-badge clay-badge--info text-3xs">{h.tier}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="hospital-portal__tabs">
          <button
            type="button"
            className={`hospital-portal__tab-btn ${activeTab === 'overview' ? 'hospital-portal__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={13} /> Overview & Queue
          </button>
          <button
            type="button"
            className={`hospital-portal__tab-btn ${activeTab === 'beds' ? 'hospital-portal__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('beds')}
          >
            <BedDouble size={13} /> Beds ({hospital.bedsAvailable}/{hospital.bedsTotal})
          </button>
          <button
            type="button"
            className={`hospital-portal__tab-btn ${activeTab === 'pharmacy' ? 'hospital-portal__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('pharmacy')}
          >
            <Pill size={13} /> Pharmacy & Blood Bank
          </button>
          <button
            type="button"
            className={`hospital-portal__tab-btn ${activeTab === 'specialists' ? 'hospital-portal__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('specialists')}
          >
            <Users size={13} /> On-Duty Roster
          </button>
        </div>
      </div>

      {/* ── TAB 1: OVERVIEW & INCOMING QUEUE ── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-3">
          {/* Quick Metrics Strip */}
          <div className="hospital-portal__kpi-grid">
            <div className="hospital-portal__kpi clay-card--inset">
              <span className="text-3xs text-slate-500 font-semibold uppercase">Total Free Beds</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <strong className="text-base font-extrabold text-emerald-600">{hospital.bedsAvailable}</strong>
                <span className="text-2xs text-slate-400 font-medium">/ {hospital.bedsTotal}</span>
              </div>
            </div>

            <div className="hospital-portal__kpi clay-card--inset">
              <span className="text-3xs text-slate-500 font-semibold uppercase">ICU Ventilators</span>
              <strong className="text-base font-extrabold text-rose-600 mt-0.5 block">{icuBeds} Ready</strong>
            </div>

            <div className="hospital-portal__kpi clay-card--inset">
              <span className="text-3xs text-slate-500 font-semibold uppercase">O2 High-Flow Beds</span>
              <strong className="text-base font-extrabold text-sky-600 mt-0.5 block">{oxygenBeds} Ready</strong>
            </div>

            <div className="hospital-portal__kpi clay-card--inset">
              <span className="text-3xs text-slate-500 font-semibold uppercase">Inbound 108 Units</span>
              <strong className="text-base font-extrabold text-amber-600 mt-0.5 block">{displayQueue.length} En Route</strong>
            </div>
          </div>

          {/* Incoming Emergency Queue Section */}
          <div className="hospital-portal__section clay-card">
            <div className="hospital-portal__section-header">
              <h3 className="hospital-portal__section-title">
                <Ambulance size={16} />
                Live Inbound Emergency Queue
              </h3>
              <span className="clay-badge clay-badge--danger text-2xs font-bold animate-pulse">
                {displayQueue.length} Active Trips
              </span>
            </div>

            <div className="hospital-portal__queue-list">
              {displayQueue.map((d) => (
                <motion.div
                  key={d.id}
                  className="hospital-portal__queue-item clay-card--flat"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="hospital-portal__queue-top">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`clay-badge clay-badge--${
                          d.urgencyTier === 1 ? 'danger' : d.urgencyTier === 2 ? 'warning' : 'success'
                        } text-3xs font-bold`}
                      >
                        {d.urgencyTier === 1 ? '🔴 P1 CRITICAL' : d.urgencyTier === 2 ? '🟡 P2 URGENT' : '🟢 STANDARD'}
                      </span>
                      <strong className="text-xs text-slate-800 font-bold">{d.patientName}</strong>
                    </div>
                    <span className="hospital-portal__queue-eta text-emerald-700 font-extrabold text-xs flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Clock size={12} /> ETA ~{formatTime(d.eta)}
                    </span>
                  </div>

                  <p className="text-2xs text-slate-600 mt-1 font-medium italic">
                    "{d.rationale || 'Emergency 108 route locked with pre-hospital tele-triage.'}"
                  </p>

                  <div className="hospital-portal__queue-meta text-3xs text-slate-500 mt-1.5 flex gap-3 flex-wrap">
                    <span>Ambulance: <strong>{d.ambulanceNumber}</strong></span>
                    <span>Pilot: <strong>{d.driverName}</strong></span>
                    <span>Dist: <strong>{formatDistance(d.routeDistance)}</strong></span>
                  </div>

                  {/* Pre-Arrival Action Checklist */}
                  <div className="hospital-portal__prep-box">
                    <span className="text-3xs font-bold text-slate-700 block mb-1">Pre-Arrival Triage Prep:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button type="button" className="hospital-portal__prep-chip hospital-portal__prep-chip--active">
                        ✓ Bay Allocated
                      </button>
                      <button type="button" className="hospital-portal__prep-chip">
                        Notify {d.requiredSpecialty || 'ER Consultant'}
                      </button>
                      <button type="button" className="hospital-portal__prep-chip">
                        Prepare Blood Reserve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BED MANAGEMENT ── */}
      {activeTab === 'beds' && (
        <div className="hospital-portal__section clay-card flex flex-col gap-3">
          <div className="hospital-portal__section-header">
            <div>
              <h3 className="hospital-portal__section-title">
                <BedDouble size={16} /> Bed Allocations & Critical Capacity
              </h3>
              <p className="text-2xs text-slate-500">Live capacity broadcasted to 108 Central Dispatch</p>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {hospital.bedsAvailable} Free / {hospital.bedsTotal} Total ({100 - bedOccupancy}% Free)
            </span>
          </div>

          {/* Master Progress Bar */}
          <div className="clay-progress" style={{ height: 8 }}>
            <div
              className={`clay-progress__fill ${
                bedOccupancy > 80
                  ? 'clay-progress__fill--danger'
                  : bedOccupancy > 50
                  ? 'clay-progress__fill--warning'
                  : 'clay-progress__fill--success'
              }`}
              style={{ width: `${100 - bedOccupancy}%` }}
            />
          </div>

          <div className="hospital-portal__beds-grid">
            {/* General Ward */}
            <div className="hospital-portal__bed-control clay-card--inset">
              <div>
                <strong className="text-xs text-slate-800 block">General Emergency Ward</strong>
                <p className="text-3xs text-slate-500">Standard observation & IV</p>
              </div>
              <div className="hospital-portal__stepper">
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => handleBedAdjust(-1)}>
                  <Minus size={13} />
                </button>
                <span className="hospital-portal__stepper-val">{hospital.bedsAvailable}</span>
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => handleBedAdjust(1)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* ICU Ventilator */}
            <div className="hospital-portal__bed-control clay-card--inset">
              <div>
                <strong className="text-xs text-slate-800 flex items-center gap-1">
                  <Flame size={13} className="text-rose-500" /> ICU / Ventilator Bays
                </strong>
                <p className="text-3xs text-slate-500">Invasive mechanical ventilation</p>
              </div>
              <div className="hospital-portal__stepper">
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setIcuBeds(Math.max(0, icuBeds - 1))}>
                  <Minus size={13} />
                </button>
                <span className="hospital-portal__stepper-val">{icuBeds}</span>
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setIcuBeds(icuBeds + 1)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Oxygen Beds */}
            <div className="hospital-portal__bed-control clay-card--inset">
              <div>
                <strong className="text-xs text-slate-800 flex items-center gap-1">
                  <Droplet size={13} className="text-sky-500" /> High-Flow O2 Beds
                </strong>
                <p className="text-3xs text-slate-500">Central line manifold supply</p>
              </div>
              <div className="hospital-portal__stepper">
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setOxygenBeds(Math.max(0, oxygenBeds - 1))}>
                  <Minus size={13} />
                </button>
                <span className="hospital-portal__stepper-val">{oxygenBeds}</span>
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setOxygenBeds(oxygenBeds + 1)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Trauma Resus Bays */}
            <div className="hospital-portal__bed-control clay-card--inset">
              <div>
                <strong className="text-xs text-slate-800 flex items-center gap-1">
                  <HeartPulse size={13} className="text-amber-500" /> Trauma Resuscitation Bays
                </strong>
                <p className="text-3xs text-slate-500">Defibrillator & crash cart ready</p>
              </div>
              <div className="hospital-portal__stepper">
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setTraumaBays(Math.max(0, traumaBays - 1))}>
                  <Minus size={13} />
                </button>
                <span className="hospital-portal__stepper-val">{traumaBays}</span>
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setTraumaBays(traumaBays + 1)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* NICU / PICU */}
            <div className="hospital-portal__bed-control clay-card--inset">
              <div>
                <strong className="text-xs text-slate-800 flex items-center gap-1">
                  <Baby size={13} className="text-purple-500" /> Pediatric / NICU Incubators
                </strong>
                <p className="text-3xs text-slate-500">Neonatal critical warming</p>
              </div>
              <div className="hospital-portal__stepper">
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setNicuBeds(Math.max(0, nicuBeds - 1))}>
                  <Minus size={13} />
                </button>
                <span className="hospital-portal__stepper-val">{nicuBeds}</span>
                <button type="button" className="clay-btn clay-btn--icon" onClick={() => setNicuBeds(nicuBeds + 1)}>
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: PHARMACY & BLOOD BANK ── */}
      {activeTab === 'pharmacy' && (
        <div className="flex flex-col gap-3">
          {/* Universal Blood Bank Reserves */}
          <div className="hospital-portal__section clay-card">
            <div className="hospital-portal__section-header">
              <h3 className="hospital-portal__section-title">
                <Droplet size={16} className="text-rose-600" /> Blood Bank & Packed RBC Reserves
              </h3>
              <span className="clay-badge clay-badge--danger text-2xs font-bold">24/7 Transfusion Ready</span>
            </div>

            <div className="hospital-portal__blood-grid">
              {Object.entries(bloodStock).map(([type, units]) => (
                <div key={type} className="hospital-portal__blood-card clay-card--inset">
                  <div className="flex justify-between items-center">
                    <strong className="text-xs text-slate-800">{type}</strong>
                    <span className={`text-xs font-bold ${units < 8 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {units} Units
                    </span>
                  </div>
                  <div className="flex justify-end gap-1.5 mt-1.5">
                    <button
                      type="button"
                      className="hospital-portal__quick-btn"
                      onClick={() => handleBloodAdjust(type as any, -1)}
                      title="Issue 1 Unit"
                    >
                      -1 Unit
                    </button>
                    <button
                      type="button"
                      className="hospital-portal__quick-btn hospital-portal__quick-btn--green"
                      onClick={() => handleBloodAdjust(type as any, 2)}
                      title="Restock 2 Units"
                    >
                      +2 Units
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Life-Saving Medicine Inventory */}
          <div className="hospital-portal__section clay-card">
            <div className="hospital-portal__section-header">
              <h3 className="hospital-portal__section-title">
                <Pill size={16} /> Emergency Pharmacy & Antidotes
              </h3>
              <span className="text-2xs text-slate-500 font-semibold">12 Core Emergency Formulations</span>
            </div>

            <div className="hospital-portal__med-grid">
              {Object.entries(hospital.medicineStock || {}).map(([med, qty]) => {
                const isLow = qty < 12;
                return (
                  <div key={med} className="hospital-portal__med-item clay-card--flat">
                    <div className="hospital-portal__med-info">
                      <strong className="text-xs text-slate-800 capitalize block truncate">
                        {med.replace(/_/g, ' ')}
                      </strong>
                      <span className={`text-2xs font-bold ${isLow ? 'text-rose-600 flex items-center gap-1' : 'text-emerald-700'}`}>
                        {isLow && <AlertTriangle size={11} />} {qty} Units Ready
                      </span>
                    </div>
                    <div className="hospital-portal__med-btns">
                      <button
                        type="button"
                        className="clay-btn clay-btn--icon"
                        onClick={() => handleMedAdjust(med, qty, -5)}
                        title="Consume 5 units"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        type="button"
                        className="clay-btn clay-btn--icon"
                        onClick={() => handleMedAdjust(med, qty, 10)}
                        title="Restock 10 units"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: ON-DUTY ROSTER ── */}
      {activeTab === 'specialists' && (
        <div className="hospital-portal__section clay-card">
          <div className="hospital-portal__section-header">
            <h3 className="hospital-portal__section-title">
              <Users size={16} /> On-Duty Emergency Specialist Roster
            </h3>
            <span className="clay-badge clay-badge--success text-2xs font-bold">Shift 1 • 24/7 Cover</span>
          </div>

          <div className="hospital-portal__doctor-list">
            {[
              { role: 'Chief ER Consultant', name: 'Dr. Sneha Kulkarni, MD', spec: 'Emergency Medicine', status: 'On Floor', color: 'emerald' },
              { role: 'Interventional Cardiologist', name: 'Dr. Rajesh Deshmukh, DM', spec: 'Cath Lab Ready', status: 'In Cath Lab', color: 'rose' },
              { role: 'Trauma & Ortho Surgeon', name: 'Dr. Amit Patil, MS', spec: 'OT 2 Active', status: 'On Standby', color: 'amber' },
              { role: 'Emergency Neurologist', name: 'Dr. Priya Shah, MCh', spec: 'CT/MRI Stroke Unit', status: 'On Call', color: 'purple' },
              { role: 'Critical Care Intensivist', name: 'Dr. Farhan Shaikh, DNB', spec: 'ICU / Ventilator', status: 'In ICU', color: 'sky' },
              { role: 'Obstetrician & Gynaecologist', name: 'Dr. Ananya Joshi, MS', spec: 'Labor OT / NICU', status: 'On Floor', color: 'emerald' },
            ].map((doc, i) => (
              <div key={i} className="hospital-portal__doc-card clay-card--flat">
                <div className="flex items-center gap-2">
                  <div className={`hospital-portal__doc-badge hospital-portal__doc-badge--${doc.color}`}>
                    🩺
                  </div>
                  <div>
                    <strong className="text-xs text-slate-800 block">{doc.name}</strong>
                    <span className="text-3xs text-slate-500 font-medium">{doc.role} • {doc.spec}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {doc.status}
                  </span>
                  <button type="button" className="clay-btn clay-btn--icon" title="Emergency Dial">
                    <PhoneCall size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

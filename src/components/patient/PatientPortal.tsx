/* ── PatientPortal — Minimalist, Clean & Modern Apple/Linear Aesthetic ── */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  Ambulance,
  HeartPulse,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  BookOpen,
  Building2,
  Stethoscope,
  Pill,
  Search,
  Bed,
  ArrowUpRight,
  Crosshair,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useHospitals } from '../../hooks/useDatabase';
import type { UrgencyTier, Specialty } from '../../db/schema';
import type { RouteResult } from '../../workers/types';
import type { LiveLocationState } from '../../hooks/useLiveLocation';
import { formatTime, formatDistance } from '../../utils/geo';
import './PatientPortal.css';

interface PatientPortalProps {
  onTriggerSOS: (urgency: UrgencyTier, specialty?: Specialty, medicine?: string, targetHospitalId?: number) => void;
  isComputing: boolean;
  lastResult: RouteResult | null;
  activeDispatchId?: number;
  onReset?: () => void;
  userLocation?: LiveLocationState | null;
  onLocateMe?: () => void;
  onSelectHospitalPin?: (hospitalId: number) => void;
}



interface TriageOption {
  id: string;
  label: string;
  icon: string;
  specialty: Specialty;
  urgency: UrgencyTier;
}

const TRIAGE_OPTIONS: TriageOption[] = [
  { id: 'cardiac', label: 'Heart & Chest', icon: '🫀', specialty: 'cardiology', urgency: 1 },
  { id: 'trauma', label: 'Accident / Bleeding', icon: '🩸', specialty: 'emergency', urgency: 1 },
  { id: 'maternity', label: 'Pregnancy Labor', icon: '🤰', specialty: 'obstetrics', urgency: 2 },
  { id: 'fracture', label: 'Bone Fracture', icon: '🦴', specialty: 'orthopedics', urgency: 2 },
  { id: 'stroke', label: 'Stroke / Paralysis', icon: '🧠', specialty: 'neurology', urgency: 1 },
  { id: 'fever', label: 'Severe Illness', icon: '🤒', specialty: 'general', urgency: 3 },
];

interface SpecialistOption {
  id: string;
  name: string;
  specialty: Specialty;
  icon: string;
  facility: string;
  urgency: UrgencyTier;
  targetHospitalId?: number;
}

const SPECIALIST_LIST: SpecialistOption[] = [
  { id: 'cardio', name: 'Interventional Cardiologist', specialty: 'cardiology', icon: '🫀', facility: 'AIMS Super-Specialty (24/7 Cath Lab)', urgency: 1, targetHospitalId: 0 },
  { id: 'neuro', name: 'Emergency Neurologist', specialty: 'neurology', icon: '🧠', facility: 'RR Multi-Specialty (CT/MRI Ready)', urgency: 1, targetHospitalId: 2 },
  { id: 'ortho', name: 'Trauma & Orthopedic Surgeon', specialty: 'orthopedics', icon: '🦴', facility: 'Icon Trauma Hospital (OT Ready)', urgency: 2, targetHospitalId: 4 },
  { id: 'obgyn', name: 'Emergency Obstetrician', specialty: 'obstetrics', icon: '🤰', facility: 'Shastri Nagar Civic Hospital (NICU)', urgency: 1, targetHospitalId: 1 },
  { id: 'icu', name: 'Critical Care Intensivist', specialty: 'emergency', icon: '🩺', facility: 'Fortis Hospital Mulund (Level-1 ICU)', urgency: 1, targetHospitalId: 25 },
  { id: 'pediatric', name: 'Pediatric Emergency Specialist', specialty: 'pediatrics', icon: '👶', facility: 'SRCC Children Hospital & KEM', urgency: 2, targetHospitalId: 50 },
  { id: 'toxico', name: 'Snakebite & Toxicologist', specialty: 'emergency', icon: '🐍', facility: 'District Civil Hospital Thane', urgency: 1, targetHospitalId: 45 },
  { id: 'burns', name: 'Burns & Trauma Specialist', specialty: 'emergency', icon: '🔥', facility: 'National Burns Center & CSMH', urgency: 1, targetHospitalId: 10 },
];

interface MedicineItem {
  id: string;
  name: string;
  stock: string;
  hospital: string;
  icon: string;
  urgency: UrgencyTier;
  targetHospitalId?: number;
}

const CRITICAL_MEDICINES: MedicineItem[] = [
  { id: 'asv', name: 'Polyvalent Snake Antivenom', stock: '24 Vials Ready', hospital: 'AIMS Hospital & ICU', icon: '🐍', urgency: 1, targetHospitalId: 0 },
  { id: 'streptokinase', name: 'Streptokinase (Thrombolytic)', stock: '12 Vials Ready', hospital: 'RR Multi-Specialty', icon: '💉', urgency: 1, targetHospitalId: 2 },
  { id: 'atropine', name: 'Atropine Antidote (OP Poison)', stock: '30 Vials Available', hospital: 'Shastri Nagar Civic', icon: '🧪', urgency: 1, targetHospitalId: 1 },
  { id: 'mannitol', name: 'IV Mannitol 20% (Neuro Decompress)', stock: '18 Bottles Ready', hospital: 'KEM Hospital & ER', icon: '💧', urgency: 1, targetHospitalId: 50 },
  { id: 'blood', name: 'O-Negative Emergency Packed RBCs', stock: '6 Units Reserved', hospital: 'Lilavati Blood Bank', icon: '🩸', urgency: 1, targetHospitalId: 24 },
  { id: 'salbutamol', name: 'Inhaled Salbutamol & Ipratropium', stock: '40 Nebules Ready', hospital: 'Cooper Civic ER', icon: '💨', urgency: 2, targetHospitalId: 52 },
  { id: 'tranexamic', name: 'Tranexamic Acid (Hemostatic)', stock: '35 Ampoules Ready', hospital: 'Fortis Mulund', icon: '🩹', urgency: 1, targetHospitalId: 25 },
  { id: 'rabies', name: 'Anti-Rabies & Tetanus Serum', stock: '50 Doses Available', hospital: 'Rajawadi Hospital', icon: '🛡️', urgency: 2, targetHospitalId: 55 },
];

import { MUMBAI_MMR_HOSPITALS, MUMBAI_HOSPITAL_COORDINATES } from '../../data/mumbaiHospitals';

const DEFAULT_LOCAL_HOSPITALS = MUMBAI_MMR_HOSPITALS;

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

export function PatientPortal({
  onTriggerSOS,
  isComputing,
  lastResult,
  activeDispatchId,
  onReset,
  userLocation,
  onLocateMe,
  onSelectHospitalPin,
}: PatientPortalProps) {
  const { t, language } = useLanguage();

  const { hospitals } = useHospitals();
  const [voiceActive, setVoiceActive] = useState(true);
  const [showFirstAid, setShowFirstAid] = useState(false);
  const [activeTab, setActiveTab] = useState<'hospital' | 'specialist' | 'medicine'>('hospital');
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedHospId, setHighlightedHospId] = useState<number | null>(null);

  const curLat = userLocation?.lat || 19.2152;
  const curLng = userLocation?.lng || 73.0820;

  // Voice confirmation
  const speakConfirmation = (text: string) => {
    if (!voiceActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  const handleQuickSOS = (option: TriageOption) => {
    const prompt =
      language === 'mr'
        ? `तातडीची रुग्णवाहिका मागवली आहे.`
        : language === 'hi'
        ? `आपातकालीन एम्बुलेंस अनुरोध भेजा गया है।`
        : `Emergency alert dispatched. Nearest ambulance is en route.`;
    speakConfirmation(prompt);
    onTriggerSOS(option.urgency, option.specialty);
  };

  const handleHospitalRoute = (h: any) => {
    speakConfirmation(`Routing to ${h.name.split('(')[0].trim()}.`);
    onTriggerSOS(1, h.specialties?.[0], undefined, h.id);
  };

  const handleSpecialistRoute = (spec: SpecialistOption) => {
    speakConfirmation(`Routing to ${spec.facility.split('(')[0].trim()} for ${spec.name}.`);
    onTriggerSOS(spec.urgency, spec.specialty, undefined, spec.targetHospitalId);
  };

  const handleMedicineRoute = (med: MedicineItem) => {
    speakConfirmation(`Routing to ${med.hospital.split('(')[0].trim()} for ${med.name}.`);
    onTriggerSOS(med.urgency, undefined, med.name, med.targetHospitalId);
  };

  const isDispatched = !!activeDispatchId || !!lastResult;

  const activeHospitalList = hospitals.length > 0 ? hospitals : DEFAULT_LOCAL_HOSPITALS;
  const filteredHospitals = activeHospitalList
    .map((h) => {
      const coord = (h as any).lat !== undefined
        ? { lat: (h as any).lat, lng: (h as any).lng }
        : MUMBAI_HOSPITAL_COORDINATES[h.id] || { lat: 19.2125, lng: 73.0933 };
      const dist = calculateDistanceKm(curLat, curLng, coord.lat, coord.lng);
      const eta = Math.max(3, Math.round(dist * 2.1));
      return { ...h, distKm: dist, etaMin: eta };
    })

    .filter((h) => {
      const q = searchQuery.toLowerCase();
      const nameMatch = h.name.toLowerCase().includes(q);
      const tierMatch = h.tier.toLowerCase().includes(q);
      const locationMatch = (h as any).location?.toLowerCase()?.includes(q);
      const areaMatch = (h as any).administrativeArea?.toLowerCase()?.includes(q);
      return nameMatch || tierMatch || locationMatch || areaMatch;
    })
    .sort((a, b) => a.distKm - b.distKm);

  const filteredSpecialists = SPECIALIST_LIST.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.facility.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMedicines = CRITICAL_MEDICINES.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.hospital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="patient-portal">
      <AnimatePresence mode="wait">
        {!isDispatched ? (
          <motion.div
            key="idle"
            className="patient-portal__container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* ── 1. Compact Header ── */}
            <header className="patient-portal__header">
              <div className="patient-portal__header-left">
                <div className="patient-portal__header-status">
                  <span className="patient-portal__status-dot" />
                  <h2 className="patient-portal__heading">Emergency SOS</h2>
                </div>
                <div className="patient-portal__sub-location">
                  <MapPin size={11} className="text-slate-400" />
                  <span>{userLocation?.address || 'Mumbai MMR • Live GPS Ready'}</span>
                  {userLocation?.accuracy && (
                    <span className="text-slate-400 ml-1">±{Math.round(userLocation.accuracy)}m</span>
                  )}
                  {onLocateMe && (
                    <button
                      type="button"
                      onClick={onLocateMe}
                      className="text-primary hover:underline ml-1 cursor-pointer"
                      title="Update GPS position"
                    >
                      <Crosshair size={11} className="inline ml-0.5" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={`patient-portal__icon-btn ${voiceActive ? 'patient-portal__icon-btn--active' : ''}`}
                onClick={() => {
                  if (voiceActive && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setVoiceActive(!voiceActive);
                }}
                title={voiceActive ? 'Mute Voice Prompts' : 'Unmute Voice Prompts'}
              >
                {voiceActive ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
            </header>

            {/* ── 2. Master Emergency SOS Action ── */}
            <button
              type="button"
              className="patient-portal__hero-sos"
              onClick={() => handleQuickSOS(TRIAGE_OPTIONS[0])}
              id="patient-big-sos-btn"
            >
              <div className="patient-portal__hero-sos-left">
                <div className="patient-portal__hero-icon-box">
                  <HeartPulse size={20} className="patient-portal__hero-icon" />
                </div>
                <div className="patient-portal__hero-text">
                  <span className="patient-portal__hero-title">1-Tap Emergency SOS</span>
                  <span className="patient-portal__hero-caption">Instant 108 Ambulance & Nearest Hospital</span>
                </div>
              </div>
              <ArrowUpRight size={18} className="patient-portal__hero-arrow" />
            </button>

            {/* ── 3. Clean Medical Triage Grid ── */}
            <div className="patient-portal__triage-block">
              <span className="patient-portal__section-label">Select Medical Condition</span>
              <div className="patient-portal__triage-grid">
                {TRIAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="patient-portal__triage-card"
                    onClick={() => handleQuickSOS(opt)}
                  >
                    <span className="patient-portal__triage-icon">{opt.icon}</span>
                    <span className="patient-portal__triage-name">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 4. Unified Discovery Card (Hospitals, Specialists, Medicines) ── */}
            <div className="patient-portal__discovery-card">
              {/* Segmented Control Tabs */}
              <div className="patient-portal__tabs">
                <button
                  type="button"
                  className={`patient-portal__tab-btn ${activeTab === 'hospital' ? 'patient-portal__tab-btn--active' : ''}`}
                  onClick={() => {
                    setActiveTab('hospital');
                    setSearchQuery('');
                  }}
                >
                  <Building2 size={12} />
                  <span>Hospitals ({filteredHospitals.length})</span>
                </button>
                <button
                  type="button"
                  className={`patient-portal__tab-btn ${activeTab === 'specialist' ? 'patient-portal__tab-btn--active' : ''}`}
                  onClick={() => {
                    setActiveTab('specialist');
                    setSearchQuery('');
                  }}
                >
                  <Stethoscope size={12} />
                  <span>Specialists ({filteredSpecialists.length})</span>
                </button>
                <button
                  type="button"
                  className={`patient-portal__tab-btn ${activeTab === 'medicine' ? 'patient-portal__tab-btn--active' : ''}`}
                  onClick={() => {
                    setActiveTab('medicine');
                    setSearchQuery('');
                  }}
                >
                  <Pill size={12} />
                  <span>Medicines ({filteredMedicines.length})</span>
                </button>
              </div>

              {/* Minimal Search Bar */}
              <div className="patient-portal__search-wrap">
                <Search size={13} className="patient-portal__search-icon" />
                <input
                  type="text"
                  className="patient-portal__search-field"
                  placeholder={
                    activeTab === 'hospital'
                      ? 'Search by name, area (e.g. Bandra, Vashi, Fort)...'
                      : activeTab === 'specialist'
                      ? 'Search specialist doctor...'
                      : 'Search emergency medicine...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* TAB 1: HOSPITALS */}
              {activeTab === 'hospital' && (
                <div className="patient-portal__list">
                  {filteredHospitals.map((h) => (
                    <div
                      key={h.id}
                      className={`patient-portal__row ${highlightedHospId === h.id ? 'patient-portal__row--active' : ''}`}
                      onClick={() => {
                        setHighlightedHospId(h.id);
                        onSelectHospitalPin?.(h.id);
                      }}
                      style={{ cursor: 'pointer' }}
                      title={`Click to focus map on ${h.name}`}
                    >
                      <div className="patient-portal__row-left">
                        <div className="patient-portal__row-header">
                          <span className="patient-portal__row-title">{h.name}</span>
                          <span className="patient-portal__tag">{h.tier}</span>
                          <span className="text-3xs font-bold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
                            {h.distKm} km • ~{h.etaMin}m
                          </span>
                        </div>
                        <div className="patient-portal__row-meta">
                          <span className="patient-portal__bed-text">
                            <Bed size={11} /> {h.bedsAvailable} Beds Ready
                          </span>
                          <span className="patient-portal__bullet">•</span>
                          <span className="patient-portal__spec-text">{(h as any).location || h.specialties.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="patient-portal__btn-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleHospitalRoute(h);
                        }}
                      >
                        Route
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: SPECIALISTS */}
              {activeTab === 'specialist' && (
                <div className="patient-portal__list">
                  {filteredSpecialists.map((s) => (
                    <div key={s.id} className="patient-portal__row">
                      <div className="patient-portal__row-left">
                        <div className="patient-portal__row-header">
                          <span className="text-xs mr-1">{s.icon}</span>
                          <span className="patient-portal__row-title">{s.name}</span>
                        </div>
                        <span className="patient-portal__facility-text">{s.facility}</span>
                      </div>

                      <button
                        type="button"
                        className="patient-portal__btn-action patient-portal__btn-action--danger"
                        onClick={() => handleSpecialistRoute(s)}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: MEDICINES */}
              {activeTab === 'medicine' && (
                <div className="patient-portal__list">
                  {filteredMedicines.map((m) => (
                    <div key={m.id} className="patient-portal__row">
                      <div className="patient-portal__row-left">
                        <div className="patient-portal__row-header">
                          <span className="text-xs mr-1">{m.icon}</span>
                          <span className="patient-portal__row-title">{m.name}</span>
                        </div>
                        <div className="patient-portal__row-meta">
                          <span className="patient-portal__stock-text">{m.stock}</span>
                          <span className="patient-portal__bullet">•</span>
                          <span className="patient-portal__facility-text">{m.hospital}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="patient-portal__btn-action patient-portal__btn-action--green"
                        onClick={() => handleMedicineRoute(m)}
                      >
                        Route
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 5. Minimal First-Aid Toggle ── */}
            <div className="patient-portal__firstaid-wrap">
              <button
                type="button"
                className="patient-portal__firstaid-header"
                onClick={() => setShowFirstAid(!showFirstAid)}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={13} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">First-Aid Emergency Guide</span>
                </div>
                <ChevronRight size={13} className={`text-slate-400 transition-transform ${showFirstAid ? 'rotate-90' : ''}`} />
              </button>

              {showFirstAid && (
                <div className="patient-portal__firstaid-body">
                  <p><strong>🫀 CPR:</strong> Push hard & fast in center of chest (100-120/min), give 2 rescue breaths.</p>
                  <p><strong>🩸 Bleeding:</strong> Apply direct firm pressure with clean cloth, elevate wound above heart.</p>
                  <p><strong>🧘 Fainting:</strong> Lay patient flat, elevate legs 12 inches, ensure fresh air flow.</p>
                </div>
              )}
            </div>

            {/* ── 6. Minimal Hotline Bar ── */}
            <footer className="patient-portal__footer">
              <div className="flex items-center gap-2">
                <PhoneCall size={14} className="text-slate-500" />
                <div className="flex flex-col text-left">
                  <span className="text-3xs text-slate-400 font-medium tracking-wide uppercase">Toll-Free Helpline</span>
                  <span className="text-xs font-bold text-slate-800">108 / 112 Emergency</span>
                </div>
              </div>
              <a href="tel:108" className="patient-portal__call-pill">
                Call 108
              </a>
            </footer>
          </motion.div>
        ) : (
          /* ── DISPATCHED STATE (MINIMALIST APPLE TRACKER) ── */
          <motion.div
            key="dispatched"
            className="patient-portal__dispatched"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Live Status Card */}
            <div className="patient-portal__active-card">
              <div className="flex items-center justify-between w-full">
                <span className="patient-portal__status-badge">
                  🚨 Ambulance Dispatched
                </span>
                <span className="text-2xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  GPS Live
                </span>
              </div>

              <div className="patient-portal__ambulance-icon-wrap">
                <Ambulance size={28} className="text-red-600 animate-pulse" />
              </div>

              {lastResult ? (
                <div className="w-full flex flex-col gap-2">
                  <div className="patient-portal__metric-row">
                    <span className="patient-portal__metric-label">
                      <Clock size={12} /> Estimated Arrival
                    </span>
                    <strong className="patient-portal__metric-val text-red-600">
                      ~{formatTime(lastResult.totalTime)}
                    </strong>
                  </div>

                  <div className="patient-portal__metric-row">
                    <span className="patient-portal__metric-label">
                      <MapPin size={12} /> Distance
                    </span>
                    <strong className="patient-portal__metric-val text-slate-800">
                      {formatDistance(lastResult.totalDistance)}
                    </strong>
                  </div>

                  <div className="patient-portal__hosp-box">
                    <span className="text-3xs text-slate-500 font-bold uppercase tracking-wider block">
                      Destination Facility
                    </span>
                    <strong className="text-xs text-slate-900 block mt-0.5">
                      {lastResult.hospitalName}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Sparkles size={13} className="animate-spin" />
                  <span>{isComputing ? t('findingRoute') : 'Locking optimal route...'}</span>
                </div>
              )}
            </div>

            {/* Pilot Calling Box */}
            <div className="patient-portal__driver-box">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" /> Assigned 108 Pilot
                </span>
                <span className="text-3xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  EN ROUTE
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div>
                  <strong className="text-xs text-slate-800 block">Santosh Shinde</strong>
                  <span className="text-3xs text-slate-500">MH-05-EM-1080 (ALS Unit)</span>
                </div>
              </div>

              <a
                href="tel:9820011080"
                className="patient-portal__call-driver-action"
                id="patient-call-driver-btn"
              >
                <PhoneCall size={14} />
                <span>Call Pilot (+91 98200 11080)</span>
              </a>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              className="patient-portal__btn-reset"
              onClick={() => {
                if (onReset) {
                  onReset();
                } else {
                  window.location.reload();
                }
              }}
            >
              New Request / Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

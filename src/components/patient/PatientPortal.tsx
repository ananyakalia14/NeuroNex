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
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { useHospitals } from '../../hooks/useDatabase';
import type { UrgencyTier, Specialty } from '../../db/schema';
import type { RouteResult } from '../../workers/types';
import type { LiveLocationState } from '../../hooks/useLiveLocation';
import { formatTime, formatDistance } from '../../utils/geo';
import './PatientPortal.css';

interface PatientPortalProps {
  onTriggerSOS: (urgency: UrgencyTier, specialty?: Specialty, medicine?: string) => void;
  isComputing: boolean;
  lastResult: RouteResult | null;
  activeDispatchId?: number;
  onReset?: () => void;
  userLocation?: LiveLocationState | null;
  onLocateMe?: () => void;
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
}

const SPECIALIST_LIST: SpecialistOption[] = [
  { id: 'cardio', name: 'Cardiologist', specialty: 'cardiology', icon: '🫀', facility: 'AIMS Hospital (24/7 ICU)', urgency: 1 },
  { id: 'neuro', name: 'Neurologist', specialty: 'neurology', icon: '🧠', facility: 'Fortis Super-Specialty', urgency: 1 },
  { id: 'ortho', name: 'Orthopedic Surgeon', specialty: 'orthopedics', icon: '🦴', facility: 'RR Multi-Specialty', urgency: 2 },
  { id: 'obgyn', name: 'Gynecologist', specialty: 'obstetrics', icon: '🤰', facility: 'CSMH Hospital & Maternity', urgency: 2 },
  { id: 'pediatric', name: 'Pediatrician', specialty: 'pediatrics', icon: '👶', facility: 'Shastri Nagar Civic ER', urgency: 2 },
  { id: 'emergency', name: 'Trauma Surgeon', specialty: 'emergency', icon: '🚨', facility: 'AIMS Trauma Centre', urgency: 1 },
];

interface MedicineItem {
  id: string;
  name: string;
  stock: string;
  hospital: string;
  icon: string;
  urgency: UrgencyTier;
}

const CRITICAL_MEDICINES: MedicineItem[] = [
  { id: 'adrenaline', name: 'Adrenaline IV', stock: '25 Vials Available', hospital: 'AIMS Trauma ER', icon: '💉', urgency: 1 },
  { id: 'asv', name: 'Anti-Snake Venom (ASV)', stock: '15 Vials In-Stock', hospital: 'District Civil ER', icon: '🐍', urgency: 1 },
  { id: 'blood', name: 'Blood Bank (All Groups)', stock: '32 Units Ready', hospital: 'RR Blood Centre', icon: '🩸', urgency: 1 },
  { id: 'oxytocin', name: 'Oxytocin Ampoules', stock: '40 Ampoules Ready', hospital: 'Maternity Centre', icon: '🤰', urgency: 2 },
  { id: 'morphine', name: 'Morphine IV Analgesic', stock: '20 Vials Ready', hospital: 'Super-Specialty ICU', icon: '💊', urgency: 2 },
  { id: 'atropine', name: 'Atropine Antidote', stock: '30 Vials Available', hospital: 'Civic Hospital', icon: '🧪', urgency: 1 },
];

import { MUMBAI_MMR_HOSPITALS } from '../../data/mumbaiHospitals';

const DEFAULT_LOCAL_HOSPITALS = MUMBAI_MMR_HOSPITALS;


export function PatientPortal({
  onTriggerSOS,
  isComputing,
  lastResult,
  activeDispatchId,
  onReset,
  userLocation,
  onLocateMe,
}: PatientPortalProps) {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const { hospitals } = useHospitals();
  const [voiceActive, setVoiceActive] = useState(true);
  const [showFirstAid, setShowFirstAid] = useState(false);
  const [activeTab, setActiveTab] = useState<'hospital' | 'specialist' | 'medicine'>('hospital');
  const [searchQuery, setSearchQuery] = useState('');

  // Voice confirmation
  const speakConfirmation = (text: string) => {
    if (!voiceActive || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
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

  const handleSpecialistRoute = (spec: SpecialistOption) => {
    speakConfirmation(`Routing to nearest hospital with ${spec.name}.`);
    onTriggerSOS(spec.urgency, spec.specialty);
  };

  const handleMedicineRoute = (med: MedicineItem) => {
    speakConfirmation(`Routing to facility with ${med.name}.`);
    onTriggerSOS(med.urgency, undefined, med.name);
  };

  const isDispatched = !!activeDispatchId || !!lastResult;

  const activeHospitalList = hospitals.length > 0 ? hospitals : DEFAULT_LOCAL_HOSPITALS;
  const filteredHospitals = activeHospitalList.filter((h) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = h.name.toLowerCase().includes(q);
    const tierMatch = h.tier.toLowerCase().includes(q);
    const locationMatch = (h as any).location?.toLowerCase()?.includes(q);
    const areaMatch = (h as any).administrativeArea?.toLowerCase()?.includes(q);
    return nameMatch || tierMatch || locationMatch || areaMatch;
  });

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
            {/* ── 1. Minimal Header ── */}
            <header className="patient-portal__header">
              <div className="patient-portal__header-left">
                <div className="patient-portal__header-status">
                  <span className="patient-portal__status-dot" />
                  <h1 className="patient-portal__heading">Emergency SOS</h1>
                </div>
                <div className="patient-portal__sub-location">
                  <MapPin size={12} className={userLocation?.isLiveGPS ? 'text-emerald-600' : 'text-slate-400'} />
                  <span className="truncate max-w-[190px]">
                    {userLocation?.address || profile.villageName || 'Live GPS Sector (India)'}
                  </span>
                  {onLocateMe && (
                    <button
                      type="button"
                      onClick={onLocateMe}
                      className="ml-1.5 px-2 py-0.5 text-3xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full flex items-center gap-1 transition-all border border-emerald-200"
                      title="Sync Live GPS Position"
                    >
                      <Crosshair size={10} className={userLocation?.isLocating ? 'animate-spin' : ''} />
                      <span>{userLocation?.isLiveGPS ? (userLocation.accuracy ? `±${userLocation.accuracy}m GPS` : 'GPS Live') : 'Sync GPS'}</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={`patient-portal__icon-btn ${voiceActive ? 'patient-portal__icon-btn--active' : ''}`}
                onClick={() => setVoiceActive(!voiceActive)}
                title={voiceActive ? 'Mute Voice' : 'Unmute Voice'}
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
                  <Building2 size={13} />
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
                  <Stethoscope size={13} />
                  <span>Specialists</span>

                </button>
                <button
                  type="button"
                  className={`patient-portal__tab-btn ${activeTab === 'medicine' ? 'patient-portal__tab-btn--active' : ''}`}
                  onClick={() => {
                    setActiveTab('medicine');
                    setSearchQuery('');
                  }}
                >
                  <Pill size={13} />
                  <span>Medicines</span>
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
                    <div key={h.id} className="patient-portal__row">
                      <div className="patient-portal__row-left">
                        <div className="patient-portal__row-header">
                          <span className="patient-portal__row-title">{h.name}</span>
                          <span className="patient-portal__tag">{h.tier}</span>
                        </div>
                        <div className="patient-portal__row-meta">
                          <span className="patient-portal__bed-text">
                            <Bed size={11} /> {h.bedsAvailable} Beds Ready
                          </span>
                          <span className="patient-portal__bullet">•</span>
                          <span className="patient-portal__spec-text">{h.specialties.slice(0, 2).join(', ')}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="patient-portal__btn-action"
                        onClick={() => onTriggerSOS(1)}
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

/* ── PatientPortal — High-Accessibility Emergency SOS Portal (Full-Height Layout) ── */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  PhoneCall,
  Ambulance,
  HeartPulse,
  Activity,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import type { UrgencyTier, Specialty } from '../../db/schema';
import type { RouteResult } from '../../workers/types';
import { formatTime, formatDistance } from '../../utils/geo';
import './PatientPortal.css';

interface PatientPortalProps {
  onTriggerSOS: (urgency: UrgencyTier, specialty?: Specialty) => void;
  isComputing: boolean;
  lastResult: RouteResult | null;
  activeDispatchId?: number;
}

interface TriageOption {
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  specialty: Specialty;
  urgency: UrgencyTier;
  color: string;
}

const TRIAGE_OPTIONS: TriageOption[] = [
  {
    id: 'cardiac',
    label: 'Heart / Breathing',
    subLabel: 'छातीत दुखणे / श्वास त्रास',
    icon: '🫀',
    specialty: 'cardiology',
    urgency: 1,
    color: '#D32F2F',
  },
  {
    id: 'trauma',
    label: 'Accident / Bleeding',
    subLabel: 'अपघात / रक्तस्त्राव',
    icon: '🩸',
    specialty: 'emergency',
    urgency: 1,
    color: '#E65100',
  },
  {
    id: 'maternity',
    label: 'Pregnancy Labor',
    subLabel: 'प्रसूती वेदना',
    icon: '🤰',
    specialty: 'obstetrics',
    urgency: 2,
    color: '#7B1FA2',
  },
  {
    id: 'fracture',
    label: 'Bone Fracture',
    subLabel: 'हाड मोडणे / दुखापत',
    icon: '🦴',
    specialty: 'orthopedics',
    urgency: 2,
    color: '#0288D1',
  },
  {
    id: 'stroke',
    label: 'Stroke / Paralysis',
    subLabel: 'पक्षाघात / भोवळ',
    icon: '🧠',
    specialty: 'neurology',
    urgency: 1,
    color: '#C2185B',
  },
  {
    id: 'fever',
    label: 'Severe Infection',
    subLabel: 'तीव्र ताप / विषबाधा',
    icon: '🤒',
    specialty: 'general',
    urgency: 3,
    color: '#388E3C',
  },
];

export function PatientPortal({
  onTriggerSOS,
  isComputing,
  lastResult,
}: PatientPortalProps) {
  const { profile, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [selectedTriage, setSelectedTriage] = useState<TriageOption | null>(null);
  const [sosDispatched, setSosDispatched] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showFirstAid, setShowFirstAid] = useState(false);

  // Audio Speech Synthesis function
  const speak = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  const handleQuickSOS = (triage?: TriageOption) => {
    const chosen = triage || TRIAGE_OPTIONS[0];
    setSelectedTriage(chosen);
    setSosDispatched(true);

    onTriggerSOS(chosen.urgency, chosen.specialty);

    const spokenPrompt =
      language === 'mr'
        ? `${profile.name} यांच्यासाठी तातडीची रुग्णवाहिका मागवली आहे. सर्वात जवळच्या हॉस्पिटलचा मार्ग शोधत आहे.`
        : language === 'hi'
        ? `${profile.name} के लिए आपातकालीन एम्बुलेंस बुलाई गई है। निकटतम अस्पताल का मार्ग खोजा जा रहा है।`
        : `Emergency alert activated for ${profile.name}. Finding fastest route to nearest hospital.`;

    speak(spokenPrompt);
  };

  const handleReset = () => {
    setSosDispatched(false);
    setSelectedTriage(null);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      updateProfile({ name: nameInput.trim() });
      try {
        localStorage.setItem('jeevraah_patient_name', nameInput.trim());
      } catch {
        // ignore
      }
    }
    setIsEditingName(false);
  };

  // Clean name without any trailing brackets
  const cleanName = (profile.name || '')
    .replace(/\(.*?\)/g, '')
    .replace(/[()]/g, '')
    .replace(/Dombivli.*/i, '')
    .trim() || (language === 'mr' ? 'रुग्ण' : language === 'hi' ? 'मरीज' : 'Patient');

  return (
    <div className="patient-portal" id="patient-portal">
      {/* ── 1. Patient Health ID Header ── */}
      <div className="patient-portal__card clay-card">
        <div className="patient-portal__id-bar">
          <div className="patient-portal__user-info">
            <div className="patient-portal__avatar">{profile.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    className="patient-portal__name-edit-input clay-card--inset"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                    }}
                    autoFocus
                  />
                  <button
                    className="clay-btn clay-btn--primary clay-btn--sm"
                    onClick={handleSaveName}
                    style={{ padding: '2px 8px', fontSize: 11 }}
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <h2
                  className="patient-portal__name flex items-center gap-1"
                  onClick={() => setIsEditingName(true)}
                  title="Click to edit name"
                >
                  <span className="truncate">{cleanName}</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>✏️</span>
                </h2>
              )}
              <p className="patient-portal__location">
                <MapPin size={12} /> {profile.villageName || 'Dombivli East (Manpada Rd)'} • {profile.phone || '+91 98330 54321'}
              </p>
            </div>
          </div>

          <div className="patient-portal__voice-toggle">
            <button
              className={`clay-btn clay-btn--icon ${voiceEnabled ? 'clay-btn--primary' : 'clay-btn--ghost'}`}
              onClick={() => {
                const next = !voiceEnabled;
                setVoiceEnabled(next);
                if (next) speak(language === 'mr' ? 'आवाज मार्गदर्शन चालू केले.' : 'Voice assistance active.');
              }}
              title={voiceEnabled ? 'Voice Assistance On' : 'Voice Assistance Off'}
            >
              {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!sosDispatched ? (
          /* Normal SOS Mode */
          <motion.div
            key="sos-mode"
            className="patient-portal__action-area"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* ── 2. Master Emergency SOS Button ── */}
            <button
              className="patient-portal__big-sos"
              onClick={() => handleQuickSOS(TRIAGE_OPTIONS[0])}
              id="patient-big-sos-btn"
            >
              <div className="patient-portal__big-sos-pulse" />
              <div className="patient-portal__big-sos-content">
                <div className="patient-portal__sos-icon-circle">
                  <HeartPulse size={28} className="patient-portal__sos-icon" />
                </div>
                <div className="patient-portal__sos-text-box">
                  <span className="patient-portal__sos-text">{t('masterSosBtn')}</span>
                  <span className="patient-portal__sos-sub">{t('masterSosSub')}</span>
                </div>
              </div>
            </button>

            {/* ── 3. Balanced 2-Column Pictorial Triage Cards ── */}
            <div className="patient-portal__triage-section">
              <h3 className="patient-portal__section-title">
                <Activity size={15} /> {t('selectEmergencyType')}
              </h3>

              <div className="patient-portal__triage-grid">
                {TRIAGE_OPTIONS.map((tr) => (
                  <button
                    key={tr.id}
                    className="patient-portal__triage-card clay-card--flat"
                    onClick={() => handleQuickSOS(tr)}
                    style={{ borderLeft: `4px solid ${tr.color}` }}
                  >
                    <span className="patient-portal__triage-emoji">{tr.icon}</span>
                    <div className="patient-portal__triage-details">
                      <strong className="patient-portal__triage-label">{tr.label}</strong>
                      <span className="patient-portal__triage-sub">{tr.subLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── 4. Live Emergency Readiness Card (Fills Full Height) ── */}
            <div className="patient-portal__readiness-card clay-card">
              <div className="flex items-center justify-between pb-2 border-b border-black/5">
                <span className="text-xs font-bold text-success flex items-center gap-1">
                  <ShieldCheck size={14} /> LIVE READINESS (DOMBIVLI SECTOR)
                </span>
                <span className="text-xs text-tertiary">A* Online</span>
              </div>

              <div className="patient-portal__readiness-list">
                <div className="patient-portal__readiness-item">
                  <div className="flex items-center gap-2">
                    <div className="patient-portal__mini-badge bg-danger-pale text-danger">🚑</div>
                    <div>
                      <strong className="text-xs">MH-05-EM-1080 (ALS Pilot)</strong>
                      <p className="text-2xs text-secondary">0.8 km • ~3 mins response time</p>
                    </div>
                  </div>
                  <span className="clay-badge clay-badge--success text-2xs font-black">STANDBY</span>
                </div>

                <div className="patient-portal__readiness-item">
                  <div className="flex items-center gap-2">
                    <div className="patient-portal__mini-badge bg-primary-pale text-primary">🏥</div>
                    <div>
                      <strong className="text-xs">AIMS Hospital & ICU</strong>
                      <p className="text-2xs text-secondary">14 ICU Beds • 24/7 Trauma Desk</p>
                    </div>
                  </div>
                  <span className="clay-badge clay-badge--info text-2xs font-black">OPEN</span>
                </div>

                <div className="patient-portal__readiness-item">
                  <div className="flex items-center gap-2">
                    <div className="patient-portal__mini-badge bg-warning-pale text-warning">🩸</div>
                    <div>
                      <strong className="text-xs">RR Multi-Specialty Blood Bank</strong>
                      <p className="text-2xs text-secondary">B+, O+, A+ Units In-Stock</p>
                    </div>
                  </div>
                  <span className="clay-badge clay-badge--success text-2xs font-black">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* ── 5. Offline Emergency First-Aid Guide Toggle ── */}
            <div className="patient-portal__firstaid-toggle-card clay-card--flat">
              <button
                type="button"
                className="patient-portal__firstaid-btn"
                onClick={() => setShowFirstAid(!showFirstAid)}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <span className="text-xs font-bold text-dark">
                    {language === 'mr' ? 'आपत्कालीन प्रथमोपचार टिप्स (Offline Guide)' : language === 'hi' ? 'आपातकालीन प्राथमिक उपचार (Offline Guide)' : 'Emergency First-Aid Quick Guide'}
                  </span>
                </div>
                <ChevronRight size={16} className={`text-tertiary transition-transform ${showFirstAid ? 'rotate-90' : ''}`} />
              </button>

              {showFirstAid && (
                <div className="patient-portal__firstaid-content mt-2 pt-2 border-t border-black/5 text-xs text-secondary flex flex-col gap-2">
                  <div className="p-2 rounded bg-black/2">
                    <strong className="text-dark block mb-1">🫀 CPR / श्वास थांबल्यास:</strong>
                    छातीच्या मध्यभागी ३० वेळा जोराने दाबा (100-120 प्रति मिनिट), २ वेळा कृत्रिम श्वास द्या.
                  </div>
                  <div className="p-2 rounded bg-black/2">
                    <strong className="text-dark block mb-1">🩸 Severe Bleeding / रक्तस्त्राव:</strong>
                    जखमेवर स्वच्छ कापडाने थेट दाब द्या आणि जखमी भाग हृदयाच्या वर उचला.
                  </div>
                  <div className="p-2 rounded bg-black/2">
                    <strong className="text-dark block mb-1">🧘 Fainting / चक्कर:</strong>
                    रुग्णाला पाठीवर झोपवून पाय थोडे वर उचला आणि हवा येऊ द्या.
                  </div>
                </div>
              )}
            </div>

            {/* ── 6. Emergency Helpline Banner ── */}
            <div className="patient-portal__hotline clay-card--inset">
              <PhoneCall size={16} className="text-danger" />
              <div>
                <strong>National Toll-Free Helpline: 108 / 112</strong>
                <p className="text-xs text-tertiary">Direct offline satellite & local emergency relay</p>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Active Emergency Dispatched Screen */
          <motion.div
            key="dispatched-mode"
            className="patient-portal__dispatched"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            {isComputing ? (
              <div className="patient-portal__computing clay-card">
                <div className="pulse-dot pulse-dot--danger" style={{ width: 20, height: 20 }} />
                <h3 className="text-sm font-bold mt-2">{t('findingRoute')}</h3>
                <p className="text-xs text-secondary">A* algorithm finding fastest road route</p>
              </div>
            ) : lastResult ? (
              <div className="patient-portal__active-card clay-card">
                <div className="patient-portal__active-header">
                  <span className="clay-badge clay-badge--danger font-bold text-xs">
                    <Ambulance size={14} /> {t('dispatchedStatus')}
                  </span>
                  <button
                    className="patient-portal__audio-repeat clay-btn clay-btn--icon"
                    onClick={() =>
                      speak(
                        `Ambulance is en route to ${lastResult.hospitalName}. Estimated arrival time is ${formatTime(
                          lastResult.totalTime
                        )}.`
                      )
                    }
                    title="Listen status"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>

                {selectedTriage && (
                  <span className="clay-badge clay-badge--warning text-xs">
                    Condition: {selectedTriage.icon} {selectedTriage.label}
                  </span>
                )}

                <div className="patient-portal__radar">
                  <div className="patient-portal__radar-circle patient-portal__radar-circle--3" />
                  <div className="patient-portal__radar-circle patient-portal__radar-circle--2" />
                  <div className="patient-portal__radar-circle patient-portal__radar-circle--1" />
                  <Ambulance size={28} className="patient-portal__radar-amb" />
                </div>

                <div className="patient-portal__eta-box">
                  <span className="text-xs text-secondary font-bold uppercase">{t('estimatedArrival')}</span>
                  <div className="patient-portal__eta-num text-success">
                    <Clock size={24} /> {formatTime(lastResult.totalTime)}
                  </div>
                  <span className="text-xs text-tertiary">{t('distance')}: {formatDistance(lastResult.totalDistance)}</span>
                </div>

                {/* 🚑 Assigned 108 Ambulance Pilot Card */}
                <div className="patient-portal__driver-card clay-card--flat">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="patient-portal__avatar" style={{ width: 34, height: 34, fontSize: 18 }}>🚑</div>
                      <div>
                        <strong className="text-xs font-bold">Santosh Shinde (108 Pilot)</strong>
                        <p className="text-xs text-secondary">MH-05-EM-1080 (ALS)</p>
                      </div>
                    </div>
                    <span className="clay-badge clay-badge--danger text-xs font-black">EN ROUTE</span>
                  </div>

                  <a
                    href="tel:9820011080"
                    className="clay-btn clay-btn--danger clay-btn--md w-full flex items-center justify-center gap-2 mt-2"
                    style={{ textDecoration: 'none', fontWeight: 800, fontSize: 12, padding: '8px 12px' }}
                  >
                    <PhoneCall size={14} />
                    <span>{language === 'mr' ? 'चालकाशी थेट बोला (+91 98200 11080)' : language === 'hi' ? 'एम्बुलेंस चालक को कॉल करें (+91 98200 11080)' : 'CALL AMBULANCE PILOT (+91 98200 11080)'}</span>
                  </a>
                </div>

                <div className="patient-portal__hospital-assigned clay-card--inset">
                  <div className="patient-portal__hosp-info">
                    <strong className="text-sm font-bold">{lastResult.hospitalName}</strong>
                    <span className="text-xs text-secondary">{t('assignedFacility')}</span>
                  </div>
                  <CheckCircle2 size={20} className="text-success" />
                </div>

                {/* First Aid tips */}
                <div className="patient-portal__first-aid">
                  <h4 className="text-xs font-bold flex items-center gap-1">
                    <Sparkles size={12} className="text-warning" /> {t('whileYouWait')}
                  </h4>
                  <ul className="patient-portal__first-aid-list text-xs">
                    <li>• {t('tip1')}</li>
                    <li>• {t('tip2')}</li>
                    <li>• {t('tip3')}</li>
                  </ul>
                </div>

                <button
                  className="clay-btn clay-btn--md clay-btn--secondary w-full"
                  onClick={handleReset}
                >
                  {t('closeAndNew')}
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

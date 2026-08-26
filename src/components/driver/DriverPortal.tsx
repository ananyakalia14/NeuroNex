/* ── DriverPortal — Sleek Ultra-Clean 108 Ambulance Cockpit HUD ── */

import { useState, useEffect } from 'react';
import {
  Ambulance,
  Navigation,
  Volume2,
  VolumeX,
  PhoneCall,
  Flame,
  CheckCircle2,
  Gauge,
  Clock,
  Radio,
  Building2,
  User,
  HeartPulse,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Dispatch } from '../../db/schema';
import type { RouteResult } from '../../workers/types';
import { formatTime, formatDistance } from '../../utils/geo';
import './DriverPortal.css';

interface DriverPortalProps {
  activeDispatch?: Dispatch | null;
  lastRouteResult?: RouteResult | null;
  onUpdateStatus?: (status: 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED') => void;
}

export function DriverPortal({
  activeDispatch,
  lastRouteResult,
  onUpdateStatus,
}: DriverPortalProps) {
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [sirenOn, setSirenOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(54);
  const [missionStep, setMissionStep] = useState<'standby' | 'dispatched' | 'at_scene' | 'to_hospital'>('dispatched');

  // Sync with active dispatch
  useEffect(() => {
    if (activeDispatch) {
      if (activeDispatch.status === 'DISPATCHED' || activeDispatch.status === 'PENDING') {
        setMissionStep('dispatched');
      } else if (activeDispatch.status === 'EN_ROUTE') {
        setMissionStep('dispatched');
      } else if (activeDispatch.status === 'ARRIVED') {
        setMissionStep('at_scene');
      }
    } else {
      setMissionStep('dispatched');
    }
  }, [activeDispatch]);

  // Voice speech synthesis
  const speak = (text: string) => {
    if (!voiceOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore
    }
  };

  // Speedometer fluctuation simulation
  useEffect(() => {
    if (missionStep !== 'standby') {
      const interval = setInterval(() => {
        setCurrentSpeed(Math.floor(48 + Math.random() * 18));
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setCurrentSpeed(0);
    }
  }, [missionStep]);

  const handleStartNav = () => {
    setMissionStep('dispatched');
    onUpdateStatus?.('EN_ROUTE');
    const prompt =
      language === 'mr'
        ? 'मार्गक्रमण सुरू केले. कल्याण-शीळ रस्त्याने रुग्णाकडे जात आहोत.'
        : language === 'hi'
        ? 'नेविगेशन शुरू हुआ। कल्याण-शील रोड से मरीज की ओर जा रहे हैं।'
        : 'Navigation started. En route to patient location on Kalyan-Shilphata Road.';
    speak(prompt);
  };

  const handleReachedScene = () => {
    setMissionStep('at_scene');
    onUpdateStatus?.('ARRIVED');
    const prompt =
      language === 'mr'
        ? 'रुग्णाजवळ पोहोचलो. प्रथमोपचार व स्ट्रेचर सज्ज.'
        : language === 'hi'
        ? 'मरीज के पास पहुंचे। फर्स्ट एड और स्ट्रेचर तैयार।'
        : 'Reached scene. Patient being secured onto stretcher.';
    speak(prompt);
  };

  const handleEnRouteHospital = () => {
    setMissionStep('to_hospital');
    onUpdateStatus?.('EN_ROUTE');
    const prompt =
      language === 'mr'
        ? 'रुग्ण सुरक्षित. एम्स हॉस्पिटल आपत्कालीन कक्षाकडे निघालो.'
        : language === 'hi'
        ? 'मरीज सुरक्षित। एम्स अस्पताल इमरजेंसी की ओर रवाना।'
        : 'Patient secured. En route to AIMS Hospital Trauma ER.';
    speak(prompt);
  };

  const handleCompleteMission = () => {
    setMissionStep('standby');
    onUpdateStatus?.('COMPLETED');
    const prompt =
      language === 'mr'
        ? 'रुग्ण दाखल पूर्ण. रुग्णवाहिका पुढील आपत्कालीन कॉलसाठी मोकळी आहे.'
        : language === 'hi'
        ? 'मरीज भर्ती संपन्न। एम्बुलेंस अगली कॉल के लिए तैयार है।'
        : 'Patient handover complete. Ambulance ready on standby.';
    speak(prompt);
  };

  const patientPhone = activeDispatch?.patientPhone || '+91 98330 54321';
  const patientName = activeDispatch?.patientName || 'Emergency Patient (Dombivli East)';

  return (
    <div className="driver-portal" id="driver-portal">
      {/* ── 1. Compact Pilot Header Strip ── */}
      <div className="driver-portal__header-card clay-card">
        <div className="driver-portal__header-left">
          <div className="driver-portal__amb-icon">
            <Ambulance size={22} className={sirenOn && missionStep !== 'standby' ? 'animate-bounce text-danger' : ''} />
          </div>
          <div className="driver-portal__veh-details">
            <div className="flex items-center gap-2">
              <span className="driver-portal__veh-num">{profile.vehicleNumber || 'MH-05-EM-1080'}</span>
              <span className="driver-portal__badge-als">{profile.vehicleType || 'ALS'}</span>
            </div>
            <span className="driver-portal__pilot-sub">
              <User size={12} /> {profile.name} • Dombivli Base
            </span>
          </div>
        </div>

        <div className="driver-portal__header-controls">
          <button
            type="button"
            className={`driver-portal__ctrl-btn ${sirenOn ? 'driver-portal__ctrl-btn--siren-on' : ''}`}
            onClick={() => setSirenOn(!sirenOn)}
            title={sirenOn ? t('sirenActive') : t('sirenInactive')}
          >
            <Flame size={16} />
          </button>

          <button
            type="button"
            className={`driver-portal__ctrl-btn ${voiceOn ? 'driver-portal__ctrl-btn--voice-on' : ''}`}
            onClick={() => setVoiceOn(!voiceOn)}
            title="Voice GPS Guidance"
          >
            {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      {/* ── 2. Turn Maneuver Banner ── */}
      {missionStep !== 'standby' && (
        <div className="driver-portal__turn-banner">
          <div className="driver-portal__turn-icon">
            <Navigation size={22} className="driver-portal__turn-arrow" />
          </div>
          <div className="driver-portal__turn-info">
            <span className="driver-portal__turn-dist">IN 180 METERS</span>
            <strong className="driver-portal__turn-street">
              Turn Left on Kalyan-Shilphata Rd (MIDC)
            </strong>
          </div>
        </div>
      )}

      {/* ── 3. Live Telemetry Metrics Row ── */}
      {missionStep !== 'standby' && (
        <div className="driver-portal__metrics-row">
          <div className="driver-portal__metric-pill clay-card--inset">
            <span className="driver-portal__metric-tag">
              <Gauge size={12} /> {t('currentSpeed')}
            </span>
            <div className="driver-portal__metric-val text-danger">
              {currentSpeed} <small>km/h</small>
            </div>
          </div>

          <div className="driver-portal__metric-pill clay-card--inset">
            <span className="driver-portal__metric-tag">
              <Clock size={12} /> {missionStep === 'to_hospital' ? t('etaHospital') : t('etaPatient')}
            </span>
            <div className="driver-portal__metric-val text-success">
              {lastRouteResult ? formatTime(lastRouteResult.totalTime) : '4 mins'}
            </div>
          </div>

          <div className="driver-portal__metric-pill clay-card--inset">
            <span className="driver-portal__metric-tag">
              <Radio size={12} /> {t('distance')}
            </span>
            <div className="driver-portal__metric-val text-primary">
              {lastRouteResult ? formatDistance(lastRouteResult.totalDistance) : '2.8 km'}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Active Mission Details Card ── */}
      {missionStep !== 'standby' ? (
        <div className="driver-portal__mission-card clay-card">
          <div className="driver-portal__mission-header">
            <span className="clay-badge clay-badge--danger flex items-center gap-1 font-bold text-xs">
              <HeartPulse size={13} /> {t('activeMission')}
            </span>
            <span className="driver-portal__gps-tag">● LIVE GPS LOCKED</span>
          </div>

          <div className="driver-portal__info-grid">
            {/* Patient Name */}
            <div className="driver-portal__info-item">
              <span className="driver-portal__info-label">
                <User size={13} /> {language === 'mr' ? 'रुग्णाचे नाव' : language === 'hi' ? 'मरीज का नाम' : 'Patient Name'}
              </span>
              <strong className="driver-portal__info-value">{patientName}</strong>
            </div>

            {/* Patient Mobile */}
            <div className="driver-portal__info-item">
              <span className="driver-portal__info-label">
                <PhoneCall size={13} /> {language === 'mr' ? 'रुग्ण मोबाईल' : language === 'hi' ? 'मरीज का मोबाइल' : 'Patient Mobile'}
              </span>
              <strong className="driver-portal__info-value text-danger font-black">{patientPhone}</strong>
            </div>

            {/* Location */}
            <div className="driver-portal__info-item">
              <span className="driver-portal__info-label">
                <MapPin size={13} /> {t('patientLocation')}
              </span>
              <span className="driver-portal__info-text">
                Dombivli East, Manpada Road (Near Gharda Circle)
              </span>
            </div>

            {/* Destination Hospital */}
            <div className="driver-portal__info-item">
              <span className="driver-portal__info-label">
                <Building2 size={13} /> {t('destHospital')}
              </span>
              <strong className="driver-portal__info-value text-primary">
                {lastRouteResult?.hospitalName || 'AIMS Hospital & ICU (Dombivli)'}
              </strong>
            </div>
          </div>

          {/* Direct Calling Hotline Stack */}
          <div className="driver-portal__hotline-stack">
            <a
              href={`tel:${patientPhone.replace(/\D/g, '')}`}
              className="driver-portal__action-call-btn driver-portal__action-call-btn--patient"
            >
              <PhoneCall size={16} />
              <span>{language === 'mr' ? `रुग्णाला कॉल करा (${patientPhone})` : language === 'hi' ? `मरीज को कॉल करें (${patientPhone})` : `CALL PATIENT (${patientPhone})`}</span>
            </a>

            <a
              href="tel:02512475000"
              className="driver-portal__action-call-btn driver-portal__action-call-btn--hospital"
            >
              <Building2 size={16} />
              <span>{language === 'mr' ? 'हॉस्पिटल आपत्कालीन कक्ष (+91 251 247 5000)' : 'CALL HOSPITAL ER (+91 251 247 5000)'}</span>
            </a>
          </div>

          {/* Mission Progress Action Button */}
          <div className="driver-portal__stage-action mt-2">
            {missionStep === 'dispatched' && (
              <button
                type="button"
                className="clay-btn clay-btn--primary clay-btn--lg w-full flex items-center justify-center gap-2"
                onClick={handleReachedScene}
                id="driver-reached-patient-btn"
              >
                <CheckCircle2 size={20} />
                <span>{t('reachedPatientBtn')}</span>
              </button>
            )}

            {missionStep === 'at_scene' && (
              <button
                type="button"
                className="clay-btn clay-btn--danger clay-btn--lg w-full flex items-center justify-center gap-2"
                onClick={handleEnRouteHospital}
                id="driver-to-hospital-btn"
              >
                <Navigation size={20} />
                <span>{t('enRouteHospBtn')}</span>
              </button>
            )}

            {missionStep === 'to_hospital' && (
              <button
                type="button"
                className="clay-btn clay-btn--primary clay-btn--lg w-full flex items-center justify-center gap-2"
                onClick={handleCompleteMission}
                id="driver-complete-btn"
              >
                <Sparkles size={20} />
                <span>{t('handoverCompleteBtn')}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Standby Card */
        <div className="driver-portal__standby-card clay-card">
          <Radio size={40} className="text-success animate-pulse" />
          <h3 className="text-base font-black mt-2 mb-1">{t('noActiveMission')}</h3>
          <p className="text-xs text-secondary text-center">
            Ambulance unit ready. Listening for incoming emergency dispatches across Dombivli & Kalyan.
          </p>

          <button
            type="button"
            className="clay-btn clay-btn--danger clay-btn--lg w-full mt-3 flex items-center justify-center gap-2"
            onClick={handleStartNav}
          >
            <Ambulance size={18} />
            <span>{t('acceptCallBtn')}</span>
          </button>
        </div>
      )}

      {/* ── 5. Equipment Status Strip ── */}
      <div className="driver-portal__gear-strip clay-card">
        <div className="driver-portal__gear-row">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">{t('oxygenGauge')}:</span>
            <span className="clay-badge clay-badge--success text-xs font-black">94% (2,100 PSI)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold">{t('stretcherCheck')}:</span>
            <CheckCircle2 size={16} className="text-success" />
          </div>
        </div>
      </div>
    </div>
  );
}

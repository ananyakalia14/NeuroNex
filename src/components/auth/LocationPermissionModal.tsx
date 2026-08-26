/* ── LocationPermissionModal — Ultra-Fast (Sub-Millisecond Instant) Emergency Access ── */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Navigation,
  Volume2,
  X,
  User,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { reverseGeocodeIndia, ensureLocalEmergencyInfrastructure } from '../../utils/indiaEmergency';
import './LocationPermissionModal.css';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationPermissionModal({ isOpen, onClose }: LocationModalProps) {
  const { loginAsPatient, updateProfile } = useAuth();
  const { t, language } = useLanguage();
  const [patientName, setPatientName] = useState(() => {
    try {
      return localStorage.getItem('jeevraah_patient_name') || '';
    } catch {
      return '';
    }
  });
  const [patientPhone, setPatientPhone] = useState(() => {
    try {
      return localStorage.getItem('jeevraah_patient_phone') || '';
    } catch {
      return '';
    }
  });

  // Play voice prompt
  const playVoicePrompt = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const prompt =
        language === 'mr'
          ? 'आपत्कालीन रुग्णवाहिका मागवण्यासाठी लोकेशन चालू करा.'
          : language === 'hi'
          ? 'आपातकालीन एम्बुलेंस बुलाने के लिए लोकेशन चालू करें.'
          : 'Please allow location access for instant ambulance dispatch.';
      const utterance = new SpeechSynthesisUtterance(prompt);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ⚡ ULTRA-FAST SUB-MILLISECOND INSTANT LOGIN
  const handleRequestGPS = () => {
    // 1. Instant Phone & Name resolution (< 1ms)
    const rawPhone = patientPhone.trim();
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const formattedPhone = cleanDigits.length >= 10
      ? (cleanDigits.startsWith('91') && cleanDigits.length === 12 ? `+${cleanDigits}` : `+91 ${cleanDigits.slice(-10)}`)
      : (rawPhone || '+91 98330 54321');

    const chosenName = patientName.trim() || (language === 'mr' ? 'रुग्ण' : language === 'hi' ? 'मरीज' : 'Patient');
    const cleanName = chosenName.replace(/[()]/g, '').trim() || 'Patient';

    try {
      if (patientName.trim()) localStorage.setItem('jeevraah_patient_name', patientName.trim());
      localStorage.setItem('jeevraah_patient_phone', formattedPhone);
    } catch {
      // ignore
    }

    // 2. Read cached GPS if available for instant 0ms launch
    let initLat = 19.2183;
    let initLng = 73.0867;
    try {
      const savedLat = localStorage.getItem('jeevraah_patient_lat');
      const savedLng = localStorage.getItem('jeevraah_patient_lng');
      if (savedLat && savedLng) {
        initLat = parseFloat(savedLat);
        initLng = parseFloat(savedLng);
      }
    } catch {
      // ignore
    }

    // ⚡ 3. INSTANT ZERO-DELAY TRANSITION TO DASHBOARD (< 20ms)
    loginAsPatient(20, cleanName, formattedPhone, 'Live GPS Sector (India)', initLat, initLng);
    onClose();

    // 4. Background GPS Refinement (Non-Blocking)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          try {
            localStorage.setItem('jeevraah_patient_lat', lat.toString());
            localStorage.setItem('jeevraah_patient_lng', lng.toString());
          } catch {
            // ignore
          }

          try {
            const locInfo = await reverseGeocodeIndia(lat, lng);
            const { patientNodeId } = await ensureLocalEmergencyInfrastructure(lat, lng, locInfo);
            updateProfile({
              villageNodeId: patientNodeId,
              villageName: locInfo.fullAddress,
              lat,
              lng,
            });
          } catch (err) {
            console.warn('Background GPS update fallback:', err);
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="loc-modal__backdrop" onClick={onClose}>
        <motion.div
          className="loc-modal__card clay-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button className="loc-modal__close clay-btn clay-btn--icon" onClick={onClose}>
            <X size={18} />
          </button>

          {/* Large Icon Header */}
          <div className="loc-modal__icon-wrapper">
            <div className="loc-modal__icon-halo" />
            <div className="loc-modal__icon-circle">
              <MapPin size={42} className="text-danger" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="loc-modal__text-group">
            <h2 className="loc-modal__title">{t('allowLocationTitle')}</h2>
            <p className="loc-modal__subtitle">{t('allowLocationSub')}</p>
            <p className="loc-modal__desc">{t('allowLocationDesc')}</p>
          </div>

          {/* Inputs Section */}
          <div className="loc-modal__inputs-wrapper w-full flex flex-col gap-2">
            {/* Dynamic Patient Name Input */}
            <div className="loc-modal__name-box">
              <label className="loc-modal__name-label">
                <User size={13} /> {language === 'mr' ? 'आपले नाव (ऐच्छिक)' : language === 'hi' ? 'आपका नाम (वैकल्पिक)' : 'Your Name (Optional)'}
              </label>
              <input
                type="text"
                className="loc-modal__name-input clay-card--inset"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder={language === 'mr' ? 'उदा. राहुल शर्मा' : language === 'hi' ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
              />
            </div>

            {/* Patient Mobile Number Input */}
            <div className="loc-modal__name-box">
              <label className="loc-modal__name-label">
                <Phone size={13} />{' '}
                <strong>
                  {language === 'mr' ? 'मोबाईल नंबर (चालकाशी संपर्कासाठी)' : language === 'hi' ? 'मोबाइल नंबर (चालक से संपर्क के लिए)' : 'Mobile Number (for Driver)'}
                </strong>
              </label>
              <input
                type="tel"
                className="loc-modal__name-input clay-card--inset"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                placeholder="e.g. 98330 54321"
                maxLength={14}
              />
            </div>
          </div>

          {/* Voice Prompt Button */}
          <button
            type="button"
            className="loc-modal__voice-btn clay-badge clay-badge--info flex items-center gap-1"
            onClick={playVoicePrompt}
          >
            <Volume2 size={14} /> {t('listenVoice')}
          </button>

          {/* ⚡ INSTANT 1-TAP ALLOW BUTTON */}
          <div className="loc-modal__actions">
            <button
              className="loc-modal__big-allow-btn clay-btn clay-btn--danger"
              onClick={handleRequestGPS}
              id="modal-allow-location-btn"
            >
              <div className="loc-modal__btn-content">
                <Navigation size={24} className="loc-modal__btn-nav-icon" />
                <span className="loc-modal__btn-text">{t('allowLocationBtn')}</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

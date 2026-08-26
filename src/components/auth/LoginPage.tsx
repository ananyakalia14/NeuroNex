/* ── LoginPage — Quad Access Portal (Patient SOS, Driver Cockpit, Hospital Staff & Admin) ── */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  HeartPulse,
  Building2,
  ShieldCheck,
  Ambulance,
  ArrowRight,
  Lock,
  User,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { LocationPermissionModal } from './LocationPermissionModal';
import './LoginPage.css';

const DEMO_AMBULANCES = [
  { id: 0, vehNum: 'MH-05-EM-1080', type: 'ALS', base: 'AIMS Hospital (Dombivli)' },
  { id: 1, vehNum: 'MH-05-EM-1081', type: 'BLS', base: 'Shastri Nagar Hospital (Dombivli W)' },
  { id: 2, vehNum: 'MH-05-EM-1082', type: 'ALS', base: 'Fortis Hospital (Kalyan)' },
  { id: 3, vehNum: 'MH-05-EM-1083', type: 'DH-ALS', base: 'CSMH Hospital (Kalwa Thane)' },
];

const DEMO_HOSPITALS = [
  { id: 0, name: 'AIMS Hospital & ICU (MIDC Dombivli)', tier: 'DH' },
  { id: 1, name: 'Shastri Nagar Civic Hospital (Dombivli West)', tier: 'CHC' },
  { id: 2, name: 'RR Multi-Specialty Hospital (Dombivli East)', tier: 'SDH' },
  { id: 3, name: 'Fortis Super-Specialty Hospital (Kalyan)', tier: 'DH' },
  { id: 4, name: 'Chhatrapati Shivaji Maharaj Hospital (Kalwa, Thane)', tier: 'DH' },
];

export function LoginPage() {
  const { loginAsHospital, loginAsAdmin, loginAsDriver } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'driver' | 'hospital' | 'admin'>('driver');
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);

  // Driver form state
  const [selectedAmbId, setSelectedAmbId] = useState(0);
  const [driverName, setDriverName] = useState('Santosh Shinde');
  const [driverPass, setDriverPass] = useState('pilot123');

  // Hospital form state
  const [selectedHospitalId, setSelectedHospitalId] = useState(0);
  const [doctorName, setDoctorName] = useState('Dr. Suhas Kulkarni');
  const [doctorPass, setDoctorPass] = useState('doctor123');

  // Admin form state
  const [adminName, setAdminName] = useState('Commander Vikram Rao');
  const [adminPass, setAdminPass] = useState('admin123');

  const handlePatientDirect = () => {
    setIsLocModalOpen(true);
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = DEMO_AMBULANCES.find((a) => a.id === selectedAmbId) || DEMO_AMBULANCES[0];
    loginAsDriver(chosen.id, driverName, chosen.vehNum);
  };

  const handleHospitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsHospital(selectedHospitalId, doctorName);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsAdmin(adminName);
  };

  return (
    <div className="login-page">
      {/* Ambient background glows */}
      <div className="login-page__glow login-page__glow--green" />
      <div className="login-page__glow login-page__glow--blue" />

      {/* Top Floating Language Switcher */}
      <div className="login-page__top-bar">
        <LanguageSelector />
      </div>

      <div className="login-page__container">
        {/* Brand Header */}
        <div className="login-page__brand">
          <img src="/logo.png" alt="JeevaRaah" className="login-page__logo" />
        </div>

        {/* ══════════════════════════════════════════════════════════
            1. HERO OPTION: "I AM A PATIENT" (1-Tap Direct Redirect)
            ══════════════════════════════════════════════════════════ */}
        <motion.div
          className="login-page__patient-box clay-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button
            className="login-page__patient-btn clay-btn clay-btn--danger clay-btn--xl"
            onClick={handlePatientDirect}
            id="login-as-patient-btn"
          >
            <div className="login-page__patient-btn-content">
              <div className="login-page__patient-icon-circle">
                <HeartPulse size={36} />
              </div>
              <div className="login-page__patient-text">
                <span className="login-page__patient-title">{t('iAmPatient')}</span>
                <span className="login-page__patient-subtitle">{t('patientSub')}</span>
              </div>
            </div>
            <ArrowRight size={28} className="login-page__patient-arrow" />
          </button>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════
            2. PERSONNEL & OPERATIONAL ACCESS (Driver, Hospital, Admin)
            ══════════════════════════════════════════════════════════ */}
        <motion.div
          className="login-page__staff-box clay-card"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="login-page__staff-title-row">
            <h2 className="login-page__staff-title">{t('staffPortalTitle')}</h2>
            <span className="text-xs text-tertiary">{t('staffSub')}</span>
          </div>

          {/* Role Tabs */}
          <div className="login-page__tabs">
            <button
              type="button"
              className={`login-page__tab ${activeTab === 'driver' ? 'login-page__tab--active' : ''}`}
              onClick={() => setActiveTab('driver')}
            >
              <Ambulance size={16} /> {t('tabDriver')}
            </button>
            <button
              type="button"
              className={`login-page__tab ${activeTab === 'hospital' ? 'login-page__tab--active' : ''}`}
              onClick={() => setActiveTab('hospital')}
            >
              <Building2 size={16} /> {t('tabHospital')}
            </button>
            <button
              type="button"
              className={`login-page__tab ${activeTab === 'admin' ? 'login-page__tab--active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <ShieldCheck size={16} /> {t('tabAdmin')}
            </button>
          </div>

          {/* Driver Login Form */}
          {activeTab === 'driver' && (
            <form className="login-page__form" onSubmit={handleDriverSubmit}>
              <div className="login-page__field">
                <label className="login-page__label">
                  <Ambulance size={14} /> {t('selectAmbulance')}
                </label>
                <select
                  className="login-page__select clay-card--inset"
                  value={selectedAmbId}
                  onChange={(e) => setSelectedAmbId(parseInt(e.target.value))}
                >
                  {DEMO_AMBULANCES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.vehNum} ({a.type} - {a.base})
                    </option>
                  ))}
                </select>
              </div>

              <div className="login-page__field">
                <label className="login-page__label">
                  <User size={14} /> {t('driverName')}
                </label>
                <input
                  type="text"
                  className="login-page__input clay-card--inset"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. Santosh Shinde"
                  required
                />
              </div>

              <div className="login-page__field">
                <label className="login-page__label">
                  <Lock size={14} /> {t('passcode')}
                </label>
                <input
                  type="password"
                  className="login-page__input clay-card--inset"
                  value={driverPass}
                  onChange={(e) => setDriverPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="clay-btn clay-btn--danger clay-btn--lg w-full"
                id="login-driver-submit-btn"
              >
                <Ambulance size={18} /> {t('loginDriverBtn')}
              </button>
            </form>
          )}

          {/* Hospital Login Form */}
          {activeTab === 'hospital' && (
            <form className="login-page__form" onSubmit={handleHospitalSubmit}>
              <div className="login-page__field">
                <label className="login-page__label">
                  <Building2 size={14} /> {t('selectHospital')}
                </label>
                <select
                  className="login-page__select clay-card--inset"
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(parseInt(e.target.value))}
                >
                  {DEMO_HOSPITALS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="login-page__field">
                <label className="login-page__label">
                  <User size={14} /> {t('doctorName')}
                </label>
                <input
                  type="text"
                  className="login-page__input clay-card--inset"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Suhas Kulkarni"
                  required
                />
              </div>

              <div className="login-page__field">
                <label className="login-page__label">
                  <Lock size={14} /> {t('passcode')}
                </label>
                <input
                  type="password"
                  className="login-page__input clay-card--inset"
                  value={doctorPass}
                  onChange={(e) => setDoctorPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="clay-btn clay-btn--primary clay-btn--lg w-full"
                id="login-hospital-submit-btn"
              >
                <Building2 size={18} /> {t('loginHospitalBtn')}
              </button>
            </form>
          )}

          {/* Admin Login Form */}
          {activeTab === 'admin' && (
            <form className="login-page__form" onSubmit={handleAdminSubmit}>
              <div className="login-page__field">
                <label className="login-page__label">
                  <ShieldCheck size={14} /> {t('commanderName')}
                </label>
                <input
                  type="text"
                  className="login-page__input clay-card--inset"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Commander Vikram Rao"
                  required
                />
              </div>

              <div className="login-page__field">
                <label className="login-page__label">
                  <Lock size={14} /> {t('clearanceCode')}
                </label>
                <input
                  type="password"
                  className="login-page__input clay-card--inset"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="clay-btn clay-btn--primary clay-btn--lg w-full"
                id="login-admin-submit-btn"
              >
                <ShieldCheck size={18} /> {t('loginAdminBtn')}
              </button>
            </form>
          )}
        </motion.div>
      </div>

      {/* GPS Location Permission Popup */}
      <LocationPermissionModal
        isOpen={isLocModalOpen}
        onClose={() => setIsLocModalOpen(false)}
      />
    </div>
  );
}

/* ── Navbar — Top Navigation Bar with Role Switcher & Multi-Language Selector ── */

import { Wifi, WifiOff, Activity, Ambulance, BedDouble, UserCircle2, LogOut } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';
import { OfflineToggle } from './OfflineToggle';
import './Navbar.css';

interface NavbarProps {
  ambulanceIdle: number;
  ambulanceActive: number;
  totalBeds: number;
  pendingSyncs: number;
}

export function Navbar({ ambulanceIdle, ambulanceActive, totalBeds, pendingSyncs }: NavbarProps) {
  const { effectivelyOnline } = useOfflineStatus();
  const { profile, logout } = useAuth();
  const { t } = useLanguage();

  const roleBadgeStyle =
    profile.role === 'patient'
      ? 'clay-badge--success'
      : profile.role === 'hospital'
      ? 'clay-badge--info'
      : 'clay-badge--warning';

  return (
    <nav className="navbar" id="main-navbar">
      {/* Logo */}
      <div className="navbar__brand">
        <img src="/logo.png" alt="JeevaRaah" className="navbar__logo" />
        <div className="navbar__title-group">
          <h1 className="navbar__title">JeevaRaah</h1>
          <span className="navbar__subtitle">{t('tagline')}</span>
        </div>
      </div>

      {/* Telemetry Status Indicators */}
      <div className="navbar__status">
        <div className="navbar__stat" title="Free Ambulances">
          <Ambulance size={16} />
          <span className="navbar__stat-value">{ambulanceIdle}</span>
          <span className="navbar__stat-label">{t('freeAmb')}</span>
        </div>
        <div className="navbar__divider" />
        <div className="navbar__stat" title="Active Dispatches">
          <Activity size={16} />
          <span className="navbar__stat-value">{ambulanceActive}</span>
          <span className="navbar__stat-label">{t('activeAmb')}</span>
        </div>
        <div className="navbar__divider" />
        <div className="navbar__stat" title="Available Regional Beds">
          <BedDouble size={16} />
          <span className="navbar__stat-value">{totalBeds}</span>
          <span className="navbar__stat-label">{t('bedsAvailable')}</span>
        </div>
      </div>

      {/* Profile & Role Switcher + Language Selector + Offline Toggle */}
      <div className="navbar__actions">
        {pendingSyncs > 0 && (
          <div className="navbar__sync-badge clay-badge clay-badge--warning">
            {pendingSyncs} {t('queued')}
          </div>
        )}

        {/* Multi-Language Selector */}
        <LanguageSelector />

        {/* User Persona Switcher Button */}
        <button
          className="navbar__profile-btn clay-card--flat"
          onClick={logout}
          title={t('switchPortal')}
          id="navbar-profile-btn"
        >
          <span className="navbar__profile-avatar">{profile.avatar}</span>
          <div className="navbar__profile-text">
            <strong className="navbar__profile-name">{profile.name}</strong>
            <span className={`clay-badge ${roleBadgeStyle} navbar__role-badge`}>
              {profile.role.toUpperCase()}
            </span>
          </div>
          <UserCircle2 size={16} className="text-secondary navbar__profile-icon" />
        </button>

        {/* Logout / Switch Portal Button */}
        <button
          className="clay-btn clay-btn--icon"
          onClick={logout}
          title={t('switchPortal')}
          id="navbar-logout-btn"
        >
          <LogOut size={16} />
        </button>

        <div className="navbar__connectivity">
          {effectivelyOnline ? (
            <Wifi size={16} className="navbar__conn-icon navbar__conn-icon--online" />
          ) : (
            <WifiOff size={16} className="navbar__conn-icon navbar__conn-icon--offline" />
          )}
          <OfflineToggle />
        </div>
      </div>
    </nav>
  );
}

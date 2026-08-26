/* ── OfflineToggle — Airplane Mode Switch ── */

import { useOfflineStatus } from '../hooks/useOfflineStatus';
import './OfflineToggle.css';

export function OfflineToggle() {
  const { isSimulatedOffline, toggleSimulatedOffline } = useOfflineStatus();

  return (
    <button
      className={`offline-toggle ${isSimulatedOffline ? 'offline-toggle--off' : 'offline-toggle--on'}`}
      onClick={toggleSimulatedOffline}
      aria-label={isSimulatedOffline ? 'Go Online' : 'Go Offline (Airplane Mode)'}
      title={isSimulatedOffline ? 'Simulated Offline — Click to go Online' : 'Click to simulate Offline mode'}
      id="offline-toggle-btn"
    >
      <span className="offline-toggle__track">
        <span className="offline-toggle__knob">
          {isSimulatedOffline ? '✈️' : '🟢'}
        </span>
      </span>
      <span className="offline-toggle__label">
        {isSimulatedOffline ? 'OFFLINE' : 'ONLINE'}
      </span>
    </button>
  );
}

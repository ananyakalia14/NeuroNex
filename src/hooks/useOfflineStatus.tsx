/* ── useOfflineStatus Hook ──
   Manages offline/online state via context + navigator.onLine
*/

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

interface OfflineContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  effectivelyOnline: boolean; // true only if both real + simulated are online
  toggleSimulatedOffline: () => void;
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isSimulatedOffline: false,
  effectivelyOnline: true,
  toggleSimulatedOffline: () => {},
  pendingSyncCount: 0,
  setPendingSyncCount: () => {},
});

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSimulatedOffline = useCallback(() => {
    setIsSimulatedOffline((prev) => !prev);
  }, []);

  const effectivelyOnline = isOnline && !isSimulatedOffline;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        effectivelyOnline,
        toggleSimulatedOffline,
        pendingSyncCount,
        setPendingSyncCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineStatus() {
  return useContext(OfflineContext);
}

/* ── useAuth Hook & Context with Authentication State ──
   Supports instant 1-click Patient SOS redirect, Hospital Doctor Login, and Admin Commander Login
*/

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserProfile, UserRole } from '../types/auth';
import { DEMO_PROFILES } from '../types/auth';

interface AuthContextType {
  profile: UserProfile;
  role: UserRole;
  isAuthenticated: boolean;
  loginAsPatient: (
    villageNodeId?: number,
    patientName?: string,
    patientPhone?: string,
    villageName?: string,
    lat?: number,
    lng?: number
  ) => void;
  loginAsHospital: (hospitalId?: number, doctorName?: string) => void;
  loginAsAdmin: (adminName?: string) => void;
  loginAsDriver: (ambulanceId?: number, driverName?: string, vehicleNumber?: string) => void;
  switchProfile: (profileId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}

const STORAGE_PROFILE_KEY = 'jeevraah_active_profile';
const STORAGE_AUTH_KEY = 'jeevraah_is_authenticated';

const AuthContext = createContext<AuthContextType>({
  profile: DEMO_PROFILES[0],
  role: 'patient',
  isAuthenticated: false,
  loginAsPatient: () => {},
  loginAsHospital: () => {},
  loginAsAdmin: () => {},
  loginAsDriver: () => {},
  switchProfile: () => {},
  updateProfile: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return DEMO_PROFILES[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const auth = sessionStorage.getItem(STORAGE_AUTH_KEY);
      return auth === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(profile));
      sessionStorage.setItem(STORAGE_AUTH_KEY, isAuthenticated ? 'true' : 'false');
    } catch {
      // ignore
    }
  }, [profile, isAuthenticated]);

  const loginAsPatient = (
    villageNodeId?: number,
    patientName?: string,
    patientPhone?: string,
    villageName?: string,
    lat?: number,
    lng?: number
  ) => {
    const patientProfile: UserProfile = {
      ...DEMO_PROFILES[0],
      name: patientName || DEMO_PROFILES[0].name,
      villageNodeId: villageNodeId || DEMO_PROFILES[0].villageNodeId,
      phone: patientPhone || DEMO_PROFILES[0].phone,
      villageName: villageName || DEMO_PROFILES[0].villageName,
      lat: lat ?? DEMO_PROFILES[0].lat,
      lng: lng ?? DEMO_PROFILES[0].lng,
    };
    setProfile(patientProfile);
    setIsAuthenticated(true);
  };

  const loginAsHospital = (hospitalId?: number, doctorName?: string) => {
    const hospProfile: UserProfile = {
      ...DEMO_PROFILES[1],
      name: doctorName || DEMO_PROFILES[1].name,
      hospitalId: hospitalId ?? DEMO_PROFILES[1].hospitalId,
    };
    setProfile(hospProfile);
    setIsAuthenticated(true);
  };

  const loginAsAdmin = (adminName?: string) => {
    const adminProfile: UserProfile = {
      ...DEMO_PROFILES[2],
      name: adminName || DEMO_PROFILES[2].name,
    };
    setProfile(adminProfile);
    setIsAuthenticated(true);
  };

  const loginAsDriver = (ambulanceId?: number, driverName?: string, vehicleNumber?: string) => {
    const driverProfile: UserProfile = {
      ...DEMO_PROFILES[3],
      name: driverName || DEMO_PROFILES[3].name,
      ambulanceId: ambulanceId ?? DEMO_PROFILES[3].ambulanceId,
      vehicleNumber: vehicleNumber || DEMO_PROFILES[3].vehicleNumber,
    };
    setProfile(driverProfile);
    setIsAuthenticated(true);
  };

  const switchProfile = (profileId: string) => {
    const found = DEMO_PROFILES.find((p) => p.id === profileId);
    if (found) {
      setProfile(found);
      setIsAuthenticated(true);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem(STORAGE_AUTH_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        role: profile.role,
        isAuthenticated,
        loginAsPatient,
        loginAsHospital,
        loginAsAdmin,
        loginAsDriver,
        switchProfile,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

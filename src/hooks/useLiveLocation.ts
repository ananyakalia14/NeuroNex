/* ── useLiveLocation Hook — Real-Time GPS Geolocation & Tracking Engine ──
   - Browser navigator.geolocation with High-Accuracy GPS
   - Non-blocking reverse geocoding to Indian cities & localities
   - Continuous live tracking (watchPosition)
   - Manual pin placement & persistence across reloads
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { reverseGeocodeIndia } from '../utils/indiaEmergency';
import { soundEffects } from '../services/soundEffects';

export interface LiveLocationState {
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  address: string;
  isLocating: boolean;
  isTracking: boolean;
  isLiveGPS: boolean;
  error: string | null;
}

const DEFAULT_LAT = 19.2152;
const DEFAULT_LNG = 73.0820;
const DEFAULT_ADDRESS = 'Dombivli East (MIDC Sector), Mumbai MMR';

const STORAGE_LAT_KEY = 'jeevraah_patient_lat';
const STORAGE_LNG_KEY = 'jeevraah_patient_lng';
const STORAGE_ADDR_KEY = 'jeevraah_patient_address';

export function useLiveLocation(onLocationChange?: (lat: number, lng: number, address: string) => void) {
  const [location, setLocation] = useState<LiveLocationState>(() => {
    try {
      const savedLat = localStorage.getItem(STORAGE_LAT_KEY);
      const savedLng = localStorage.getItem(STORAGE_LNG_KEY);
      const savedAddr = localStorage.getItem(STORAGE_ADDR_KEY);
      if (savedLat && savedLng) {
        return {
          lat: parseFloat(savedLat),
          lng: parseFloat(savedLng),
          accuracy: null,
          heading: null,
          speed: null,
          address: savedAddr || DEFAULT_ADDRESS,
          isLocating: false,
          isTracking: false,
          isLiveGPS: true,
          error: null,
        };
      }
    } catch {}
    return {
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      accuracy: null,
      heading: null,
      speed: null,
      address: DEFAULT_ADDRESS,
      isLocating: false,
      isTracking: false,
      isLiveGPS: false,
      error: null,
    };
  });

  const watchIdRef = useRef<number | null>(null);

  // Update address and notify parent
  const updateAddress = useCallback(async (lat: number, lng: number) => {
    try {
      const info = await reverseGeocodeIndia(lat, lng);
      const fullAddr = info.fullAddress || `${info.locality}, ${info.city}`;
      setLocation((prev) => ({ ...prev, address: fullAddr }));
      try {
        localStorage.setItem(STORAGE_ADDR_KEY, fullAddr);
      } catch {}
      onLocationChange?.(lat, lng, fullAddr);
    } catch {
      onLocationChange?.(lat, lng, location.address);
    }
  }, [location.address, onLocationChange]);

  // Request single high-accuracy GPS fix
  const requestGPSLocation = useCallback((highAccuracy: boolean = true): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        setLocation((prev) => ({ ...prev, error: 'Geolocation not supported by browser' }));
        reject(new Error('Geolocation not supported'));
        return;
      }

      setLocation((prev) => ({ ...prev, isLocating: true, error: null }));
      soundEffects.playRecalculateSweep();

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng, accuracy, heading, speed } = pos.coords;

          try {
            localStorage.setItem(STORAGE_LAT_KEY, lat.toString());
            localStorage.setItem(STORAGE_LNG_KEY, lng.toString());
          } catch {}

          setLocation((prev) => ({
            ...prev,
            lat,
            lng,
            accuracy: Math.round(accuracy),
            heading,
            speed,
            isLocating: false,
            isLiveGPS: true,
            error: null,
          }));

          soundEffects.playSuccess();
          updateAddress(lat, lng);
          resolve({ lat, lng });
        },
        (err) => {
          console.warn('GPS location request error:', err.message);
          setLocation((prev) => ({
            ...prev,
            isLocating: false,
            error: err.message,
          }));
          reject(err);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }, [updateAddress]);

  // Toggle continuous watchPosition tracking
  const toggleLiveTracking = useCallback((enable?: boolean) => {
    const shouldEnable = enable !== undefined ? enable : !location.isTracking;

    if (!shouldEnable) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocation((prev) => ({ ...prev, isTracking: false }));
      return;
    }

    if (!('geolocation' in navigator)) return;

    soundEffects.playDispatchConfirmed();
    setLocation((prev) => ({ ...prev, isTracking: true, error: null }));

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy, heading, speed } = pos.coords;

        try {
          localStorage.setItem(STORAGE_LAT_KEY, lat.toString());
          localStorage.setItem(STORAGE_LNG_KEY, lng.toString());
        } catch {}

        setLocation((prev) => ({
          ...prev,
          lat,
          lng,
          accuracy: Math.round(accuracy),
          heading,
          speed,
          isTracking: true,
          isLiveGPS: true,
          error: null,
        }));

        updateAddress(lat, lng);
      },
      (err) => {
        console.warn('Live tracking watch error:', err.message);
        setLocation((prev) => ({ ...prev, isTracking: false, error: err.message }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    watchIdRef.current = id;
  }, [location.isTracking, updateAddress]);

  // Set manual coordinates (drag & drop pin or map click)
  const setManualLocation = useCallback((lat: number, lng: number) => {
    try {
      localStorage.setItem(STORAGE_LAT_KEY, lat.toString());
      localStorage.setItem(STORAGE_LNG_KEY, lng.toString());
    } catch {}

    setLocation((prev) => ({
      ...prev,
      lat,
      lng,
      accuracy: null,
      isLiveGPS: false,
      error: null,
    }));

    updateAddress(lat, lng);
  }, [updateAddress]);

  // Auto-request location silently on initial load if permitted
  useEffect(() => {
    if ('permissions' in navigator && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'granted') {
          requestGPSLocation(false).catch(() => {});
        }
      }).catch(() => {});
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [requestGPSLocation]);

  return {
    location,
    requestGPSLocation,
    toggleLiveTracking,
    setManualLocation,
  };
}

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import {
  Truck,
  Navigation,
  Building2,
  MapPin,
  Play,
  Award,
  RotateCcw,
  AlertTriangle,
  Layers,
  Gauge,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  HeartPulse,
  Users,
  Filter,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { soundEffects } from '../../services/soundEffects';

// Real Indian Rural Region: Dharnai / Makhdumpur / Jehanabad / Gaya District, Bihar (NH-83 Highway Corridor)
const DHARNAI_PILOT_COORDS: [number, number] = [24.981, 85.002];

import { REAL_ROAD_COORDINATES } from '../../services/realRoadData';
import { fetchRealRoadRoute, calculateBearing } from '../../services/realRoadRouter';

// High-Fidelity Segregated Emergency Cases for Indian Rural Villages
export interface RegionalEmergencyCase {
  id: string;
  patientName: string;
  patientAge: number;
  gender: string;
  triagePriority: 'P1_CRITICAL' | 'P2_URGENT' | 'P3_STABLE';
  condition: string;
  symptoms: string;
  vitals: string;
  villageName: string;
  villageCoords: [number, number];
  assignedHospitalName: string;
  hospitalCoords: [number, number];
  assignedAmbulance: string;
  ambulanceType: 'ALS' | '4X4' | 'BLS';
  streetWaypoints: [number, number][];
  distanceKm: number;
  status: 'PENDING' | 'EN_ROUTE_TO_PATIENT' | 'AT_SCENE' | 'TRANSPORTING_TO_HOSPITAL' | 'RESOLVED';
  liveSpeedKmh: number;
  liveEtaMin: number;
  roadCorridorName: string;
}

const INITIAL_EMERGENCY_CASES: RegionalEmergencyCase[] = [
  {
    id: 'case-01',
    patientName: 'Ravi Kisku (Age 34)',
    patientAge: 34,
    gender: 'Male',
    triagePriority: 'P1_CRITICAL',
    condition: 'Russell Viper Snakebite Envenomation',
    symptoms: 'Neurotoxicity, systemic coagulopathy, severe hemotoxic swelling',
    vitals: 'BP 80/50 | HR 132 bpm | SpO2 88%',
    villageName: 'Dharnai Village (Sector Alpha)',
    villageCoords: [24.996748, 85.026805],
    assignedHospitalName: 'Jehanabad Apex Trauma & Antivenom Center',
    hospitalCoords: [24.974771, 84.999857],
    assignedAmbulance: 'ALS-UNIT-01',
    ambulanceType: 'ALS',
    distanceKm: 5.57,
    status: 'PENDING',
    liveSpeedKmh: 0,
    liveEtaMin: 8,
    roadCorridorName: 'NH-83 Highway & Dharnai Solar Village Link Road',
    streetWaypoints: REAL_ROAD_COORDINATES['case-01'] || [
      [24.974771, 84.999857],
      [24.996748, 85.026805],
    ],
  },
  {
    id: 'case-02',
    patientName: 'Sunita Devi (Age 26)',
    patientAge: 26,
    gender: 'Female',
    triagePriority: 'P1_CRITICAL',
    condition: 'Postpartum Hemorrhagic Shock',
    symptoms: 'Acute hypovolemic shock, tachycardia, unresponsiveness',
    vitals: 'BP 72/40 | HR 145 bpm | SpO2 84%',
    villageName: 'Kandu Dih River Outpost',
    villageCoords: [25.008, 85.042],
    assignedHospitalName: 'Makhdumpur Maternal Intensive Care Hospital',
    hospitalCoords: [24.960, 84.992],
    assignedAmbulance: '4X4-RESCUE-02',
    ambulanceType: '4X4',
    distanceKm: 11.07,
    status: 'PENDING',
    liveSpeedKmh: 0,
    liveEtaMin: 14,
    roadCorridorName: 'NH-83 Northbound & Kandu Dih Paved Embankment Road',
    streetWaypoints: REAL_ROAD_COORDINATES['case-02'] || [
      [24.960, 84.992],
      [25.008, 85.042],
    ],
  },
  {
    id: 'case-03',
    patientName: 'Bhanu Pratap (Age 58)',
    patientAge: 58,
    gender: 'Male',
    triagePriority: 'P1_CRITICAL',
    condition: 'Acute STEMI Anterior Wall Cardiac Shock',
    symptoms: 'Crushing retrosternal chest pain, diaphoresis, ventricular arrhythmia',
    vitals: 'BP 90/60 | HR 118 bpm | SpO2 91%',
    villageName: 'Belaganj Foothill Settlement',
    villageCoords: [24.968, 85.010],
    assignedHospitalName: 'Jehanabad Apex Trauma & Cardiology Center',
    hospitalCoords: [24.974771, 84.999857],
    assignedAmbulance: 'ALS-UNIT-03',
    ambulanceType: 'ALS',
    distanceKm: 1.42,
    status: 'PENDING',
    liveSpeedKmh: 0,
    liveEtaMin: 4,
    roadCorridorName: 'Belaganj South Bypass & Station Feeder Road',
    streetWaypoints: REAL_ROAD_COORDINATES['case-03'] || [
      [24.974771, 84.999857],
      [24.968, 85.010],
    ],
  },
  {
    id: 'case-04',
    patientName: 'Laxman Soren (Age 42)',
    patientAge: 42,
    gender: 'Male',
    triagePriority: 'P2_URGENT',
    condition: 'Organophosphate Pesticide Inhalation',
    symptoms: 'Miosis, bronchospasm, hypersecretion, fasciculations',
    vitals: 'BP 110/70 | HR 54 bpm | SpO2 93%',
    villageName: 'Phalgu Valley Agro Cluster',
    villageCoords: [24.980, 85.022],
    assignedHospitalName: 'Jehanabad District Civil Hospital',
    hospitalCoords: [24.974771, 84.999857],
    assignedAmbulance: 'BLS-UNIT-04',
    ambulanceType: 'BLS',
    distanceKm: 3.13,
    status: 'PENDING',
    liveSpeedKmh: 0,
    liveEtaMin: 6,
    roadCorridorName: 'SH-71 Eastbound & Phalgu Valley Paved Road',
    streetWaypoints: REAL_ROAD_COORDINATES['case-04'] || [
      [24.974771, 84.999857],
      [24.980, 85.022],
    ],
  },
  {
    id: 'case-05',
    patientName: 'Baby of Anita (Age 4 days)',
    patientAge: 0.01,
    gender: 'Female',
    triagePriority: 'P2_URGENT',
    condition: 'Early-Onset Neonatal Respiratory Distress',
    symptoms: 'Grunting respiration, subcostal retractions, cyanosis',
    vitals: 'HR 165 bpm | RR 72/min | SpO2 86%',
    villageName: 'North Canal Hamlet',
    villageCoords: [25.002, 85.020],
    assignedHospitalName: 'Makhdumpur Maternal & Neonatal Hospital',
    hospitalCoords: [24.960, 84.992],
    assignedAmbulance: 'ALS-UNIT-05',
    ambulanceType: 'ALS',
    distanceKm: 8.37,
    status: 'PENDING',
    liveSpeedKmh: 0,
    liveEtaMin: 12,
    roadCorridorName: 'NH-83 & North Canal Paved Corridor',
    streetWaypoints: REAL_ROAD_COORDINATES['case-05'] || [
      [24.960, 84.992],
      [25.002, 85.020],
    ],
  },
  {
    id: 'case-06',
    patientName: 'Meera Devi (Age 62)',
    patientAge: 62,
    gender: 'Female',
    triagePriority: 'P3_STABLE',
    condition: 'Falciparum Malaria with Moderate Dehydration',
    symptoms: 'High-grade fever spikes, rigor, stable hemodynamics',
    vitals: 'BP 120/80 | HR 88 bpm | Temp 103.4°F',
    villageName: 'Chhath Ghat Settlement',
    villageCoords: [24.988, 85.015],
    assignedHospitalName: 'Makhdumpur Community Health Clinic',
    hospitalCoords: [24.960, 84.992],
    assignedAmbulance: 'BLS-UNIT-06',
    ambulanceType: 'BLS',
    distanceKm: 6.90,
    status: 'PENDING',
    liveSpeedKmh: 0,
    liveEtaMin: 10,
    roadCorridorName: 'Tehta-Chhath Ghat Rural Paved Road',
    streetWaypoints: REAL_ROAD_COORDINATES['case-06'] || [
      [24.960, 84.992],
      [24.988, 85.015],
    ],
  },
];

export const GoogleMapsInteractiveView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const ambulanceMarkersRef = useRef<{ [caseId: string]: L.Marker }>({});
  const routePolylinesRef = useRef<{ [caseId: string]: L.Polyline }>({});

  const [cases, setCases] = useState<RegionalEmergencyCase[]>(INITIAL_EMERGENCY_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case-01');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CRITICAL' | 'URGENT' | 'STABLE'>('ALL');
  const [mapLayerType, setMapLayerType] = useState<'google_hybrid' | 'google_satellite' | 'osm'>('google_hybrid');
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(1.0);
  const [isAllDispatching, setIsAllDispatching] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: DHARNAI_PILOT_COORDS,
      zoom: 13,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    // Tile Layer based on selection
    const tileUrl =
      mapLayerType === 'google_satellite'
        ? 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
        : mapLayerType === 'google_hybrid'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 20,
      attribution: '© Google Maps • Rural Healthcare 3D Command GIS',
    }).addTo(map);

    // Add Hospital Pins
    const hospIcon = L.divIcon({
      html: `<div class="px-2 py-1 rounded-xl bg-emerald-600 border-2 border-white shadow-xl flex items-center gap-1.5 text-white font-mono font-bold text-[10px] whitespace-nowrap">
        <span>🏥</span>
        <span>Jehanabad Apex Trauma Hospital</span>
      </div>`,
      className: 'hosp-pin',
      iconSize: [210, 26],
      iconAnchor: [105, 13],
    });
    L.marker([24.975, 84.998], { icon: hospIcon }).addTo(map);

    const matHospIcon = L.divIcon({
      html: `<div class="px-2 py-1 rounded-xl bg-emerald-700 border-2 border-white shadow-xl flex items-center gap-1.5 text-white font-mono font-bold text-[10px] whitespace-nowrap">
        <span>🏥</span>
        <span>Makhdumpur Maternal & Child Hospital</span>
      </div>`,
      className: 'mat-hosp-pin',
      iconSize: [230, 26],
      iconAnchor: [115, 13],
    });
    L.marker([24.960, 84.992], { icon: matHospIcon }).addTo(map);

    // Add Patient Pins for each case
    cases.forEach((c) => {
      const isCritical = c.triagePriority === 'P1_CRITICAL';
      const isUrgent = c.triagePriority === 'P2_URGENT';
      const colorBg = isCritical ? 'bg-red-600' : isUrgent ? 'bg-amber-600' : 'bg-blue-600';

      const pinIcon = L.divIcon({
        html: `<div class="px-2 py-1 rounded-xl ${colorBg} border-2 border-white shadow-xl flex items-center gap-1 text-white font-mono font-bold text-[10px] whitespace-nowrap ${
          isCritical ? 'animate-pulse' : ''
        }">
          <span>${isCritical ? '🚨' : isUrgent ? '⚡' : '🛖'}</span>
          <span>${c.villageName.split(' ')[0]}: ${c.patientName.split(' ')[0]}</span>
        </div>`,
        className: `patient-pin-${c.id}`,
        iconSize: [160, 26],
        iconAnchor: [80, 13],
      });

      L.marker(c.villageCoords, { icon: pinIcon })
        .addTo(map)
        .bindPopup(`<strong>${c.triagePriority}: ${c.condition}</strong><br/>Patient: ${c.patientName}<br/>Vitals: ${c.vitals}<br/>Village: ${c.villageName}`);

      // Add Ambulance Marker for each case with bearing rotation capability
      const ambIcon = L.divIcon({
        html: `<div class="px-2.5 py-1 rounded-xl bg-slate-950 border-2 ${
          isCritical ? 'border-rose-500' : 'border-blue-400'
        } shadow-2xl flex items-center gap-1.5 text-white font-mono font-bold text-[10px] whitespace-nowrap">
          <span class="amb-icon-wrap inline-block transition-transform duration-75">🚑</span>
          <span class="w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-rose-500 animate-ping' : 'bg-blue-400'}"></span>
          <span>${c.assignedAmbulance}</span>
        </div>`,
        className: `amb-marker-${c.id}`,
        iconSize: [120, 26],
        iconAnchor: [60, 13],
      });

      const ambMarker = L.marker(c.hospitalCoords, { icon: ambIcon }).addTo(map);
      ambulanceMarkersRef.current[c.id] = ambMarker;
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLayerType]);

  // Dispatch a Single Patient Emergency Mission (Hospital -> Patient -> Hospital)
  const dispatchSingleEmergency = (caseId: string) => {
    const c = cases.find((item) => item.id === caseId);
    if (!c || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    soundEffects.playDispatchConfirmed();

    // 1. Draw Active Street Route with Dual-Layer Asphalt & Neon Glow
    if (routePolylinesRef.current[caseId]) {
      routePolylinesRef.current[caseId].remove();
    }

    const isCritical = c.triagePriority === 'P1_CRITICAL';
    const poly = L.polyline(c.streetWaypoints, {
      color: isCritical ? '#EF4444' : '#06B6D4',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    routePolylinesRef.current[caseId] = poly;
    map.fitBounds(poly.getBounds(), { padding: [60, 60], maxZoom: 16 });

    // Set Status to EN ROUTE TO PATIENT
    setCases((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? {
              ...item,
              status: 'EN_ROUTE_TO_PATIENT',
              liveSpeedKmh: isCritical ? 78 : 62,
            }
          : item
      )
    );

    const waypoints = c.streetWaypoints;
    const ambMarker = ambulanceMarkersRef.current[caseId];

    // High-Resolution Smooth Micro-Step Animation
    let step = 0;
    const totalSteps = Math.max(140, waypoints.length);
    const interval1 = setInterval(() => {
      step++;
      const frac = step / totalSteps;
      const exactIdx = frac * (waypoints.length - 1);
      const segIdx = Math.min(Math.floor(exactIdx), waypoints.length - 2);
      const segFrac = exactIdx - segIdx;

      const p1 = waypoints[segIdx];
      const p2 = waypoints[segIdx + 1];

      const curLat = p1[0] + (p2[0] - p1[0]) * segFrac;
      const curLon = p1[1] + (p2[1] - p1[1]) * segFrac;

      // Calculate bearing angle to orient the ambulance along the road curve
      const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

      if (ambMarker) {
        ambMarker.setLatLng([curLat, curLon]);
        const el = ambMarker.getElement();
        if (el) {
          const innerIcon = el.querySelector('.amb-icon-wrap') as HTMLElement;
          if (innerIcon) {
            innerIcon.style.transform = `rotate(${bearing}deg)`;
          }
        }
      }

      // Physics: Speed up on straight stretches, slow slightly for tight road turns
      const bearingDiff = Math.abs(bearing - 180);
      const turnPenalty = bearingDiff > 60 ? 12 : 0;
      const liveSpeed = Math.max(35, (isCritical ? 80 : 65) - turnPenalty);

      const remEta = Math.max(0, Math.round(c.liveEtaMin * (1 - frac)));
      setCases((prev) =>
        prev.map((item) =>
          item.id === caseId
            ? { ...item, liveEtaMin: remEta, liveSpeedKmh: liveSpeed }
            : item
        )
      );

      if (step >= totalSteps) {
        clearInterval(interval1);
        soundEffects.playEmergencyAlert();

        // Phase 2: At Scene / Patient Onboard & Stabilization
        setCases((prev) =>
          prev.map((item) =>
            item.id === caseId
              ? { ...item, status: 'AT_SCENE', liveSpeedKmh: 0, liveEtaMin: 0 }
              : item
          )
        );

        setTimeout(() => {
          soundEffects.playRecalculateSweep();
          // Phase 3: Transporting Patient to Hospital along Return Road Corridor
          setCases((prev) =>
            prev.map((item) =>
              item.id === caseId
                ? {
                    ...item,
                    status: 'TRANSPORTING_TO_HOSPITAL',
                    liveSpeedKmh: isCritical ? 85 : 70,
                    liveEtaMin: Math.max(2, Math.round(c.liveEtaMin * 0.9)),
                  }
                : item
            )
          );

          if (routePolylinesRef.current[caseId]) {
            routePolylinesRef.current[caseId].setStyle({
              color: '#22C55E',
              weight: 6,
            });
          }

          const returnWaypoints = [...waypoints].reverse();
          let step2 = 0;
          const totalSteps2 = Math.max(140, returnWaypoints.length);
          const interval2 = setInterval(() => {
            step2++;
            const frac2 = step2 / totalSteps2;
            const exactIdx2 = frac2 * (returnWaypoints.length - 1);
            const segIdx2 = Math.min(Math.floor(exactIdx2), returnWaypoints.length - 2);
            const segFrac2 = exactIdx2 - segIdx2;

            const rp1 = returnWaypoints[segIdx2];
            const rp2 = returnWaypoints[segIdx2 + 1];

            const curLat2 = rp1[0] + (rp2[0] - rp1[0]) * segFrac2;
            const curLon2 = rp1[1] + (rp2[1] - rp1[1]) * segFrac2;
            const bearing2 = calculateBearing(rp1[0], rp1[1], rp2[0], rp2[1]);

            if (ambMarker) {
              ambMarker.setLatLng([curLat2, curLon2]);
              const el = ambMarker.getElement();
              if (el) {
                const innerIcon = el.querySelector('.amb-icon-wrap') as HTMLElement;
                if (innerIcon) {
                  innerIcon.style.transform = `rotate(${bearing2}deg)`;
                }
              }
            }

            const remEta2 = Math.max(0, Math.round(c.liveEtaMin * 0.9 * (1 - frac2)));
            setCases((prev) =>
              prev.map((item) =>
                item.id === caseId
                  ? { ...item, liveEtaMin: remEta2, liveSpeedKmh: isCritical ? 84 : 68 }
                  : item
              )
            );

            if (step2 >= totalSteps2) {
              clearInterval(interval2);
              soundEffects.playSuccess();
              // Phase 4: Hospital Arrival / Admitted & Saved
              setCases((prev) =>
                prev.map((item) =>
                  item.id === caseId
                    ? {
                        ...item,
                        status: 'RESOLVED',
                        liveSpeedKmh: 0,
                        liveEtaMin: 0,
                      }
                    : item
                )
              );
            }
          }, 35);
        }, 2200);
      }
    }, 35);
  };

  // Dispatch All Active Critical Emergencies Simultaneously
  const dispatchAllCriticalCases = () => {
    setIsAllDispatching(true);
    soundEffects.playDispatchConfirmed();

    const criticalList = cases.filter(
      (c) => c.triagePriority === 'P1_CRITICAL' && c.status === 'PENDING'
    );

    criticalList.forEach((c, idx) => {
      setTimeout(() => {
        dispatchSingleEmergency(c.id);
      }, idx * 400);
    });

    setTimeout(() => {
      setIsAllDispatching(false);
    }, 1500);
  };

  const filteredCases = cases.filter((c) => {
    if (filterPriority === 'CRITICAL') return c.triagePriority === 'P1_CRITICAL';
    if (filterPriority === 'URGENT') return c.triagePriority === 'P2_URGENT';
    if (filterPriority === 'STABLE') return c.triagePriority === 'P3_STABLE';
    return true;
  });

  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none font-sans flex">
      {/* MAP VIEW CONTAINER */}
      <div className="flex-1 h-full relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* TOP FLOATING CONTROLS */}
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex items-start justify-between flex-wrap gap-3">
          {/* Master Dispatch All Critical Button */}
          <div className="pointer-events-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={dispatchAllCriticalCases}
              disabled={isAllDispatching}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-xl shadow-red-600/30 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-white animate-pulse" />
              <span>DISPATCH ALL CRITICAL EMERGENCIES (3 SIMULTANEOUS UNITS)</span>
            </button>

            <div className="bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-mono text-white border border-slate-700 shadow-xl flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{cases.filter((c) => c.status !== 'RESOLVED').length} Active Missions</span>
            </div>
          </div>

          {/* Map Layer Switcher */}
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 border border-slate-700 shadow-xl font-mono text-xs">
            <button
              onClick={() => setMapLayerType('google_hybrid')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                mapLayerType === 'google_hybrid'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Google Hybrid
            </button>
            <button
              onClick={() => setMapLayerType('google_satellite')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
                mapLayerType === 'google_satellite'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        {/* BOTTOM ACTIVE TELEMETRY HUD */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none flex items-end justify-between flex-wrap gap-3">
          <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-6 font-mono text-xs text-white">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Selected Unit Speed</div>
                <div className="text-sm font-bold text-emerald-400">{selectedCase.liveSpeedKmh} <span className="text-[10px] text-slate-400">km/h</span></div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Arrival ETA</div>
                <div className="text-sm font-bold text-purple-400">{selectedCase.liveEtaMin} <span className="text-[10px] text-slate-400">min</span></div>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700" />

            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Mission Status</div>
                <div className="text-xs font-bold text-cyan-300 uppercase">{selectedCase.status.replace(/_/g, ' ')}</div>
              </div>
            </div>
          </div>

          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-[11px] font-mono text-slate-400 shadow-xl flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span>DHARNAI RURAL HEALTH NETWORK • JEHANABAD, BIHAR (NH-83)</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: SEGREGATED PATIENTS & LIVE DISPATCH QUEUE */}
      <div className="w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-20 select-none">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Triage Emergency Dispatch
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
              6 CASES
            </span>
          </div>

          {/* Priority Filter Pills */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <button
              onClick={() => setFilterPriority('ALL')}
              className={`flex-1 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterPriority === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterPriority('CRITICAL')}
              className={`flex-1 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterPriority === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🔴 P1 Critical
            </button>
            <button
              onClick={() => setFilterPriority('URGENT')}
              className={`flex-1 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                filterPriority === 'URGENT' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🟡 P2 Urgent
            </button>
          </div>
        </div>

        {/* Patient Cases List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredCases.map((c) => {
            const isSelected = selectedCaseId === c.id;
            const isCritical = c.triagePriority === 'P1_CRITICAL';
            const isUrgent = c.triagePriority === 'P2_URGENT';

            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedCaseId(c.id);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo(c.villageCoords, 14);
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                  isSelected
                    ? 'bg-slate-800/90 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                {/* Top Row: Triage Badge & Status */}
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                      isCritical
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isUrgent
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {c.triagePriority.replace('_', ' ')}
                  </span>

                  <span
                    className={`font-mono text-[10px] font-bold ${
                      c.status === 'RESOLVED'
                        ? 'text-emerald-400'
                        : c.status !== 'PENDING'
                        ? 'text-rose-400 animate-pulse'
                        : 'text-slate-400'
                    }`}
                  >
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Patient Name & Condition */}
                <div>
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{c.patientName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{c.distanceKm} km</span>
                  </div>
                  <div className="text-[11px] text-rose-300 font-medium mt-0.5">{c.condition}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{c.symptoms}</div>
                </div>

                {/* Vitals & Assigned Unit */}
                <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] font-mono text-slate-300 flex items-center justify-between">
                  <span>Vitals: {c.vitals.split('|')[0]}</span>
                  <span className="text-blue-400 font-bold">🚑 {c.assignedAmbulance}</span>
                </div>

                {/* Dispatch Trigger Button */}
                {c.status === 'PENDING' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCaseId(c.id);
                      dispatchSingleEmergency(c.id);
                    }}
                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs tracking-wider uppercase transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>DISPATCH {c.assignedAmbulance}</span>
                  </button>
                ) : c.status === 'RESOLVED' ? (
                  <div className="w-full py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[11px] text-center flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ADMITTED TO ICU • RESOLVED</span>
                  </div>
                ) : (
                  <div className="w-full py-1.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 font-mono font-bold text-[11px] text-center flex items-center justify-center gap-1.5 animate-pulse">
                    <Truck className="w-3.5 h-3.5" />
                    <span>EN ROUTE ({c.liveEtaMin} min remaining)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

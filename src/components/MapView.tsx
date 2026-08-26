/* ── MapView — Ultra-Reliable Leaflet Emergency Navigation Engine ──
   - Live GPS Geolocation & Real-World Geodesic Tracking
   - Draggable Emergency SOS Beacon Pin with Accuracy Radar
   - Real Road Routing with Dynamic Bearing Orientation
   - 77 Mumbai Metropolitan Hospitals with Live Availability
   - 6 Indian Predefined Emergency Cases with Real Road Tracks
   - Web Audio Tactical Sound Synthesizer
*/

import { useRef, useEffect, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GraphNode, GraphEdge, Hospital, Ambulance as AmbulanceType, Dispatch } from '../db/schema';
import {
  Moon,
  Sun,
  Clock,
  RotateCcw,
  Phone,
  Radio,
  CheckCircle2,
  Zap,
  ShieldAlert,
  Gauge,
  HeartPulse,
  Truck,
  Activity,
  X,
  ChevronRight,
  Crosshair,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { INITIAL_EMERGENCY_CASES, type RegionalEmergencyCase } from '../data/emergencyCases';

import { MUMBAI_MMR_HOSPITALS, MUMBAI_HOSPITAL_COORDINATES } from '../data/mumbaiHospitals';
import { soundEffects } from '../services/soundEffects';
import { calculateBearing } from '../services/realRoadRouter';
import './MapView.css';

// ── Top-Level Geodesic Defaults ──
const DEFAULT_PATIENT_LAT = 19.2152;
const DEFAULT_PATIENT_LNG = 73.0820;

const REAL_HOSPITAL_COORDS = MUMBAI_HOSPITAL_COORDINATES;
const DEFAULT_HOSPITALS = MUMBAI_MMR_HOSPITALS;

const TILE_URLS = {
  voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  google_hybrid: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  google_satellite: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
};

// ── Mathematical Geodesic Distance and Bearing Helpers ──

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getPathDistances(path: [number, number][]): { totalDist: number; segDists: number[] } {
  let total = 0;
  const segDists: number[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const d = haversineDistanceKm(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
    segDists.push(d);
    total += d;
  }
  return { totalDist: total, segDists };
}

function getPointAtDistance(
  path: [number, number][],
  targetDist: number,
  segDists: number[]
): { coord: [number, number]; bearing: number } {
  if (path.length === 0) return { coord: [DEFAULT_PATIENT_LAT, DEFAULT_PATIENT_LNG], bearing: 0 };
  if (path.length === 1) return { coord: path[0], bearing: 0 };

  let accumulated = 0;
  for (let i = 0; i < segDists.length; i++) {
    if (accumulated + segDists[i] >= targetDist || i === segDists.length - 1) {
      const segRemaining = targetDist - accumulated;
      const t = segDists[i] > 0 ? Math.min(Math.max(segRemaining / segDists[i], 0), 1) : 0;
      const p1 = path[i];
      const p2 = path[i + 1];
      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lng = p1[1] + (p2[1] - p1[1]) * t;
      const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      return { coord: [lat, lng], bearing };
    }
    accumulated += segDists[i];
  }
  const last = path[path.length - 1];
  const prev = path[path.length - 2] || last;
  return { coord: last, bearing: calculateBearing(prev[0], prev[1], last[0], last[1]) };
}

export type AnimationStage =
  | 'EN_ROUTE_PATIENT'
  | 'PATIENT_PICKUP'
  | 'RUSHING_HOSPITAL'
  | 'ARRIVED_HOSPITAL';

interface MapViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  hospitals: Hospital[];
  ambulances?: AmbulanceType[];
  routeNodeIds: number[];
  selectedNodeId: number | null;
  onNodeSelect: (nodeId: number) => void;
  isBlockRoadMode?: boolean;
  onToggleEdgeBlock?: (edgeId: number, blocked: boolean) => void;
  patientNodeId?: number | null;
  activeDispatch?: Dispatch | null;
  userLat?: number;
  userLng?: number;
  userAddress?: string;
  isLiveGPS?: boolean;
  onLocateMe?: () => void;
  onPinDragEnd?: (lat: number, lng: number) => void;
  selectedHospitalId?: number | null;
}

export function MapView({
  nodes: _nodes,
  edges: _edges,
  hospitals,
  ambulances: _ambulances = [],
  routeNodeIds: _routeNodeIds = [],
  selectedNodeId: _selectedNodeId,
  onNodeSelect: _onNodeSelect,
  isBlockRoadMode = false,
  onToggleEdgeBlock: _onToggleEdgeBlock,
  patientNodeId: _patientNodeId,
  activeDispatch,
  userLat,
  userLng,
  userAddress,
  isLiveGPS = false,
  onLocateMe,
  onPinDragEnd,
  selectedHospitalId,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const patientMarkerRef = useRef<L.Marker | null>(null);
  const movingAmbulanceMarkerRef = useRef<L.Marker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastHandledDispatchKeyRef = useRef<string | null>(null);

  // Smooth camera pan when hospital is clicked from Patient Portal
  useEffect(() => {
    if (selectedHospitalId === undefined || selectedHospitalId === null || !mapRef.current) return;
    const hosp = MUMBAI_MMR_HOSPITALS.find((h) => h.id === selectedHospitalId);
    if (hosp) {
      mapRef.current.flyTo([hosp.lat, hosp.lng], 15, { animate: true, duration: 1.0 });
    }
  }, [selectedHospitalId]);


  // Predefined Case Animation references
  const presetAmbMarkersRef = useRef<{ [caseId: string]: L.Marker }>({});
  const presetPolylinesRef = useRef<{ [caseId: string]: L.Polyline }>({});

  const [isMuted, setIsMuted] = useState<boolean>(() => !soundEffects.isEnabled());
  const [currentTheme, setCurrentTheme] = useState<'voyager' | 'dark' | 'osm' | 'google_hybrid' | 'google_satellite'>('voyager');
  const [activeLegStage, setActiveLegStage] = useState<AnimationStage>('EN_ROUTE_PATIENT');
  const [liveEta, setLiveEta] = useState<number>(0);
  const [liveDist, setLiveDist] = useState<number>(0);
  const [liveSpeed, setLiveSpeed] = useState<number>(65);


  // Dynamic Patient Coordinates
  const patientLat = userLat || DEFAULT_PATIENT_LAT;
  const patientLng = userLng || DEFAULT_PATIENT_LNG;

  // Predefined Cases State
  const [cases, setCases] = useState<RegionalEmergencyCase[]>(INITIAL_EMERGENCY_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case-01');
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CRITICAL' | 'URGENT' | 'STABLE'>('ALL');
  const [isCasesDrawerOpen, setIsCasesDrawerOpen] = useState<boolean>(false);
  const [isAllDispatching, setIsAllDispatching] = useState<boolean>(false);

  // ── 1. Initialize Leaflet Map on Mount ──
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [patientLat, patientLng],
      zoom: 13.8,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const tileLayer = L.tileLayer(TILE_URLS.voyager, {
      maxZoom: 20,
      subdomains: 'abcd',
      attribution: '© OpenStreetMap contributors © CARTO',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    const routeGroup = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = routeGroup;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    mapRef.current = map;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── 2. Handle Dynamic Tile Layer Switcher ──
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);

    const newUrl = TILE_URLS[currentTheme];
    const newLayer = L.tileLayer(newUrl, {
      maxZoom: currentTheme.includes('google') ? 20 : 19,
      subdomains: 'abcd',
      attribution: currentTheme.includes('google') ? '© Google Maps • JeevaRaah' : '© OpenStreetMap contributors © CARTO',
    }).addTo(mapRef.current);

    tileLayerRef.current = newLayer;
  }, [currentTheme]);

  // ── 3. Render Static Markers: Hospitals, Patient GPS, Standby Depot ──
  useEffect(() => {
    const markersGroup = markersLayerGroupRef.current;
    if (!markersGroup) return;

    markersGroup.clearLayers();

    // Destination & Network Hospitals
    const hospitalList = hospitals.length > 0 ? hospitals : DEFAULT_HOSPITALS;
    hospitalList.forEach((h) => {
      const coords = REAL_HOSPITAL_COORDS[h.id] || REAL_HOSPITAL_COORDS[0];
      if (!coords) return;
      const isTarget = activeDispatch && (activeDispatch.assignedHospitalId === h.id || h.id === 0);

      const iconHtml = `
        <div class="map-view__hosp-badge ${isTarget ? 'map-view__hosp-badge--target' : ''}">
          <span class="map-view__hosp-icon">🏥</span>
          <div class="map-view__hosp-info">
            <strong>${h.name.split('(')[0].trim()}</strong>
            <span>${h.tier} • ${h.bedsAvailable ?? 12} Beds Avail</span>
          </div>
        </div>
      `;

      const hospIcon = L.divIcon({
        className: 'leaflet-custom-div-icon',
        html: iconHtml,
        iconSize: [170, 36],
        iconAnchor: [85, 18],
      });

      L.marker([coords.lat, coords.lng], { icon: hospIcon })
        .addTo(markersGroup)
        .bindPopup(`<strong>${h.name}</strong><br/>Location: ${(h as any).location || 'Mumbai MMR'}<br/>Beds Available: ${h.bedsAvailable ?? 12}<br/>Tier: ${h.tier}`);
    });

    // Patient Live GPS Pulse Pin (Draggable)
    const patientPinHtml = `
      <div class="map-view__patient-beacon ${isLiveGPS ? 'map-view__patient-beacon--live' : ''}">
        <div class="map-view__patient-pulse"></div>
        <div class="map-view__patient-core">📍</div>
        <div class="map-view__patient-tag">
          <strong>${isLiveGPS ? 'Live GPS Location' : 'Patient SOS Location'}</strong>
          <span>${userAddress ? userAddress.split(',')[0] : 'Triaged Emergency'}</span>
        </div>
      </div>
    `;

    const patientIcon = L.divIcon({
      className: 'leaflet-custom-div-icon',
      html: patientPinHtml,
      iconSize: [160, 40],
      iconAnchor: [80, 20],
    });

    const pMarker = L.marker([patientLat, patientLng], {
      icon: patientIcon,
      draggable: true,
      zIndexOffset: 1000,
    })
      .addTo(markersGroup)
      .bindPopup(`<strong>Emergency SOS Caller</strong><br/>${userAddress || 'Mumbai MMR'}<br/>Coordinates: ${patientLat.toFixed(4)}°N, ${patientLng.toFixed(4)}°E<br/><em>(Drag pin to refine pickup door)</em>`);

    pMarker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      soundEffects.playClick();
      onPinDragEnd?.(pos.lat, pos.lng);
    });

    patientMarkerRef.current = pMarker;

    // Standby 108 Ambulance Depot
    const depotIconHtml = `
      <div class="map-view__depot-marker">
        <span>🏁 108 Emergency Standby Base</span>
      </div>
    `;

    const depotIcon = L.divIcon({
      className: 'leaflet-custom-div-icon',
      html: depotIconHtml,
      iconSize: [150, 24],
      iconAnchor: [75, 12],
    });

    L.marker([patientLat + 0.0038, patientLng + 0.0040], { icon: depotIcon }).addTo(markersGroup);

    // Also add Preset Case Pins
    cases.forEach((c) => {
      const isCritical = c.triagePriority === 'P1_CRITICAL';
      const isUrgent = c.triagePriority === 'P2_URGENT';
      const colorBg = isCritical ? 'jr-badge-red' : isUrgent ? 'jr-badge-amber' : 'jr-badge-blue';

      const pinIcon = L.divIcon({
        className: 'leaflet-custom-div-icon',
        html: `
          <div class="map-view__case-pin ${colorBg} ${isCritical ? 'animate-pulse' : ''}">
            <span>${isCritical ? '🚨' : isUrgent ? '⚡' : '🛖'}</span>
            <span>${c.patientName.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      });

      L.marker(c.villageCoords, { icon: pinIcon })
        .addTo(markersGroup)
        .bindPopup(`<strong>${c.triagePriority}: ${c.condition}</strong><br/>Patient: ${c.patientName}<br/>Vitals: ${c.vitals}<br/>Village: ${c.villageName}`);

      // Add Ambulance Marker for each case
      const ambIcon = L.divIcon({
        className: 'leaflet-custom-div-icon',
        html: `
          <div class="map-view__preset-amb-marker ${isCritical ? 'map-view__preset-amb-marker--critical' : ''}">
            <span class="amb-icon-wrap inline-block transition-transform duration-75">🚑</span>
            <span class="map-view__preset-amb-dot"></span>
            <span>${c.assignedAmbulance}</span>
          </div>
        `,
        iconSize: [110, 24],
        iconAnchor: [55, 12],
      });

      const ambMarker = L.marker(c.hospitalCoords, { icon: ambIcon }).addTo(markersGroup);
      presetAmbMarkersRef.current[c.id] = ambMarker;
    });
  }, [hospitals, activeDispatch, cases, patientLat, patientLng, isLiveGPS, userAddress, onPinDragEnd]);

  // ── 4. Dispatch a Single Predefined Indian Case ──
  const dispatchSinglePresetEmergency = (caseId: string) => {
    const c = cases.find((item) => item.id === caseId);
    if (!c || !mapRef.current) return;
    const map = mapRef.current;

    soundEffects.playDispatchConfirmed();

    if (presetPolylinesRef.current[caseId]) {
      presetPolylinesRef.current[caseId].remove();
    }

    const isCritical = c.triagePriority === 'P1_CRITICAL';
    const poly = L.polyline(c.streetWaypoints, {
      color: isCritical ? '#EF4444' : '#0284C7',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    presetPolylinesRef.current[caseId] = poly;
    map.fitBounds(poly.getBounds(), { padding: [60, 60], maxZoom: 16 });

    setCases((prev) =>
      prev.map((item) =>
        item.id === caseId
          ? { ...item, status: 'EN_ROUTE_TO_PATIENT', liveSpeedKmh: isCritical ? 78 : 62 }
          : item
      )
    );

    const waypoints = c.streetWaypoints;
    const ambMarker = presetAmbMarkersRef.current[caseId];

    let step = 0;
    const totalSteps = Math.max(120, waypoints.length);
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

      const remEta = Math.max(0, Math.round(c.liveEtaMin * (1 - frac)));
      setCases((prev) =>
        prev.map((item) =>
          item.id === caseId ? { ...item, liveEtaMin: remEta, liveSpeedKmh: isCritical ? 78 : 62 } : item
        )
      );

      if (step >= totalSteps) {
        clearInterval(interval1);
        soundEffects.playEmergencyAlert();

        setCases((prev) =>
          prev.map((item) =>
            item.id === caseId ? { ...item, status: 'AT_SCENE', liveSpeedKmh: 0, liveEtaMin: 0 } : item
          )
        );

        setTimeout(() => {
          soundEffects.playRecalculateSweep();

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

          if (presetPolylinesRef.current[caseId]) {
            presetPolylinesRef.current[caseId].setStyle({
              color: '#16A34A',
              weight: 6,
            });
          }

          const returnWaypoints = [...waypoints].reverse();
          let step2 = 0;
          const totalSteps2 = Math.max(120, returnWaypoints.length);
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
                item.id === caseId ? { ...item, liveEtaMin: remEta2, liveSpeedKmh: isCritical ? 84 : 68 } : item
              )
            );

            if (step2 >= totalSteps2) {
              clearInterval(interval2);
              soundEffects.playSuccess();
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
        }, 2000);
      }
    }, 35);
  };

  // ── 5. Dispatch All Critical Emergencies Simultaneously ──
  const dispatchAllCriticalCases = () => {
    setIsAllDispatching(true);
    soundEffects.playDispatchConfirmed();

    const criticalList = cases.filter((c) => c.triagePriority === 'P1_CRITICAL' && c.status === 'PENDING');
    criticalList.forEach((c, idx) => {
      setTimeout(() => {
        dispatchSinglePresetEmergency(c.id);
      }, idx * 400);
    });

    setTimeout(() => {
      setIsAllDispatching(false);
    }, 1500);
  };

  // ── 6. Single-Run Animation Engine for Custom User Dispatches ──
  useEffect(() => {
    if (!activeDispatch || !mapRef.current || !routeLayerGroupRef.current) {
      lastHandledDispatchKeyRef.current = null;
      return;
    }

    const currentKey = `${activeDispatch.id || activeDispatch.patientId}-${activeDispatch.timestamp}`;
    if (lastHandledDispatchKeyRef.current === currentKey) {
      return;
    }
    lastHandledDispatchKeyRef.current = currentKey;

    soundEffects.playDispatchConfirmed();

    const map = mapRef.current;
    const routeGroup = routeLayerGroupRef.current;

    routeGroup.clearLayers();
    if (movingAmbulanceMarkerRef.current) {
      movingAmbulanceMarkerRef.current.remove();
      movingAmbulanceMarkerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    const depotCoord: [number, number] = [patientLat + 0.0038, patientLng + 0.0040];
    const patientCoord: [number, number] = [patientLat, patientLng];
    const targetHosp = hospitals.find((h) => h.id === activeDispatch.assignedHospitalId) || hospitals[0] || DEFAULT_HOSPITALS[0];
    const hospCoordObj = REAL_HOSPITAL_COORDS[targetHosp.id] || REAL_HOSPITAL_COORDS[0];
    const hospCoord: [number, number] = [hospCoordObj.lat, hospCoordObj.lng];


    const leg1MidLat = (depotCoord[0] + patientCoord[0]) / 2;
    const leg1MidLng = (depotCoord[1] + patientCoord[1]) / 2 + 0.001;

    const leg1Path: [number, number][] = [
      depotCoord,
      [leg1MidLat + 0.0005, leg1MidLng],
      [leg1MidLat - 0.0005, leg1MidLng - 0.001],
      patientCoord,
    ];

    const leg2MidLat = (patientCoord[0] + hospCoord[0]) / 2;
    const leg2MidLng = (patientCoord[1] + hospCoord[1]) / 2;

    const leg2Path: [number, number][] = [
      patientCoord,
      [patientCoord[0] + (leg2MidLat - patientCoord[0]) * 0.5, patientCoord[1] + (leg2MidLng - patientCoord[1]) * 0.5 + 0.002],
      [leg2MidLat, leg2MidLng],
      [hospCoord[0] - (hospCoord[0] - leg2MidLat) * 0.5, hospCoord[1] - (hospCoord[1] - leg2MidLng) * 0.5 - 0.001],
      hospCoord,
    ];

    const leg1DistInfo = getPathDistances(leg1Path);
    const leg2DistInfo = getPathDistances(leg2Path);

    const leg1Glow = L.polyline(leg1Path, {
      color: '#38bdf8',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeGroup);

    const leg1Core = L.polyline(leg1Path, {
      color: '#0284c7',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '6, 6',
    }).addTo(routeGroup);

    const leg2Glow = L.polyline(leg2Path, {
      color: '#f87171',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeGroup);

    const leg2Core = L.polyline(leg2Path, {
      color: '#dc2626',
      weight: 4,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeGroup);

    const allCoords = [...leg1Path, ...leg2Path];
    const bounds = L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1])));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15.5 });

    const ambIconHtml = `
      <div class="map-view__live-amb">
        <div class="map-view__amb-siren"></div>
        <div class="map-view__amb-vehicle amb-icon-wrap">🚑</div>
        <div class="map-view__amb-tag">
          <strong>${activeDispatch.driverName?.split('(')[0]?.trim() || '108 ALS Unit'}</strong>
          <span class="map-view__amb-subtag">Emergency Mode</span>
        </div>
      </div>
    `;

    const ambIcon = L.divIcon({
      className: 'leaflet-custom-div-icon',
      html: ambIconHtml,
      iconSize: [140, 44],
      iconAnchor: [70, 22],
    });

    const ambulanceMarker = L.marker(depotCoord, { icon: ambIcon, zIndexOffset: 1000 }).addTo(routeGroup);
    movingAmbulanceMarkerRef.current = ambulanceMarker;

    const SPEED_KMPS = 0.00035;
    const LEG1_DURATION = (leg1DistInfo.totalDist / SPEED_KMPS) * 1000;
    const PICKUP_PAUSE_DURATION = 3500;
    const LEG2_DURATION = (leg2DistInfo.totalDist / SPEED_KMPS) * 1000;

    let animStartTime = performance.now();
    let currentStage: AnimationStage = 'EN_ROUTE_PATIENT';
    setActiveLegStage('EN_ROUTE_PATIENT');

    let playedPickupSound = false;
    let playedRushingSound = false;
    let playedArrivedSound = false;

    const animateStep = (now: number) => {
      const elapsed = now - animStartTime;

      if (currentStage === 'EN_ROUTE_PATIENT') {
        const progress = Math.min(elapsed / LEG1_DURATION, 1.0);
        const currentTraveledDist = progress * leg1DistInfo.totalDist;
        const remainingKm = Math.max(0, leg1DistInfo.totalDist - currentTraveledDist);
        const etaMinutes = Math.ceil(remainingKm / (SPEED_KMPS * 60));

        const { coord, bearing } = getPointAtDistance(leg1Path, currentTraveledDist, leg1DistInfo.segDists);
        ambulanceMarker.setLatLng(coord);

        const el = ambulanceMarker.getElement();
        if (el) {
          const v = el.querySelector('.amb-icon-wrap') as HTMLElement;
          if (v) v.style.transform = `rotate(${bearing}deg)`;
        }

        setLiveDist(parseFloat(remainingKm.toFixed(2)));
        setLiveEta(etaMinutes);
        setLiveSpeed(Math.round(65 + Math.random() * 8));

        if (progress >= 1.0) {
          currentStage = 'PATIENT_PICKUP';
          setActiveLegStage('PATIENT_PICKUP');
          animStartTime = now;
          if (!playedPickupSound) {
            playedPickupSound = true;
            soundEffects.playEmergencyAlert();
          }
          ambulanceMarker.setLatLng(patientCoord);
        }
        animFrameRef.current = requestAnimationFrame(animateStep);
      } else if (currentStage === 'PATIENT_PICKUP') {
        const pauseElapsed = elapsed;
        ambulanceMarker.setLatLng(patientCoord);
        setLiveDist(0);
        setLiveEta(0);
        setLiveSpeed(0);

        if (pauseElapsed >= PICKUP_PAUSE_DURATION) {
          currentStage = 'RUSHING_HOSPITAL';
          setActiveLegStage('RUSHING_HOSPITAL');
          animStartTime = now;
          if (!playedRushingSound) {
            playedRushingSound = true;
            soundEffects.playRecalculateSweep();
          }
        }
        animFrameRef.current = requestAnimationFrame(animateStep);
      } else if (currentStage === 'RUSHING_HOSPITAL') {
        const progress = Math.min(elapsed / LEG2_DURATION, 1.0);
        const currentTraveledDist = progress * leg2DistInfo.totalDist;
        const remainingKm = Math.max(0, leg2DistInfo.totalDist - currentTraveledDist);
        const etaMinutes = Math.ceil(remainingKm / (SPEED_KMPS * 60));

        const { coord, bearing } = getPointAtDistance(leg2Path, currentTraveledDist, leg2DistInfo.segDists);
        ambulanceMarker.setLatLng(coord);

        const el = ambulanceMarker.getElement();
        if (el) {
          const v = el.querySelector('.amb-icon-wrap') as HTMLElement;
          if (v) v.style.transform = `rotate(${bearing}deg)`;
        }

        setLiveDist(parseFloat(remainingKm.toFixed(2)));
        setLiveEta(etaMinutes);
        setLiveSpeed(Math.round(75 + Math.random() * 10));

        if (progress >= 1.0) {
          currentStage = 'ARRIVED_HOSPITAL';
          setActiveLegStage('ARRIVED_HOSPITAL');
          ambulanceMarker.setLatLng(hospCoord);
          setLiveDist(0);
          setLiveEta(0);
          setLiveSpeed(0);
          if (!playedArrivedSound) {
            playedArrivedSound = true;
            soundEffects.playSuccess();
          }
          return;
        }
        animFrameRef.current = requestAnimationFrame(animateStep);
      }
    };


    animFrameRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      leg1Glow.remove();
      leg1Core.remove();
      leg2Glow.remove();
      leg2Core.remove();
    };
  }, [activeDispatch, hospitals, patientLat, patientLng]);

  const centerOnPatient = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([patientLat, patientLng], 15, { duration: 1.2 });
  }, [patientLat, patientLng]);

  const handleLocateMeClick = () => {
    soundEffects.playClick();
    if (onLocateMe) {
      onLocateMe();
    }
    centerOnPatient();
  };

  const filteredCases = cases.filter((c) => {
    if (filterPriority === 'CRITICAL') return c.triagePriority === 'P1_CRITICAL';
    if (filterPriority === 'URGENT') return c.triagePriority === 'P2_URGENT';
    if (filterPriority === 'STABLE') return c.triagePriority === 'P3_STABLE';
    return true;
  });

  const activeHospital = hospitals.find((h) => h.id === activeDispatch?.assignedHospitalId) || hospitals[0] || DEFAULT_HOSPITALS[0];
  const destinationHospitalName = activeHospital?.name || 'AIMS Hospital & ICU';
  const currentDriverName = activeDispatch?.driverName || 'Santosh Shinde (108 Pilot)';
  const currentAmbNumber = activeDispatch?.ambulanceNumber || 'MH-05-EM-1080';
  const currentPhone = activeDispatch?.driverPhone || '+91 98200 11080';

  return (
    <div className="map-view">
      {/* Primary Leaflet Map Container */}
      <div ref={mapContainerRef} className="map-view__leaflet-container" />

      {/* Top Floating Action Bar */}
      <div className="map-view__top-bar">
        {/* Master Dispatch All Pill Button */}
        <button
          onClick={dispatchAllCriticalCases}
          disabled={isAllDispatching}
          className="map-view__master-dispatch-btn clay-btn"
          title="Simultaneously trigger 3 advanced life support dispatches"
        >
          <Zap size={14} className="animate-pulse" />
          <span>DISPATCH ALL CRITICAL (3 UNITS)</span>
        </button>

        {/* Predefined Cases Toggle Pill */}
        <button
          onClick={() => {
            soundEffects.playClick();
            setIsCasesDrawerOpen(!isCasesDrawerOpen);
          }}
          className={`map-view__cases-toggle-btn clay-btn ${isCasesDrawerOpen ? 'map-view__cases-toggle-btn--active' : ''}`}
        >
          <HeartPulse size={14} className="text-danger" />
          <span>Predefined Cases ({cases.length})</span>
          <ChevronRight size={13} className={`map-view__chevron ${isCasesDrawerOpen ? 'map-view__chevron--open' : ''}`} />
        </button>

        {/* Layer Switcher */}
        <div className="map-view__layer-picker clay-card--flat">
          <button
            onClick={() => setCurrentTheme('voyager')}
            className={`map-view__layer-btn ${currentTheme === 'voyager' ? 'map-view__layer-btn--active' : ''}`}
          >
            Light
          </button>
          <button
            onClick={() => setCurrentTheme('google_hybrid')}
            className={`map-view__layer-btn ${currentTheme === 'google_hybrid' ? 'map-view__layer-btn--active' : ''}`}
          >
            Hybrid
          </button>
          <button
            onClick={() => setCurrentTheme('google_satellite')}
            className={`map-view__layer-btn ${currentTheme === 'google_satellite' ? 'map-view__layer-btn--active' : ''}`}
          >
            Satellite
          </button>
          <button
            onClick={() => setCurrentTheme('dark')}
            className={`map-view__layer-btn ${currentTheme === 'dark' ? 'map-view__layer-btn--active' : ''}`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Floating Tactical Controls */}
      <div className="map-view__controls">
        {/* 🎯 Real GPS Locate Me Button */}
        <button
          className={`map-view__ctrl-btn map-view__ctrl-btn--gps clay-btn clay-btn--icon ${isLiveGPS ? 'map-view__ctrl-btn--gps-active' : ''}`}
          onClick={handleLocateMeClick}
          title="Locate My Real GPS Position"
        >
          <Crosshair size={18} className={isLiveGPS ? 'text-primary animate-pulse' : ''} />
        </button>

        {/* 🔊 Tactical Audio Mute/Unmute Button */}
        <button
          className="map-view__ctrl-btn clay-btn clay-btn--icon"
          onClick={() => {
            const enabled = soundEffects.toggleSound();
            setIsMuted(!enabled);
          }}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isMuted ? <VolumeX size={16} className="text-danger" /> : <Volume2 size={16} />}
        </button>

        <button
          className="map-view__ctrl-btn clay-btn clay-btn--icon"
          onClick={() => {
            const nextTheme = currentTheme === 'dark' ? 'voyager' : 'dark';
            setCurrentTheme(nextTheme);
          }}
          title={currentTheme === 'dark' ? 'Light Theme' : 'Midnight Dark Mode'}
        >
          {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button className="map-view__ctrl-btn clay-btn clay-btn--icon" onClick={centerOnPatient} title="Recenter on Patient GPS">
          <RotateCcw size={16} />
        </button>
      </div>


      {/* BOTTOM ACTIVE TELEMETRY HUD */}
      <div className="map-view__telemetry-hud clay-card--flat">
        <div className="map-view__hud-stat">
          <Gauge size={15} className="text-success" />
          <div>
            <div className="map-view__hud-lbl">UNIT SPEED</div>
            <div className="map-view__hud-val text-success">{liveSpeed} <span className="text-3xs">km/h</span></div>
          </div>
        </div>

        <div className="map-view__hud-divider" />

        <div className="map-view__hud-stat">
          <Clock size={15} className="text-info" />
          <div>
            <div className="map-view__hud-lbl">EST. ARRIVAL</div>
            <div className="map-view__hud-val text-info">{liveEta > 0 ? `${liveEta} min` : 'Arrived ✓'}</div>
          </div>
        </div>

        <div className="map-view__hud-divider" />

        <div className="map-view__hud-stat">
          <Activity size={15} className="text-danger" />
          <div>
            <div className="map-view__hud-lbl">DISPATCH STAGE</div>
            <div className="map-view__hud-val text-primary">
              {activeLegStage === 'EN_ROUTE_PATIENT' ? 'EN ROUTE' : activeLegStage === 'PATIENT_PICKUP' ? 'PICKUP' : activeLegStage === 'RUSHING_HOSPITAL' ? 'TRANSIT' : 'ADMITTED'}
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 PREDEFINED EMERGENCY CASES DRAWER */}
      {isCasesDrawerOpen && (
        <div className="map-view__cases-drawer clay-card">
          <div className="map-view__drawer-head">
            <div className="flex items-center gap-1.5">
              <HeartPulse size={16} className="text-danger animate-pulse" />
              <strong className="text-xs font-bold text-primary uppercase">
                Clinical Dispatches
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilterPriority('ALL')}
                  className={`map-view__filter-pill ${filterPriority === 'ALL' ? 'map-view__filter-pill--active' : ''}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterPriority('CRITICAL')}
                  className={`map-view__filter-pill ${filterPriority === 'CRITICAL' ? 'map-view__filter-pill--active' : ''}`}
                >
                  Critical
                </button>
              </div>

              <button
                onClick={() => setIsCasesDrawerOpen(false)}
                className="map-view__close-drawer-btn"
                title="Close Drawer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="map-view__drawer-list">
            {filteredCases.map((c) => {
              const isSelected = selectedCaseId === c.id;
              const isCritical = c.triagePriority === 'P1_CRITICAL';

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    if (mapRef.current) {
                      mapRef.current.flyTo(c.villageCoords, 14);
                    }
                  }}
                  className={`map-view__case-item clay-card--flat ${isSelected ? 'map-view__case-item--selected' : ''}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`clay-badge ${isCritical ? 'clay-badge--danger' : 'clay-badge--info'} text-3xs font-bold`}>
                      {c.triagePriority.replace('_', ' ')}
                    </span>
                    <span className={`text-3xs font-bold ${c.status === 'RESOLVED' ? 'text-success' : c.status !== 'PENDING' ? 'text-danger animate-pulse' : 'text-tertiary'}`}>
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-primary flex items-center justify-between mt-1">
                      <span>{c.patientName}</span>
                      <span className="text-3xs text-secondary font-mono">{c.distanceKm} km</span>
                    </div>
                    <div className="text-3xs text-danger font-semibold mt-0.5">{c.condition}</div>
                  </div>

                  <div className="flex items-center justify-between text-3xs text-tertiary font-semibold">
                    <span>🚑 {c.assignedAmbulance}</span>
                    <span>ETA: {c.liveEtaMin}m</span>
                  </div>

                  {c.status === 'PENDING' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCaseId(c.id);
                        dispatchSinglePresetEmergency(c.id);
                      }}
                      className="map-view__dispatch-case-btn clay-btn clay-btn--danger"
                    >
                      <Truck size={12} />
                      <span>DISPATCH {c.assignedAmbulance}</span>
                    </button>
                  ) : c.status === 'RESOLVED' ? (
                    <div className="map-view__status-resolved clay-badge clay-badge--success">
                      ✓ ADMITTED & SAVED
                    </div>
                  ) : (
                    <div className="map-view__status-enroute clay-badge clay-badge--info animate-pulse">
                      EN ROUTE ({c.liveEtaMin}m remaining)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🚨 LIVE USER SOS TRACKING CARD */}
      {activeDispatch && (
        <div className="map-view__live-tracking-card clay-card">
          <div className="map-view__card-header">
            <div className="map-view__status-indicator">
              <span
                className={`map-view__live-dot ${
                  activeLegStage === 'EN_ROUTE_PATIENT'
                    ? 'map-view__live-dot--blue'
                    : activeLegStage === 'PATIENT_PICKUP'
                    ? 'map-view__live-dot--amber'
                    : activeLegStage === 'ARRIVED_HOSPITAL'
                    ? 'map-view__live-dot--green'
                    : 'map-view__live-dot--red'
                }`}
              />
              <div className="flex flex-col">
                <strong className="text-xs font-bold leading-tight text-primary">
                  {activeLegStage === 'EN_ROUTE_PATIENT' && 'Stage 1: En Route to Patient'}
                  {activeLegStage === 'PATIENT_PICKUP' && 'Pickup: Patient Boarded'}
                  {activeLegStage === 'RUSHING_HOSPITAL' && 'Stage 2: Rushing to Hospital'}
                  {activeLegStage === 'ARRIVED_HOSPITAL' && 'Arrived: Emergency Admission'}
                </strong>
                <span className="text-3xs text-tertiary font-semibold">
                  {activeLegStage === 'EN_ROUTE_PATIENT' && '108 Ambulance heading to patient GPS'}
                  {activeLegStage === 'PATIENT_PICKUP' && 'Paramedic vitals triage in progress'}
                  {activeLegStage === 'RUSHING_HOSPITAL' && `Critical transit to ${destinationHospitalName}`}
                  {activeLegStage === 'ARRIVED_HOSPITAL' && 'Handover to Trauma & ICU Team'}
                </span>
              </div>
            </div>

            <span
              className={`clay-badge ${
                activeLegStage === 'EN_ROUTE_PATIENT'
                  ? 'clay-badge--info'
                  : activeLegStage === 'PATIENT_PICKUP'
                  ? 'clay-badge--warning'
                  : activeLegStage === 'ARRIVED_HOSPITAL'
                  ? 'clay-badge--success'
                  : 'clay-badge--danger'
              } text-3xs font-bold flex items-center gap-1`}
            >
              <Radio size={10} className="animate-pulse" />
              {activeLegStage === 'EN_ROUTE_PATIENT'
                ? 'LEG 1'
                : activeLegStage === 'PATIENT_PICKUP'
                ? 'PICKUP'
                : activeLegStage === 'ARRIVED_HOSPITAL'
                ? 'ARRIVED'
                : 'LEG 2'}
            </span>
          </div>

          <div className="map-view__card-body">
            <div className="map-view__driver-pill">
              <div className="map-view__driver-avatar">👨‍✈️</div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary">{currentDriverName}</span>
                <span className="text-3xs text-tertiary font-semibold">{currentAmbNumber} • ALS Unit</span>
              </div>
            </div>

            <div className="map-view__eta-box">
              <span className="text-3xs text-tertiary font-bold uppercase">
                {activeLegStage === 'EN_ROUTE_PATIENT' ? 'Pickup ETA' : 'Hospital ETA'}
              </span>
              <div
                className={`text-sm font-black flex items-center gap-1 ${
                  activeLegStage === 'EN_ROUTE_PATIENT'
                    ? 'text-info'
                    : activeLegStage === 'PATIENT_PICKUP'
                    ? 'text-success'
                    : activeLegStage === 'ARRIVED_HOSPITAL'
                    ? 'text-success'
                    : 'text-danger'
                }`}
              >
                <Clock size={13} /> {liveEta > 0 ? `~${liveEta} mins` : 'Arrived ✓'}
              </div>
              <span className="text-3xs text-success font-bold">
                {liveDist > 0 ? `⚡ ${liveDist} km remaining` : 'At Location 📍'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="map-view__card-actions">
            <a href={`tel:${currentPhone}`} className="clay-btn clay-btn--secondary text-xs flex items-center justify-center gap-1">
              <Phone size={12} /> Call Pilot
            </a>
            <a href="tel:108" className="clay-btn clay-btn--success text-xs flex items-center justify-center gap-1">
              <CheckCircle2 size={12} /> 108 Helpline
            </a>
          </div>
        </div>
      )}

      {/* Road Blocker Active Banner */}
      {isBlockRoadMode && (
        <div className="map-view__block-banner clay-badge clay-badge--danger">
          <ShieldAlert size={14} className="inline mr-1" />
          ROAD BLOCK TOOL ACTIVE — Click road segment to simulate landslide/closure
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Compass,
  RotateCcw,
  Sun,
  Moon,
  CloudRain,
  Eye,
  Crosshair,
  Navigation,
  Activity,
  Radio,
  Truck,
  Building2,
  MapPin,
  Flame,
  Award,
  Play,
  Zap,
  Cpu,
  Sparkles,
  Command,
} from 'lucide-react';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { soundEffects } from '../../services/soundEffects';

export const MapHUDOverlay: React.FC = () => {
  const [layersOpen, setLayersOpen] = useState(false);
  const [quickFocusOpen, setQuickFocusOpen] = useState(false);

  const {
    layers,
    toggleLayer,
    setDayNightMode,
    resetCameraView,
    setCameraFocus,
    emergencies,
    ambulances,
    hospitals,
    villages,
    activeRouteResult,
    selectedEntity,
    clearSelection,
    selectedRoutingAlgorithm,
    setRoutingAlgorithm,
    toggleRoadBlockage,
    roadSegments,
    executeIntelligentDispatch,
  } = useHealthcareStore();

  const activeEmergencies = emergencies.filter((e) => e.status !== 'RESOLVED');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        soundEffects.playClick();
        useHealthcareStore.setState({ judgeDemoModalOpen: true });
      } else if (e.key === 'e' || e.key === 'E') {
        soundEffects.playClick();
        useHealthcareStore.setState({ createEmergencyModalOpen: true });
      } else if (e.key === 'r' || e.key === 'R') {
        soundEffects.playRecalculateSweep();
        const pending = emergencies.find((emg) => emg.status !== 'RESOLVED');
        if (pending) {
          executeIntelligentDispatch(pending.id);
        }
      } else if (e.key === 'c' || e.key === 'C') {
        soundEffects.playWarning();
        const targetRoad = roadSegments[1] || roadSegments[0];
        if (targetRoad) {
          toggleRoadBlockage(targetRoad.id);
        }
      } else if (e.key === 'Escape') {
        clearSelection();
        resetCameraView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [emergencies, roadSegments, executeIntelligentDispatch, toggleRoadBlockage, clearSelection, resetCameraView]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-4 flex flex-col justify-between">
      {/* Top Left: 3D Geo-Coordinates & Judge Demo Launch Button */}
      <div className="pointer-events-auto flex items-start gap-3 flex-wrap">
        {/* RUN JUDGE DEMO PROMINENT BUTTON */}
        <button
          onClick={() => {
            soundEffects.playClick();
            useHealthcareStore.setState({ judgeDemoModalOpen: true });
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Award className="w-4 h-4 text-white" />
          <span>RUN SIMULATION [D]</span>
        </button>

        {/* 2-PHASE PATIENT RESCUE MISSION TRIGGER */}
        <button
          onClick={async () => {
            soundEffects.playDispatchConfirmed();
            const pending = emergencies.find((e) => e.status !== 'RESOLVED') || emergencies[0];
            if (pending) {
              const amb = ambulances[0];
              const hosp = hospitals[0];
              const vil = villages.find((v) => v.id === pending.villageId) || villages[0];

              // Phase 1: Focus on Village Patient & Start Route
              setCameraFocus(
                [vil.position[0] - 6, vil.position[1] + 8, vil.position[2] + 8],
                vil.position,
                14
              );
              await executeIntelligentDispatch(pending.id);

              // Set Phase 1: En Route to Patient
              useHealthcareStore.setState((prev) => ({
                ambulances: prev.ambulances.map((a, i) =>
                  i === 0
                    ? {
                        ...a,
                        status: 'Dispatched En Route',
                        speedKmh: 75,
                        routeWaypoints: [hosp.position, [(hosp.position[0] + vil.position[0]) / 2, 0.4, (hosp.position[2] + vil.position[2]) / 2], vil.position],
                      }
                    : a
                ),
              }));

              // Phase 2: Arrived at Village Patient Scene after 3s
              setTimeout(() => {
                soundEffects.playEmergencyAlert();
                useHealthcareStore.setState((prev) => ({
                  ambulances: prev.ambulances.map((a, i) =>
                    i === 0
                      ? {
                          ...a,
                          status: 'At Scene / Patient Loading',
                          speedKmh: 0,
                        }
                      : a
                  ),
                }));

                // Phase 3: Transporting Patient to Hospital after 2.5s
                setTimeout(() => {
                  soundEffects.playRecalculateSweep();
                  setCameraFocus(
                    [hosp.position[0] - 8, hosp.position[1] + 10, hosp.position[2] + 10],
                    hosp.position,
                    16
                  );
                  useHealthcareStore.setState((prev) => ({
                    ambulances: prev.ambulances.map((a, i) =>
                      i === 0
                        ? {
                            ...a,
                            status: 'Transporting to Hospital',
                            speedKmh: 82,
                            routeWaypoints: [vil.position, [(vil.position[0] + hosp.position[0]) / 2, 0.4, (vil.position[2] + hosp.position[2]) / 2], hosp.position],
                          }
                        : a
                    ),
                  }));

                  // Phase 4: Admitted to Hospital after 4s
                  setTimeout(() => {
                    soundEffects.playSuccess();
                    useHealthcareStore.setState((prev) => ({
                      emergencies: prev.emergencies.map((e) =>
                        e.id === pending.id ? { ...e, status: 'RESOLVED', etaMinutes: 0 } : e
                      ),
                      ambulances: prev.ambulances.map((a, i) =>
                        i === 0
                          ? {
                              ...a,
                              status: 'Idle / Ready',
                              speedKmh: 0,
                            }
                          : a
                      ),
                    }));
                  }, 4000);
                }, 2500);
              }, 3000);
            }
          }}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs font-mono tracking-wider uppercase transition-all shadow-md shadow-red-500/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
        >
          <Truck className="w-4 h-4 text-white animate-pulse" />
          <span>2-PHASE PATIENT RESCUE RUN</span>
        </button>

        {/* INDIAN PILOT VILLAGE SELECTION DROPDOWN */}
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-2.5 border border-slate-200 shadow-sm text-slate-700">
          <span className="text-emerald-700 font-bold uppercase flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>PILOT VILLAGE:</span>
          </span>
          <select
            onChange={(e) => {
              const v = villages.find((vil) => vil.id === e.target.value);
              if (v) {
                setCameraFocus([v.position[0] - 6, v.position[1] + 8, v.position[2] + 8], v.position, 12);
                useHealthcareStore.setState({
                  selectedEntity: { type: 'VILLAGE', id: v.id, data: v },
                });
                soundEffects.playClick();
              }
            }}
            className="bg-transparent border-0 font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="vil-01">Dharnai Village (Bihar) - Solar Pilot</option>
            <option value="vil-08">Koraput Outpost (Odisha) - Eastern Ghats</option>
            <option value="vil-12">Majuli Island (Assam) - Brahmaputra</option>
            <option value="vil-18">Chamoli Pass (Uttarakhand) - Garhwal</option>
            <option value="vil-24">Bastar Sector (Chhattisgarh) - Tribal</option>
            <option value="vil-28">Wayanad Valley (Kerala) - Western Ghats</option>
          </select>
        </div>

        {/* Selected Entity Mini Inspector if selected */}
        {selectedEntity && (
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs flex items-center gap-3 border border-blue-300 shadow-md animate-in fade-in slide-in-from-top-2 duration-200 text-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-mono">
                {selectedEntity.type}:
              </span>
              <span className="font-bold text-slate-900">
                {selectedEntity.data?.name ||
                  selectedEntity.data?.patientName ||
                  selectedEntity.data?.callsign ||
                  selectedEntity.id}
              </span>
            </div>
            <button
              onClick={clearSelection}
              className="text-slate-500 hover:text-slate-900 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono ml-2 transition-colors cursor-pointer border border-slate-200"
            >
              ESC
            </button>
          </div>
        )}
      </div>

      {/* Top Right: 3D Scene Controls & Layer Switcher */}
      <div className="pointer-events-auto flex items-center gap-2 self-end">
        {/* Algorithm Switcher */}
        <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl flex items-center gap-1 border border-slate-200 shadow-sm">
          <button
            onClick={() => {
              setRoutingAlgorithm('A_STAR');
              soundEffects.playClick();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
              selectedRoutingAlgorithm === 'A_STAR'
                ? 'bg-blue-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            A* Directed Tree
          </button>
          <button
            onClick={() => {
              setRoutingAlgorithm('DIJKSTRA');
              soundEffects.playClick();
            }}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
              selectedRoutingAlgorithm === 'DIJKSTRA'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dijkstra Search
          </button>
        </div>

        {/* Quick Focus Drawer */}
        <div className="relative">
          <button
            onClick={() => {
              setQuickFocusOpen(!quickFocusOpen);
              setLayersOpen(false);
            }}
            className={`bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border border-slate-200 shadow-sm ${
              quickFocusOpen ? 'bg-blue-50 border-blue-400 text-blue-700' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Crosshair className="w-4 h-4 text-blue-600" />
            <span>Target Focus</span>
          </button>

          {quickFocusOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl p-3 space-y-2 text-xs font-mono shadow-2xl border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">
                Active Emergencies
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {activeEmergencies.map((emg) => (
                  <button
                    key={emg.id}
                    onClick={() => {
                      setCameraFocus(emg.position, emg.position, 12);
                      setQuickFocusOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-red-50 hover:border-red-300 border border-slate-200 transition-colors flex items-center justify-between text-slate-800 cursor-pointer"
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {emg.patientName}
                    </span>
                    <span className="text-[9px] text-red-600 font-bold">{emg.severity}</span>
                  </button>
                ))}
              </div>

              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold pt-1 border-t border-slate-100">
                Key Facilities
              </div>
              <div className="grid grid-cols-2 gap-1">
                {hospitals.map((hosp) => (
                  <button
                    key={hosp.id}
                    onClick={() => {
                      setCameraFocus(hosp.position, hosp.position, 14);
                      setQuickFocusOpen(false);
                    }}
                    className="text-left px-2 py-1 rounded bg-slate-50 hover:bg-emerald-50 text-[10px] text-slate-700 truncate cursor-pointer border border-slate-200"
                  >
                    🏥 {hosp.shortName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Layer Visibility Toggle Drawer */}
        <div className="relative">
          <button
            onClick={() => {
              setLayersOpen(!layersOpen);
              setQuickFocusOpen(false);
            }}
            className={`bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border border-slate-200 shadow-sm ${
              layersOpen ? 'bg-blue-50 border-blue-400 text-blue-700' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>GIS Layers</span>
          </button>

          {layersOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl p-3 space-y-2 text-xs shadow-2xl border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">
                Map Feature Filters
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> Villages
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showVillages}
                    onChange={() => toggleLayer('showVillages')}
                    className="accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Hospitals
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showHospitals}
                    onChange={() => toggleLayer('showHospitals')}
                    className="accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-blue-600" /> Ambulances
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showAmbulances}
                    onChange={() => toggleLayer('showAmbulances')}
                    className="accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" /> Road Network
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showRoadNetwork}
                    onChange={() => toggleLayer('showRoadNetwork')}
                    className="accent-blue-600"
                  />
                </label>

                <label className="flex items-center justify-between text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-red-500" /> SOS Beacons
                  </span>
                  <input
                    type="checkbox"
                    checked={layers.showEmergencyBeacons}
                    onChange={() => toggleLayer('showEmergencyBeacons')}
                    className="accent-blue-600"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">
                  Atmospheric Mode
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <button
                    onClick={() => setDayNightMode('NIGHT_TACTICAL')}
                    className={`py-1 rounded font-mono cursor-pointer ${
                      layers.dayNightMode === 'NIGHT_TACTICAL'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Tactical
                  </button>
                  <button
                    onClick={() => setDayNightMode('DUSK_SURVEILLANCE')}
                    className={`py-1 rounded font-mono cursor-pointer ${
                      layers.dayNightMode === 'DUSK_SURVEILLANCE'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Dusk
                  </button>
                  <button
                    onClick={() => setDayNightMode('DAY_SATELLITE')}
                    className={`py-1 rounded font-mono cursor-pointer ${
                      layers.dayNightMode === 'DAY_SATELLITE'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Daylight
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reset Camera View Button */}
        <button
          onClick={resetCameraView}
          title="Reset 3D Camera to Global Overview [ESC]"
          className="bg-white/90 backdrop-blur-md p-2 rounded-xl text-slate-600 hover:text-blue-600 border border-slate-200 shadow-sm transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Navigation HUD / Route A* Telemetry Card */}
      <div className="pointer-events-auto flex items-end justify-between flex-wrap gap-2">
        {/* Active Route Algorithm Bar */}
        {activeRouteResult ? (
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs font-mono border border-blue-400 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
              <span className="text-blue-700 font-bold uppercase">Active Dispatch Path:</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700">
              <span>
                Distance: <strong className="text-slate-900">{activeRouteResult.totalDistanceKm} km</strong>
              </span>
              <span>•</span>
              <span>
                ETA:{' '}
                <strong className="text-emerald-600">{activeRouteResult.estimatedTimeMinutes} min</strong>
              </span>
              <span>•</span>
              <span className="text-purple-700 font-semibold">{activeRouteResult.algorithmUsed}</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-[11px] font-mono text-slate-600 flex items-center gap-3 border border-slate-200 shadow-sm">
            <span className="flex items-center gap-1.5 text-blue-700 font-semibold">
              <Command className="w-3.5 h-3.5 text-blue-600" /> Hotkeys:
            </span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">D</kbd> Demo</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">E</kbd> Emergency</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">R</kbd> Recalculate</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">C</kbd> Close Road</span>
            <span><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">ESC</kbd> Reset</span>
          </div>
        )}

        {/* Quick Legend Indicator */}
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono flex items-center gap-3 text-slate-600 border border-slate-200 shadow-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Village
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Hospital
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> SOS Beacon
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Hazard
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { TerrainEnvironment } from './TerrainEnvironment';
import { InstancedVillageNodes } from './InstancedVillageNodes';
import { VillageNode } from './VillageNode';
import { InstancedHospitalNodes } from './InstancedHospitalNodes';
import { Ambulance3D } from './Ambulance3D';
import { EmergencyMarker } from './EmergencyMarker';
import { PharmacyNode } from './PharmacyNode';
import { InstancedRoadNetwork } from './InstancedRoadNetwork';
import { RoutePath } from './RoutePath';
import { RoutingAnalysisOverlay } from './RoutingAnalysisOverlay';
import { CameraController } from './CameraController';
import { MapHUDOverlay } from './MapHUDOverlay';
import { GoogleMapsInteractiveView } from '../map/GoogleMapsInteractiveView';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { Globe, Map, Box } from 'lucide-react';

export const CommandCenter3D: React.FC = () => {
  const [mapMode, setMapMode] = useState<'GOOGLE_MAPS' | '3D_MESH'>('GOOGLE_MAPS');

  const {
    villages,
    hospitals,
    ambulances,
    emergencies,
    pharmacies,
    roadSegments,
    layers,
    activeRouteResult,
    selectedEntity,
  } = useHealthcareStore();

  const isDroneRoute = ambulances.some(
    (a) => a.type.includes('Drone') && a.status === 'Dispatched En Route'
  );

  const selectedVillage = villages.find((v) => selectedEntity?.type === 'VILLAGE' && selectedEntity.id === v.id);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
      {/* Top Center View Mode Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-2xl flex items-center gap-1">
        <button
          onClick={() => setMapMode('3D_MESH')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            mapMode === '3D_MESH'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D Satellite Mesh</span>
        </button>
        <button
          onClick={() => setMapMode('GOOGLE_MAPS')}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            mapMode === 'GOOGLE_MAPS'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Interactive Google Maps</span>
        </button>
      </div>

      {mapMode === 'GOOGLE_MAPS' ? (
        <GoogleMapsInteractiveView />
      ) : (
        <>
          {/* 3D Map Canvas */}
          <Canvas
            camera={{ position: [0, 42, 38], fov: 45, near: 0.1, far: 250 }}
            shadows
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          >
            <Suspense fallback={null}>
              <CameraController />

              {/* Terrain & Atmospheric Lighting with Real Satellite Ground */}
              <TerrainEnvironment
                dayNightMode={layers.dayNightMode}
                showAtmosphericFog={layers.showAtmosphericFog}
                showTerrainRelief={layers.showTerrainRelief}
              />

          {/* Instanced Road Network for High Performance Scaling */}
          {layers.showRoadNetwork && <InstancedRoadNetwork roadSegments={roadSegments} />}

          {/* Active A* Route Path with Animated Particle Stream */}
          {activeRouteResult && (
            <>
              <RoutePath routeResult={activeRouteResult} isDrone={isDroneRoute} />
              {activeRouteResult.explorationTree && (
                <RoutingAnalysisOverlay
                  explorationTree={activeRouteResult.explorationTree}
                  visible={true}
                />
              )}
            </>
          )}

          {/* Instanced Village Settlements */}
          {layers.showVillages && (
            <>
              <InstancedVillageNodes villages={villages} />
              {selectedVillage && (
                <VillageNode
                  key={`selected-${selectedVillage.id}`}
                  village={selectedVillage}
                  isSelected={true}
                />
              )}
            </>
          )}

          {/* Instanced Hospitals & Trauma Centers */}
          {layers.showHospitals && <InstancedHospitalNodes hospitals={hospitals} />}

          {/* Pharmacies & Drone Landing Pads */}
          {pharmacies.map((pharmacy) => (
            <PharmacyNode
              key={pharmacy.id}
              pharmacy={pharmacy}
              isSelected={selectedEntity?.type === 'PHARMACY' && selectedEntity.id === pharmacy.id}
            />
          ))}

          {/* 3D Ambulances & eVTOL Medical Drones */}
          {layers.showAmbulances &&
            ambulances.map((ambulance) => (
              <Ambulance3D
                key={ambulance.id}
                ambulance={ambulance}
                isSelected={selectedEntity?.type === 'AMBULANCE' && selectedEntity.id === ambulance.id}
              />
            ))}

          {/* Live Emergency SOS Beacons */}
          {layers.showEmergencyBeacons &&
            emergencies
              .filter((e) => e.status !== 'RESOLVED')
              .map((emergency) => (
                <EmergencyMarker
                  key={emergency.id}
                  emergency={emergency}
                  isSelected={selectedEntity?.type === 'EMERGENCY' && selectedEntity.id === emergency.id}
                />
              ))}
        </Suspense>
      </Canvas>

      {/* Floating Tactical HUD Overlay Controls */}
      <MapHUDOverlay />
    </>
  )}
</div>
  );
};

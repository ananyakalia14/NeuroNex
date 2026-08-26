import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { createGoogleSatelliteTexture, INDIAN_VILLAGE_COORDINATES } from '../../services/SatelliteTileService';

interface TerrainEnvironmentProps {
  dayNightMode: 'NIGHT_TACTICAL' | 'DAY_SATELLITE' | 'DUSK_SURVEILLANCE';
  showAtmosphericFog: boolean;
  showTerrainRelief: boolean;
  activeVillageKey?: keyof typeof INDIAN_VILLAGE_COORDINATES;
}

export const TerrainEnvironment: React.FC<TerrainEnvironmentProps> = ({
  dayNightMode,
  showAtmosphericFog,
  showTerrainRelief,
  activeVillageKey = 'dharnai',
}) => {
  const [satelliteTexture, setSatelliteTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const tex = createGoogleSatelliteTexture(activeVillageKey, (updatedTex) => {
      setSatelliteTexture(updatedTex);
    });
    setSatelliteTexture(tex);
  }, [activeVillageKey]);

  // Generate terrain geometry with realistic hills, valleys, and mountain relief
  const terrainGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(90, 90, 64, 64);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);

      // Realistic elevation contours
      const mountainNoise = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 1.6;
      const ridgeNoise = Math.sin((x + y) * 0.12) * 0.9;
      const riverBed = Math.exp(-Math.pow((x - y * 0.4) * 0.09, 2)) * -1.4;

      let elevation = mountainNoise + ridgeNoise + riverBed;
      if (elevation < -0.8) elevation = -0.8;

      pos.setZ(i, elevation); // Z before rotation
    }

    geo.computeVertexNormals();
    return geo;
  }, []);

  const gridColor =
    dayNightMode === 'NIGHT_TACTICAL'
      ? '#0284C7'
      : dayNightMode === 'DUSK_SURVEILLANCE'
      ? '#7C3AED'
      : '#38BDF8';

  const fogColor =
    dayNightMode === 'NIGHT_TACTICAL'
      ? '#0F172A'
      : dayNightMode === 'DUSK_SURVEILLANCE'
      ? '#1E1B4B'
      : '#E0F2FE';

  return (
    <group>
      {/* Atmospheric Fog */}
      {showAtmosphericFog && (
        <fog
          attach="fog"
          args={[fogColor, 45, 130]}
        />
      )}

      {/* Main Ground Mesh with Google Maps Satellite Textured Surface */}
      <mesh
        geometry={terrainGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.2, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          map={satelliteTexture || undefined}
          roughness={0.65}
          metalness={0.15}
          wireframe={!showTerrainRelief}
        />
      </mesh>

      {/* Tactical Coordinate Grid Overlay */}
      <gridHelper
        args={[90, 45, gridColor, '#334155']}
        position={[0, 0.03, 0]}
      />

      {/* Lighting Rig */}
      <ambientLight intensity={dayNightMode === 'DAY_SATELLITE' ? 1.3 : 0.85} />

      {/* Directional Sunlight / Satellite Scanner */}
      <directionalLight
        position={[30, 55, 25]}
        intensity={1.5}
        color="#FFFFFF"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Tactical Rim Light */}
      <directionalLight
        position={[-35, 25, -35]}
        intensity={0.6}
        color="#38BDF8"
      />
    </group>
  );
};



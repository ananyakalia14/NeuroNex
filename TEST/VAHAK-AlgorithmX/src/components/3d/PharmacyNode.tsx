import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Pharmacy } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface PharmacyNodeProps {
  pharmacy: Pharmacy;
  isSelected: boolean;
}

export const PharmacyNode: React.FC<PharmacyNodeProps> = ({ pharmacy, isSelected }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const crossRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crossRef.current) {
      crossRef.current.rotation.y = t * 0.6;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectEntity('PHARMACY', pharmacy.id, pharmacy);
  };

  return (
    <group position={pharmacy.position} onClick={handleClick}>
      {/* Octagonal depot building */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[1.1, 1.2, 0.5, 8]} />
        <meshStandardMaterial
          color="#064E3B"
          metalness={0.7}
          roughness={0.3}
          emissive="#047857"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Drone Launch Pad Ring */}
      <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.75, 16]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.8} />
      </mesh>

      {/* Floating Green Holographic Medicine Cross */}
      <group ref={crossRef} position={[0, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[0.15, 0.5, 0.1]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={1.5}
            roughness={0.1}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[0.5, 0.15, 0.1]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={1.5}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* HTML Data Tag */}
      <Html
        position={[0, 1.8, 0]}
        center
        distanceFactor={28}
        zIndexRange={[90, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          className={`px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap transition-all duration-200 border shadow-lg ${
            isSelected
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 scale-110 shadow-emerald-500/30'
              : 'bg-slate-950/85 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{pharmacy.name.split(' ')[0]} Hub</span>
            <span className="text-emerald-400 text-[9px]">
              {pharmacy.dronePadReady ? 'eVTOL READY' : 'PAD BUSY'}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};

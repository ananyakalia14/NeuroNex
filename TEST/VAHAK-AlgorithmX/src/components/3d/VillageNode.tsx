import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Village } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface VillageNodeProps {
  village: Village;
  isSelected: boolean;
}

export const VillageNode: React.FC<VillageNodeProps> = ({ village, isSelected }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      const scale = 1 + Math.sin(t * 2 + village.population * 0.001) * 0.15;
      ringRef.current.scale.set(scale, scale, 1);
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.5;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectEntity('VILLAGE', village.id, village);
  };

  const hasEmergencies = village.activeEmergencies > 0;
  const mainColor = hasEmergencies ? '#F97316' : '#22D3EE';

  return (
    <group position={village.position} onClick={handleClick}>
      {/* Base cylinder foundation */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.2, 16]} />
        <meshStandardMaterial
          color="#0F172A"
          metalness={0.8}
          roughness={0.3}
          emissive="#0284C7"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Cluster of settlement buildings (micro-structures) */}
      <mesh position={[-0.4, 0.35, -0.3]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.3, 0.3, 0.2]}>
        <boxGeometry args={[0.5, 0.35, 0.5]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh position={[-0.2, 0.25, 0.4]}>
        <boxGeometry args={[0.35, 0.3, 0.35]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Central Holographic Beacon Pin */}
      <mesh ref={coreRef} position={[0, 0.7, 0]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial
          color={mainColor}
          emissive={mainColor}
          emissiveIntensity={isSelected ? 1.5 : 0.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Radar Ring */}
      <mesh ref={ringRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 32]} />
        <meshBasicMaterial
          color={mainColor}
          transparent
          opacity={isSelected ? 0.9 : 0.45}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Selected Halo */}
      {isSelected && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.6, 1.8, 32]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 2.5D HTML Tag Overlay */}
      <Html
        position={[0, 1.5, 0]}
        center
        distanceFactor={28}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          className={`px-2 py-1 rounded-md text-[11px] font-mono tracking-tight whitespace-nowrap transition-all duration-200 border ${
            isSelected
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-lg shadow-cyan-500/30 scale-110'
              : hasEmergencies
              ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
              : 'bg-slate-900/80 border-slate-700/70 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                hasEmergencies ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400'
              }`}
            />
            {village.name}
          </div>
          <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400 mt-0.5 font-sans">
            <span>Pop: {village.population.toLocaleString()}</span>
            {hasEmergencies && (
              <span className="text-amber-400 font-bold px-1 rounded bg-amber-950/60 border border-amber-500/30">
                {village.activeEmergencies} SOS
              </span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};

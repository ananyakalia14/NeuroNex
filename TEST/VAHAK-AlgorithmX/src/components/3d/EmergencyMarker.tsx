import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Emergency } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface EmergencyMarkerProps {
  emergency: Emergency;
  isSelected: boolean;
}

export const EmergencyMarker: React.FC<EmergencyMarkerProps> = ({ emergency, isSelected }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const openDispatchModal = useHealthcareStore((state) => state.openDispatchModal);
  
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const pillarRef = useRef<THREE.Mesh>(null);
  const diamondRef = useRef<THREE.Mesh>(null);

  const isCritical = emergency.severity === 'Critical';
  const color =
    emergency.severity === 'Critical'
      ? '#EF4444'
      : emergency.severity === 'High'
      ? '#F97316'
      : emergency.severity === 'Medium'
      ? '#F59E0B'
      : '#22C55E';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (ring1Ref.current) {
      const scale1 = 1 + ((t * 1.5) % 2.5);
      const opacity1 = Math.max(0, 1 - ((t * 1.5) % 2.5) / 2.5);
      ring1Ref.current.scale.set(scale1, scale1, 1);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = opacity1 * 0.8;
    }

    if (ring2Ref.current) {
      const scale2 = 1 + (((t * 1.5) + 1.2) % 2.5);
      const opacity2 = Math.max(0, 1 - (((t * 1.5) + 1.2) % 2.5) / 2.5);
      ring2Ref.current.scale.set(scale2, scale2, 1);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = opacity2 * 0.8;
    }

    if (diamondRef.current) {
      diamondRef.current.rotation.y = t * 2;
      diamondRef.current.position.y = 2.0 + Math.sin(t * 4) * 0.15;
    }

    if (pillarRef.current) {
      (pillarRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 3) * 0.2;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectEntity('EMERGENCY', emergency.id, emergency);
  };

  return (
    <group position={emergency.position} onClick={handleClick}>
      {/* Vertical Warning Light Pillar */}
      <mesh ref={pillarRef} position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 2.0, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>

      {/* Pulsing Beacon Diamond */}
      <mesh ref={diamondRef} position={[0, 2.0, 0]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.2}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Point light shining on ground */}
      <pointLight color={color} intensity={2.5} distance={6} position={[0, 1.2, 0]} />

      {/* Expanding Radar Wave 1 */}
      <mesh ref={ring1Ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Expanding Radar Wave 2 */}
      <mesh ref={ring2Ref} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* 2.5D HTML Emergency SOS Pill */}
      <Html
        position={[0, 2.8, 0]}
        center
        distanceFactor={28}
        zIndexRange={[120, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <div
          onClick={handleClick}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono tracking-tight whitespace-nowrap cursor-pointer transition-all duration-200 border shadow-2xl backdrop-blur-md ${
            isSelected
              ? 'bg-red-950/95 border-red-400 text-red-100 scale-110 shadow-red-500/50 ring-2 ring-red-400/50'
              : isCritical
              ? 'bg-red-950/90 border-red-500/80 text-red-200 shadow-red-900/40 animate-pulse-slow'
              : 'bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-amber-900/40'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                isCritical ? 'bg-red-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span className="text-red-400 font-black">SOS</span>
            <span>{emergency.patientName}</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-red-900/80 text-red-200 font-sans">
              {emergency.severity}
            </span>
          </div>
          <div className="text-[10px] text-slate-300 font-sans truncate max-w-[180px] mt-0.5">
            {emergency.condition}
          </div>
          <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400 mt-1 font-mono border-t border-slate-700/60 pt-0.5">
            <span>{emergency.villageName}</span>
            {emergency.status === 'PENDING_TRIAGE' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDispatchModal(emergency);
                }}
                className="px-1.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[9px] transition-colors"
              >
                DISPATCH
              </button>
            ) : (
              <span className="text-cyan-400 font-bold">{emergency.etaMinutes}m ETA</span>
            )}
          </div>
        </div>
      </Html>
    </group>
  );
};

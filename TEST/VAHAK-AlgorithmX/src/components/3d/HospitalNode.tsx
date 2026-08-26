import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Hospital } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface HospitalNodeProps {
  hospital: Hospital;
  isSelected: boolean;
}

export const HospitalNode: React.FC<HospitalNodeProps> = ({ hospital, isSelected }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const crossRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (crossRef.current) {
      crossRef.current.rotation.y = t * 0.7;
      crossRef.current.position.y = 1.9 + Math.sin(t * 1.5) * 0.1;
    }
    if (beaconRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.1;
      beaconRef.current.scale.set(s, s, s);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectEntity('HOSPITAL', hospital.id, hospital);
  };

  const isCriticalLoad = hospital.emergencyLoad === 'Critical' || hospital.emergencyLoad === 'Surge Capacity';
  const accentColor = isCriticalLoad ? '#EF4444' : '#22C55E';

  return (
    <group position={hospital.position} onClick={handleClick}>
      {/* Foundation Platform */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[3.2, 0.3, 3.2]} />
        <meshStandardMaterial
          color="#0F172A"
          metalness={0.7}
          roughness={0.3}
          emissive="#1E293B"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Main Hospital Wing (T-shape / Modern architectural complex) */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.8, 0.9, 1.4]} />
        <meshStandardMaterial color="#1E293B" roughness={0.4} metalness={0.6} />
      </mesh>
      
      {/* Emergency & Trauma Bay Wing */}
      <mesh position={[0.7, 0.5, 0.5]} castShadow>
        <boxGeometry args={[1.2, 0.6, 1.0]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Helipad Platform on Roof */}
      <mesh position={[-0.6, 1.2, 0.3]}>
        <cylinderGeometry args={[0.55, 0.6, 0.1, 16]} />
        <meshStandardMaterial
          color="#0284C7"
          emissive="#0369A1"
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Helipad 'H' Marking */}
      <mesh position={[-0.6, 1.26, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial color="#E0F2FE" transparent opacity={0.9} />
      </mesh>

      {/* Holographic Floating 3D Medical Cross */}
      <group ref={crossRef} position={[0, 1.9, 0]}>
        {/* Vertical bar */}
        <mesh>
          <boxGeometry args={[0.22, 0.75, 0.15]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isSelected ? 2.0 : 1.2}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
        {/* Horizontal bar */}
        <mesh>
          <boxGeometry args={[0.75, 0.22, 0.15]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isSelected ? 2.0 : 1.2}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Ground Glow Ring */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.1, 32]} />
        <meshBasicMaterial
          color={accentColor}
          transparent
          opacity={isSelected ? 0.8 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Floating 2.5D HTML Data Card */}
      <Html
        position={[0, 2.6, 0]}
        center
        distanceFactor={30}
        zIndexRange={[100, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono tracking-tight whitespace-nowrap transition-all duration-200 border shadow-xl ${
            isSelected
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-500/30 scale-110'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            <span
              className={`w-2 h-2 rounded-full ${
                isCriticalLoad ? 'bg-red-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span>{hospital.shortName}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-sans border-t border-slate-700/60 pt-1">
            <span>
              ICU:{' '}
              <strong className="text-emerald-400">
                {hospital.icuAvailable}/{hospital.icuTotal}
              </strong>
            </span>
            <span>
              Beds:{' '}
              <strong className="text-cyan-400">
                {hospital.availableBeds}/{hospital.totalBeds}
              </strong>
            </span>
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                isCriticalLoad
                  ? 'bg-red-950 text-red-300 border border-red-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {hospital.emergencyLoad}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};

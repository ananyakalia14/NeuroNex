import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Ambulance } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface Ambulance3DProps {
  ambulance: Ambulance;
  isSelected: boolean;
}

export const Ambulance3D: React.FC<Ambulance3DProps> = ({ ambulance, isSelected }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const groupRef = useRef<THREE.Group>(null);
  const bodyMeshRef = useRef<THREE.Group>(null);
  const sirenRedRef = useRef<THREE.PointLight>(null);
  const sirenBlueRef = useRef<THREE.PointLight>(null);
  const grillStrobeRef = useRef<THREE.PointLight>(null);
  const headlightLeftRef = useRef<THREE.SpotLight>(null);
  const headlightRightRef = useRef<THREE.SpotLight>(null);

  const leftFrontWheel = useRef<THREE.Group>(null);
  const rightFrontWheel = useRef<THREE.Group>(null);
  const leftRearWheel = useRef<THREE.Group>(null);
  const rightRearWheel = useRef<THREE.Group>(null);

  const isEnRouteToPatient =
    ambulance.status === 'Dispatched En Route' || (ambulance.status as string) === 'EN_ROUTE';
  const isTransportingToHospital =
    ambulance.status === 'Transporting to Hospital' || (ambulance.status as string) === 'TRANSPORTING';
  const isAtScene =
    ambulance.status === 'At Scene / Patient Loading' || (ambulance.status as string) === 'ON_SCENE';
  const isMoving = isEnRouteToPatient || isTransportingToHospital;

  // Real-world Street Waypoints
  const effectiveWaypoints = useMemo(() => {
    if (ambulance.routeWaypoints && ambulance.routeWaypoints.length > 1) {
      return ambulance.routeWaypoints;
    }
    const [bx, by, bz] = ambulance.position;
    const pts: [number, number, number][] = [];
    const count = 12;
    const radius = 3.5;
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pts.push([
        bx + Math.cos(angle) * radius,
        0.22,
        bz + Math.sin(angle) * radius,
      ]);
    }
    return pts;
  }, [ambulance.position, ambulance.routeWaypoints]);

  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < ambulance.id.length; i++) {
      hash = (hash * 31 + ambulance.id.charCodeAt(i)) % 1000;
    }
    return hash / 1000;
  }, [ambulance.id]);

  // Track velocity and steering for physical kinematics
  const prevHeading = useRef(0);
  const currentSpeed = useRef(ambulance.speedKmh || (isMoving ? 65 : 0));

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime() + phaseOffset * 10;

    // 1. Multi-Zone Emergency Strobe Frequency
    if (sirenRedRef.current && sirenBlueRef.current) {
      const freq = isMoving ? 16 : isAtScene ? 8 : 4;
      const redOn = Math.sin(t * freq) > 0;
      sirenRedRef.current.intensity = isMoving ? (redOn ? 4.0 : 0.1) : (redOn ? 1.5 : 0.05);
      sirenBlueRef.current.intensity = isMoving ? (!redOn ? 4.0 : 0.1) : (!redOn ? 1.5 : 0.05);
      if (grillStrobeRef.current) {
        grillStrobeRef.current.intensity = isMoving ? (Math.sin(t * 24) > 0 ? 3.0 : 0) : 0;
      }
    }

    // 2. Real Physics Navigation Along Street Network
    if (groupRef.current && effectiveWaypoints.length > 1) {
      const targetSpeed = isAtScene ? 0 : isMoving ? 72 : 45;
      // Smooth Acceleration / Braking Physics
      currentSpeed.current += (targetSpeed - currentSpeed.current) * Math.min(1, delta * 3.5);

      const linearSpeed = (currentSpeed.current / 3600) * 2.8; // Map scale velocity
      const progress = ((t * linearSpeed * 0.08) + phaseOffset) % 1;
      const totalSegments = effectiveWaypoints.length - 1;
      const exactIndex = progress * totalSegments;
      const segIndex = Math.min(Math.floor(exactIndex), totalSegments - 1);
      const segFraction = exactIndex - segIndex;

      const p1 = effectiveWaypoints[segIndex];
      const p2 = effectiveWaypoints[segIndex + 1];

      // Street Level Position
      const curX = p1[0] + (p2[0] - p1[0]) * segFraction;
      const curY = 0.22; // Strict road asphalt elevation
      const curZ = p1[2] + (p2[2] - p1[2]) * segFraction;

      groupRef.current.position.set(curX, curY, curZ);

      // Tangent Heading & Steering Yaw
      const dirX = p2[0] - p1[0];
      const dirZ = p2[2] - p1[2];
      const targetHeading = Math.atan2(dirX, dirZ);

      // Smooth steering interpolation
      let angleDiff = targetHeading - prevHeading.current;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      const smoothedHeading = prevHeading.current + angleDiff * Math.min(1, delta * 8.0);
      prevHeading.current = smoothedHeading;
      groupRef.current.rotation.y = smoothedHeading;

      // Wheel Angular Rotation based on actual vehicle speed (omega = v / r)
      const wheelRadius = 0.18;
      const wheelSpinAngle = (currentSpeed.current * 0.28 * delta) / wheelRadius;

      if (leftFrontWheel.current) leftFrontWheel.current.rotation.x += wheelSpinAngle;
      if (rightFrontWheel.current) rightFrontWheel.current.rotation.x += wheelSpinAngle;
      if (leftRearWheel.current) leftRearWheel.current.rotation.x += wheelSpinAngle;
      if (rightRearWheel.current) rightRearWheel.current.rotation.x += wheelSpinAngle;

      // Front Wheels Steering Angle
      const steeringAngle = Math.max(-0.4, Math.min(0.4, angleDiff * 3.5));
      if (leftFrontWheel.current) leftFrontWheel.current.rotation.y = steeringAngle;
      if (rightFrontWheel.current) rightFrontWheel.current.rotation.y = steeringAngle;

      // Suspension Pitch & Roll on Road Curves
      if (bodyMeshRef.current) {
        bodyMeshRef.current.rotation.z = -steeringAngle * 0.15; // Centrifugal roll
        bodyMeshRef.current.rotation.x = isAtScene ? 0 : Math.sin(t * 12) * 0.015; // Engine vibration
      }
    }
  });

  return (
    <group ref={groupRef} onClick={() => selectEntity('AMBULANCE', ambulance.id, ambulance)}>
      {/* VEHICLE CHASSIS & SUSPENSION */}
      <group ref={bodyMeshRef}>
        {/* Main Cabin / Patient Box (Tata Winger / Force Traveller Type-III Ambulance) */}
        <mesh position={[0, 0.45, -0.1]} castShadow receiveShadow>
          <boxGeometry args={[0.76, 0.58, 1.45]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.2}
            metalness={0.15}
          />
        </mesh>

        {/* Driver Cab Forward Hood */}
        <mesh position={[0, 0.32, 0.72]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.36, 0.45]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.15} />
        </mesh>

        {/* Slanted Front Windshield */}
        <mesh position={[0, 0.54, 0.58]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.68, 0.28, 0.05]} />
          <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Side Patient Cabin Windows */}
        <mesh position={[0.39, 0.52, -0.15]}>
          <boxGeometry args={[0.02, 0.22, 0.9]} />
          <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.8} />
        </mesh>
        <mesh position={[-0.39, 0.52, -0.15]}>
          <boxGeometry args={[0.02, 0.22, 0.9]} />
          <meshStandardMaterial color="#0284C7" roughness={0.1} metalness={0.8} />
        </mesh>

        {/* Red Medical Livery Stripe along sides */}
        <mesh position={[0.39, 0.32, -0.05]}>
          <boxGeometry args={[0.02, 0.12, 1.7]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>
        <mesh position={[-0.39, 0.32, -0.05]}>
          <boxGeometry args={[0.02, 0.12, 1.7]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>

        {/* Medical Red Cross on Roof and Sides */}
        <mesh position={[0, 0.75, -0.1]}>
          <boxGeometry args={[0.38, 0.02, 0.12]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.75, -0.1]}>
          <boxGeometry args={[0.12, 0.02, 0.38]} />
          <meshStandardMaterial color="#EF4444" roughness={0.3} />
        </mesh>

        {/* Chrome Front Bullbar & Heavy Bumper */}
        <mesh position={[0, 0.18, 0.98]} castShadow>
          <boxGeometry args={[0.78, 0.16, 0.12]} />
          <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
        </mesh>

        {/* Dual Forward Headlights with Spotlights onto the Road */}
        <mesh position={[0.26, 0.3, 0.95]}>
          <boxGeometry args={[0.12, 0.08, 0.02]} />
          <meshBasicMaterial color="#FEF08A" />
        </mesh>
        <mesh position={[-0.26, 0.3, 0.95]}>
          <boxGeometry args={[0.12, 0.08, 0.02]} />
          <meshBasicMaterial color="#FEF08A" />
        </mesh>

        {/* Forward Headlight Beams */}
        <spotLight
          ref={headlightLeftRef}
          position={[0.26, 0.3, 0.95]}
          target-position={[0.26, 0.0, 5.0]}
          angle={0.4}
          penumbra={0.5}
          intensity={isMoving ? 2.5 : 1.0}
          color="#FEF08A"
          distance={10}
        />
        <spotLight
          ref={headlightRightRef}
          position={[-0.26, 0.3, 0.95]}
          target-position={[-0.26, 0.0, 5.0]}
          angle={0.4}
          penumbra={0.5}
          intensity={isMoving ? 2.5 : 1.0}
          color="#FEF08A"
          distance={10}
        />

        {/* Dual Roof Emergency Strobe Siren Bar */}
        <mesh position={[0, 0.78, 0.35]}>
          <boxGeometry args={[0.55, 0.08, 0.15]} />
          <meshStandardMaterial color="#0F172A" metalness={0.9} />
        </mesh>

        {/* Red Siren Dome */}
        <mesh position={[-0.18, 0.83, 0.35]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <pointLight ref={sirenRedRef} position={[-0.18, 0.95, 0.35]} color="#EF4444" distance={8} />

        {/* Blue Siren Dome */}
        <mesh position={[0.18, 0.83, 0.35]}>
          <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
          <meshBasicMaterial color="#3B82F6" />
        </mesh>
        <pointLight ref={sirenBlueRef} position={[0.18, 0.95, 0.35]} color="#3B82F6" distance={8} />

        {/* Front Grill Secondary Flasher */}
        <pointLight ref={grillStrobeRef} position={[0, 0.28, 0.98]} color="#FFFFFF" distance={4} />

        {/* Rear Red Brake Lights */}
        <mesh position={[0.3, 0.32, -0.83]}>
          <boxGeometry args={[0.08, 0.14, 0.02]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <mesh position={[-0.3, 0.32, -0.83]}>
          <boxGeometry args={[0.08, 0.14, 0.02]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
      </group>

      {/* 4 INDIVIDUALLY ROTATING ROAD WHEELS (PHYSICS-BASED) */}
      {/* Front Left Wheel */}
      <group ref={leftFrontWheel} position={[-0.39, 0.14, 0.55]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.13, 12]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Front Right Wheel */}
      <group ref={rightFrontWheel} position={[0.39, 0.14, 0.55]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.13, 12]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear Left Wheel */}
      <group ref={leftRearWheel} position={[-0.39, 0.14, -0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.13, 12]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Rear Right Wheel */}
      <group ref={rightRearWheel} position={[0.39, 0.14, -0.5]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.12, 16]} />
          <meshStandardMaterial color="#1E293B" roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.13, 12]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* Selection Glow Aura */}
      {isSelected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.2, 32]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Real-time 2-Phase Tactical HUD Label */}
      <Html position={[0, 1.15, 0]} center distanceFactor={16}>
        <div
          className={`px-2 py-0.8 rounded-md text-[10px] font-mono font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5 transition-all select-none pointer-events-auto cursor-pointer ${
            isEnRouteToPatient
              ? 'bg-rose-600/95 text-white border border-rose-300 animate-pulse'
              : isTransportingToHospital
              ? 'bg-purple-600/95 text-white border border-purple-300'
              : isAtScene
              ? 'bg-amber-500/95 text-slate-900 border border-amber-300 animate-bounce'
              : isSelected
              ? 'bg-blue-600 text-white border border-blue-400'
              : 'bg-slate-900/90 text-slate-200 border border-slate-700'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            selectEntity('AMBULANCE', ambulance.id, ambulance);
          }}
        >
          <span>🚑</span>
          <span>{ambulance.callsign.split('-')[0]}</span>
          <span className="text-[9px] opacity-80">
            {isEnRouteToPatient
              ? 'P1: TO PATIENT'
              : isTransportingToHospital
              ? 'P2: TO HOSPITAL'
              : isAtScene
              ? 'LOADING'
              : `${Math.round(currentSpeed.current)} km/h`}
          </span>
        </div>
      </Html>
    </group>
  );
};

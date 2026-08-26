import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RouteCalculationResult } from '../../services/routingAlgorithm';

interface RoutePathProps {
  routeResult: RouteCalculationResult;
  isDrone?: boolean;
}

export const RoutePath: React.FC<RoutePathProps> = ({ routeResult, isDrone = false }) => {
  const particlesRef = useRef<THREE.Points>(null);

  // Convert waypoints to Vector3 points
  const points = useMemo(() => {
    return routeResult.pathWaypoints.map((p) => new THREE.Vector3(p[0], p[1] + 0.15, p[2]));
  }, [routeResult.pathWaypoints]);

  // Create smooth CatmullRom curve
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(points);
  }, [points]);

  // 3D Tube for the Glowing Route Path
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, isDrone ? 0.18 : 0.25, 8, false);
  }, [curve, isDrone]);

  // Sample particle positions along the curve
  const particleCount = 40;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const point = curve.getPoint(t);
      pos[i * 3] = point.x;
      pos[i * 3 + 1] = point.y + 0.1;
      pos[i * 3 + 2] = point.z;
    }
    return pos;
  }, [curve]);

  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    return geo;
  }, [particlePositions]);

  // Animate particles flowing continuously along the spline path
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * (isDrone ? 0.35 : 0.2);
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const offset = (i / particleCount + time) % 1;
        const pt = curve.getPoint(offset);
        positions[i * 3] = pt.x;
        positions[i * 3 + 1] = pt.y + 0.12;
        positions[i * 3 + 2] = pt.z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const midPoint = points[Math.floor(points.length / 2)] || new THREE.Vector3(0, 2, 0);

  return (
    <group>
      {/* Main Glowing Tube Route */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color={isDrone ? '#8B5CF6' : '#22D3EE'}
          emissive={isDrone ? '#8B5CF6' : '#22D3EE'}
          emissiveIntensity={1.8}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Pulsing Outer Aura Tube */}
      <mesh geometry={tubeGeometry} scale={[1.3, 1.3, 1]}>
        <meshBasicMaterial
          color={isDrone ? '#A78BFA' : '#38BDF8'}
          transparent
          opacity={0.3}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Animated Light Energy Particles */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          size={isDrone ? 0.6 : 0.8}
          color="#FFFFFF"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* HUD Route Banner Overlay */}
      <Html
        position={[midPoint.x, midPoint.y + 1.8, midPoint.z]}
        center
        distanceFactor={28}
        zIndexRange={[150, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-400 text-cyan-200 text-[11px] font-mono tracking-tight shadow-xl shadow-cyan-500/30 backdrop-blur-md flex items-center gap-2.5 whitespace-nowrap">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="font-bold text-white">{routeResult.totalDistanceKm} KM</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400 font-bold">{routeResult.estimatedTimeMinutes} MIN</span>
          <span className="text-slate-500">|</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
            {isDrone ? 'eVTOL BALLISTIC' : 'A* OPTIMIZED'}
          </span>
        </div>
      </Html>
    </group>
  );
};

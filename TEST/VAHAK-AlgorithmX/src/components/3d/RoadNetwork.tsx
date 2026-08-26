import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoadSegment } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { generateSmoothSplinePoints } from '../../services/routingAlgorithm';

interface RoadNetworkProps {
  roadSegments: RoadSegment[];
}

export const RoadNetwork: React.FC<RoadNetworkProps> = ({ roadSegments }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const selectedEntity = useHealthcareStore((state) => state.selectedEntity);

  return (
    <group>
      {roadSegments.map((road) => (
        <RoadLineItem
          key={road.id}
          road={road}
          isSelected={selectedEntity?.type === 'ROAD' && selectedEntity.id === road.id}
          onSelect={() => selectEntity('ROAD', road.id, road)}
        />
      ))}
    </group>
  );
};

interface RoadLineItemProps {
  road: RoadSegment;
  isSelected: boolean;
  onSelect: () => void;
}

const RoadLineItem: React.FC<RoadLineItemProps> = ({ road, isSelected, onSelect }) => {
  const isBlocked = road.status === 'BLOCKED_LANDSLIDE';
  const isFlood = road.status === 'WARNING_FLOOD';

  // Generate spline points for road curvature
  const points = useMemo(() => {
    const p1 = road.startPos;
    const p2 = road.endPos;
    const midX = (p1[0] + p2[0]) / 2 + (isBlocked ? 1.2 : -0.5);
    const midZ = (p1[2] + p2[2]) / 2 + (isFlood ? 1.0 : 0.4);
    const midY = (p1[1] + p2[1]) / 2 + 0.1;

    const waypoints: [number, number, number][] = [p1, [midX, midY, midZ], p2];
    const spline = generateSmoothSplinePoints(waypoints, 12);
    return spline.map((p) => new THREE.Vector3(p[0], p[1] + 0.04, p[2]));
  }, [road.startPos, road.endPos, isBlocked, isFlood]);

  const curveGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 32, isSelected ? 0.22 : 0.12, 8, false);
  }, [points, isSelected]);

  const color = isBlocked
    ? '#EF4444'
    : isFlood
    ? '#F59E0B'
    : isSelected
    ? '#38BDF8'
    : '#0284C7';

  return (
    <group
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* 3D Tube Road Segment */}
      <mesh geometry={curveGeometry}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isBlocked ? 1.8 : isSelected ? 1.4 : 0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* If Blocked by Landslide: Add 3D Hazard Obstacle Barricades at midpoint */}
      {isBlocked && (
        <group position={[(road.startPos[0] + road.endPos[0]) / 2, 0.4, (road.startPos[2] + road.endPos[2]) / 2]}>
          <mesh>
            <boxGeometry args={[0.8, 0.4, 0.2]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.2} />
          </mesh>
          <pointLight color="#EF4444" intensity={2} distance={3} />
        </group>
      )}

      {/* If Flood Warning: Add Water Hazard Marker */}
      {isFlood && (
        <group position={[(road.startPos[0] + road.endPos[0]) / 2, 0.25, (road.startPos[2] + road.endPos[2]) / 2]}>
          <mesh>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 16]} />
            <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
};

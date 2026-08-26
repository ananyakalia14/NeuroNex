import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { RoadSegment } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface InstancedRoadNetworkProps {
  roadSegments: RoadSegment[];
}

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3(1, 1, 1);
const upVector = new THREE.Vector3(0, 1, 0);

export const InstancedRoadNetwork: React.FC<InstancedRoadNetworkProps> = ({ roadSegments }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const selectedEntity = useHealthcareStore((state) => state.selectedEntity);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const count = roadSegments.length;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    roadSegments.forEach((road, i) => {
      const p1 = new THREE.Vector3(...road.startPos);
      const p2 = new THREE.Vector3(...road.endPos);
      const midpoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      midpoint.y += 0.04;

      const distance = p1.distanceTo(p2);
      const direction = new THREE.Vector3().subVectors(p2, p1).normalize();

      tempQuaternion.setFromUnitVectors(upVector, direction);
      tempPosition.copy(midpoint);
      tempScale.set(0.14, distance, 0.14);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      mesh.setMatrixAt(i, tempMatrix);

      const isBlocked = road.status === 'BLOCKED_LANDSLIDE';
      const isFlood = road.status === 'WARNING_FLOOD';
      const isSelected = selectedEntity?.type === 'ROAD' && selectedEntity.id === road.id;

      const color = new THREE.Color(
        isBlocked ? '#EF4444' : isFlood ? '#F59E0B' : isSelected ? '#38BDF8' : '#0284C7'
      );
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [roadSegments, selectedEntity]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && roadSegments[instanceId]) {
      const road = roadSegments[instanceId];
      selectEntity('ROAD', road.id, road);
    }
  };

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerDown={handlePointerDown}
      >
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial roughness={0.2} metalness={0.8} />
      </instancedMesh>

      {/* Render Hazard Markers for Blocked Roads */}
      {roadSegments
        .filter((r) => r.status === 'BLOCKED_LANDSLIDE')
        .map((road) => (
          <group
            key={`hazard-${road.id}`}
            position={[(road.startPos[0] + road.endPos[0]) / 2, 0.4, (road.startPos[2] + road.endPos[2]) / 2]}
          >
            <mesh>
              <boxGeometry args={[0.8, 0.4, 0.2]} />
              <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={1.5} />
            </mesh>
            <pointLight color="#EF4444" intensity={2} distance={3} />
          </group>
        ))}
    </group>
  );
};

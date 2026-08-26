import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Village } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';

interface InstancedVillageNodesProps {
  villages: Village[];
}

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3(1, 1, 1);

export const InstancedVillageNodes: React.FC<InstancedVillageNodesProps> = ({ villages }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const selectedEntity = useHealthcareStore((state) => state.selectedEntity);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const count = villages.length;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    villages.forEach((village, i) => {
      tempPosition.set(village.position[0], village.position[1] + 0.1, village.position[2]);
      tempQuaternion.identity();
      const scaleVal = village.activeEmergencies > 0 ? 1.25 : 1.0;
      tempScale.set(scaleVal, scaleVal, scaleVal);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      mesh.setMatrixAt(i, tempMatrix);

      const hasEmg = village.activeEmergencies > 0;
      const isSelected = selectedEntity?.type === 'VILLAGE' && selectedEntity.id === village.id;
      const color = new THREE.Color(isSelected ? '#38BDF8' : hasEmg ? '#F97316' : '#0284C7');
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [villages, selectedEntity]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && villages[instanceId]) {
      const village = villages[instanceId];
      selectEntity('VILLAGE', village.id, village);
    }
  };

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onPointerDown={handlePointerDown}
    >
      <cylinderGeometry args={[1.2, 1.4, 0.2, 16]} />
      <meshStandardMaterial roughness={0.3} metalness={0.8} />
    </instancedMesh>
  );
};

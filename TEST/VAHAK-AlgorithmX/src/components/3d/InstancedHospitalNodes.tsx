import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Hospital } from '../../types';
import { useHealthcareStore } from '../../store/useHealthcareStore';
import { Html } from '@react-three/drei';

interface InstancedHospitalNodesProps {
  hospitals: Hospital[];
}

const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const tempScale = new THREE.Vector3(1, 1, 1);

export const InstancedHospitalNodes: React.FC<InstancedHospitalNodesProps> = ({ hospitals }) => {
  const selectEntity = useHealthcareStore((state) => state.selectEntity);
  const selectedEntity = useHealthcareStore((state) => state.selectedEntity);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const count = hospitals.length;

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    hospitals.forEach((hospital, i) => {
      tempPosition.set(hospital.position[0], hospital.position[1] + 0.5, hospital.position[2]);
      tempQuaternion.identity();
      const isCritical = hospital.emergencyLoad === 'Critical' || hospital.emergencyLoad === 'Surge Capacity';
      const scaleVal = isCritical ? 1.2 : 1.0;
      tempScale.set(scaleVal, scaleVal, scaleVal);

      tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
      mesh.setMatrixAt(i, tempMatrix);

      const isSelected = selectedEntity?.type === 'HOSPITAL' && selectedEntity.id === hospital.id;
      const color = new THREE.Color(
        isSelected ? '#38BDF8' : isCritical ? '#EF4444' : '#22C55E'
      );
      mesh.setColorAt(i, color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [hospitals, selectedEntity]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const instanceId = e.instanceId;
    if (instanceId !== undefined && hospitals[instanceId]) {
      const hospital = hospitals[instanceId];
      selectEntity('HOSPITAL', hospital.id, hospital);
    }
  };

  const selectedHospital = hospitals.find((h) => selectedEntity?.type === 'HOSPITAL' && selectedEntity.id === h.id);

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        onPointerDown={handlePointerDown}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.8, 1.2, 2.8]} />
        <meshStandardMaterial roughness={0.3} metalness={0.7} />
      </instancedMesh>

      {/* Render HTML label for selected hospital */}
      {selectedHospital && (
        <group position={selectedHospital.position}>
          <Html
            position={[0, 2.6, 0]}
            center
            distanceFactor={30}
            zIndexRange={[100, 0]}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono tracking-tight whitespace-nowrap transition-all duration-200 border shadow-xl bg-emerald-950/95 border-emerald-400 text-emerald-100 shadow-emerald-500/30 scale-110">
              <div className="flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{selectedHospital.name}</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-300 mt-1 font-sans border-t border-slate-700/60 pt-1">
                <span>
                  ICU: <strong className="text-emerald-400">{selectedHospital.icuAvailable}/{selectedHospital.icuTotal}</strong>
                </span>
                <span>
                  Load: <strong className="text-cyan-400">{selectedHospital.emergencyLoad}</strong>
                </span>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

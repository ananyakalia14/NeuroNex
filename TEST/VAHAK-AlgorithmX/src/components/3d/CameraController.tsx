import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useHealthcareStore } from '../../store/useHealthcareStore';

export const CameraController: React.FC = () => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const cameraFocusTarget = useHealthcareStore((state) => state.cameraFocusTarget);

  const targetCamPos = useRef(new THREE.Vector3(0, 42, 38));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (cameraFocusTarget) {
      targetCamPos.current.set(...cameraFocusTarget.position);
      targetLookAt.current.set(...cameraFocusTarget.lookAt);
      isTransitioning.current = true;
    }
  }, [cameraFocusTarget]);

  useFrame(() => {
    if (isTransitioning.current && controlsRef.current) {
      // Smooth lerp camera position
      camera.position.lerp(targetCamPos.current, 0.08);

      // Smooth lerp OrbitControls target
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      controlsRef.current.update();

      // Stop lerping when close enough
      if (
        camera.position.distanceTo(targetCamPos.current) < 0.1 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.1
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={90}
      maxPolarAngle={Math.PI / 2.05} // Don't allow going below the ground
      rotateSpeed={0.8}
      zoomSpeed={1.2}
      panSpeed={0.8}
    />
  );
};

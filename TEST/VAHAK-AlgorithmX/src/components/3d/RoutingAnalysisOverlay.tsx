import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { ExplorationTree } from '../../types';

interface RoutingAnalysisOverlayProps {
  explorationTree: ExplorationTree;
  visible?: boolean;
}

export const RoutingAnalysisOverlay: React.FC<RoutingAnalysisOverlayProps> = ({
  explorationTree,
  visible = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingsRef = useRef<THREE.Group>(null);

  const isAStar = explorationTree.algorithm === 'A_STAR';

  // Extract edges: connections between node and parent
  const treeEdges = useMemo(() => {
    const edges: { from: [number, number, number]; to: [number, number, number]; order: number }[] = [];
    explorationTree.visitedSteps.forEach((step) => {
      if (step.parentPos) {
        // Slightly elevate tree lines to float nicely above terrain
        const fromPos: [number, number, number] = [step.parentPos[0], step.parentPos[1] + 0.3, step.parentPos[2]];
        const toPos: [number, number, number] = [step.position3D[0], step.position3D[1] + 0.3, step.position3D[2]];
        edges.push({ from: fromPos, to: toPos, order: step.order });
      }
    });
    return edges;
  }, [explorationTree]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    if (pulseRingsRef.current) {
      pulseRingsRef.current.children.forEach((child: any, idx) => {
        if (child.material) {
          // Staggered pulsing wave
          const phase = (t * 2.5 + idx * 0.4) % Math.PI;
          child.scale.setScalar(1 + Math.sin(phase) * 0.6);
          child.material.opacity = Math.max(0.1, 0.9 - Math.sin(phase) * 0.7);
        }
      });
    }
  });

  if (!visible || explorationTree.visitedSteps.length === 0) {
    return null;
  }

  const primaryColor = isAStar ? '#06B6D4' : '#EAB308'; // Cyan for A*, Amber for Dijkstra
  const glowColor = isAStar ? '#22D3EE' : '#FACC15';

  return (
    <group ref={groupRef}>
      {/* 1. Exploration Tree Branch Edges (connecting parent to child nodes) */}
      {treeEdges.map((edge, idx) => (
        <Line
          key={`edge-${idx}`}
          points={[edge.from, edge.to]}
          color={primaryColor}
          lineWidth={isAStar ? 2.2 : 1.5}
          transparent
          opacity={isAStar ? 0.65 : 0.45}
          dashed={!isAStar}
          dashSize={0.4}
          gapSize={0.2}
        />
      ))}

      {/* 2. Heuristic Rays (A* Haversine Guidance Vectors towards Goal) */}
      {isAStar &&
        explorationTree.heuristicRays.map((ray, idx) => (
          <Line
            key={`hray-${idx}`}
            points={[
              [ray.from[0], ray.from[1] + 0.35, ray.from[2]],
              [ray.to[0], ray.to[1] + 0.35, ray.to[2]],
            ]}
            color="#A855F7" // Purple Heuristic Ray
            lineWidth={1.2}
            transparent
            opacity={0.35}
            dashed
            dashSize={0.5}
            gapSize={0.3}
          />
        ))}

      {/* 3. Visited Nodes Light Pulses */}
      <group ref={pulseRingsRef}>
        {explorationTree.visitedSteps.map((step, idx) => (
          <group
            key={`node-${step.nodeId}-${idx}`}
            position={[step.position3D[0], step.position3D[1] + 0.35, step.position3D[2]]}
          >
            {/* Pulsing Core Sphere */}
            <mesh>
              <sphereGeometry args={[step.isGoal ? 0.45 : 0.22, 16, 16]} />
              <meshStandardMaterial
                color={step.isGoal ? '#10B981' : glowColor}
                emissive={step.isGoal ? '#10B981' : glowColor}
                emissiveIntensity={step.isGoal ? 1.5 : 0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Glowing Aura Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, 0.6, 24]} />
              <meshBasicMaterial
                color={step.isGoal ? '#34D399' : primaryColor}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Open Set / Frontier Nodes */}
      {explorationTree.frontierNodes.map((fn, idx) => (
        <mesh
          key={`frontier-${fn.nodeId}-${idx}`}
          position={[fn.position3D[0], fn.position3D[1] + 0.4, fn.position3D[2]]}
        >
          <octahedronGeometry args={[0.26]} />
          <meshStandardMaterial
            color="#EC4899"
            emissive="#EC4899"
            emissiveIntensity={1.2}
            wireframe
          />
        </mesh>
      ))}

      {/* 5. 2.5D Spatial Telemetry Badge Floating above the Search Center */}
      {explorationTree.visitedSteps.length > 0 && (
        <Html
          position={[
            (explorationTree.startNodePos[0] + explorationTree.goalNodePos[0]) / 2,
            Math.max(explorationTree.startNodePos[1], explorationTree.goalNodePos[1]) + 4.2,
            (explorationTree.startNodePos[2] + explorationTree.goalNodePos[2]) / 2,
          ]}
          center
          distanceFactor={32}
          zIndexRange={[90, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div className="glass-panel-elevated px-3 py-2 rounded-xl text-[10px] font-mono border-cyan-400/50 shadow-2xl backdrop-blur-md whitespace-nowrap min-w-[220px]">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5 font-bold text-white">
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: primaryColor }}
                />
                {isAStar ? 'A* Directed Heuristic Tree' : 'Dijkstra Uniform Wavefront'}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                style={{
                  backgroundColor: isAStar ? 'rgba(6, 182, 212, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                  color: isAStar ? '#22D3EE' : '#FDE047',
                  border: `1px solid ${isAStar ? 'rgba(6, 182, 212, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`,
                }}
              >
                {explorationTree.executionTimeMs} ms
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1.5 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">Explored Nodes</span>
                <span className="font-bold text-cyan-300 text-xs">
                  {explorationTree.nodesExpanded.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase">Pruned Edges</span>
                <span className="font-bold text-emerald-400 text-xs">
                  {explorationTree.prunedEdgesCount}
                </span>
              </div>
            </div>

            {isAStar ? (
              <div className="mt-1.5 text-[9px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                ⚡ Heuristic: <span className="font-bold">Haversine f(n) = g(n) + h(n)</span>
              </div>
            ) : (
              <div className="mt-1.5 text-[9px] text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded border border-yellow-500/30">
                🌐 Exhaustive Search: <span className="font-bold">h(n) = 0</span> (360° Expansion)
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};

/* ── usePathfinder Hook ──
   React hook wrapping the pathfinding Web Worker
   Manages worker lifecycle, request/response, loading states
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../db/schema';
import type { WorkerResponse, RouteResult, FindRouteMessage } from '../workers/types';
import type { UrgencyTier, Specialty } from '../db/schema';
import { generateId } from '../utils/geo';

interface PathfinderState {
  isInitialized: boolean;
  isComputing: boolean;
  lastResult: RouteResult | null;
  error: string | null;
}

export function usePathfinder() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<PathfinderState>({
    isInitialized: false,
    isComputing: false,
    lastResult: null,
    error: null,
  });
  const resolveRef = useRef<((result: RouteResult) => void) | null>(null);
  const rejectRef = useRef<((error: string) => void) | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/pathfinding.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'INIT_GRAPH_RESULT':
          setState((prev) => ({ ...prev, isInitialized: msg.success }));
          break;
        case 'ROUTE_RESULT':
          setState((prev) => ({ ...prev, isComputing: false, lastResult: msg, error: null }));
          resolveRef.current?.(msg);
          resolveRef.current = null;
          rejectRef.current = null;
          break;
        case 'ROUTE_ERROR':
          setState((prev) => ({ ...prev, isComputing: false, error: msg.error }));
          rejectRef.current?.(msg.error);
          resolveRef.current = null;
          rejectRef.current = null;
          break;
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Load graph data into worker
  const initializeGraph = useCallback(async () => {
    if (!workerRef.current) return;

    const [nodes, edges, hospitals] = await Promise.all([
      db.nodes.toArray(),
      db.edges.toArray(),
      db.hospitals.toArray(),
    ]);

    workerRef.current.postMessage({
      type: 'INIT_GRAPH',
      nodes: nodes.map((n) => ({ id: n.id, lat: n.lat, lng: n.lng, type: n.type })),
      edges: edges.map((e) => ({ id: e.id, u: e.u, v: e.v, weight: e.weight, blocked: e.blocked })),
      hospitals: hospitals.map((h) => ({
        id: h.id,
        nodeId: h.nodeId,
        name: h.name,
        bedsAvailable: h.bedsAvailable,
        bedsTotal: h.bedsTotal,
        specialties: h.specialties,
        medicineStock: h.medicineStock,
      })),
    });
  }, []);

  // Find optimal route
  const findRoute = useCallback(
    (
      sourceNodeId: number,
      urgencyTier: UrgencyTier,
      requiredSpecialty?: Specialty,
      requiredMedicine?: string,
    ): Promise<RouteResult> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current || !state.isInitialized) {
          reject('Pathfinder not initialized');
          return;
        }

        setState((prev) => ({ ...prev, isComputing: true, error: null }));
        resolveRef.current = resolve;
        rejectRef.current = reject;

        const message: FindRouteMessage = {
          type: 'FIND_ROUTE',
          requestId: generateId(),
          sourceNodeId,
          urgencyTier,
          requiredSpecialty,
          requiredMedicine,
        };

        workerRef.current.postMessage(message);
      });
    },
    [state.isInitialized],
  );

  // Update edge blockage
  const updateEdge = useCallback((edgeId: number, blocked: boolean) => {
    workerRef.current?.postMessage({ type: 'UPDATE_EDGE', edgeId, blocked });
  }, []);

  // Update hospital data
  const updateHospital = useCallback(
    (hospitalId: number, bedsAvailable?: number, medicineStock?: Record<string, number>) => {
      workerRef.current?.postMessage({
        type: 'UPDATE_HOSPITAL',
        hospitalId,
        bedsAvailable,
        medicineStock,
      });
    },
    [],
  );

  return {
    ...state,
    initializeGraph,
    findRoute,
    updateEdge,
    updateHospital,
  };
}

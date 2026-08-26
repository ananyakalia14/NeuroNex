/* ── useDatabase Hook ──
   Common DB operations with Dexie liveQuery
*/

import { useState, useEffect, useCallback } from 'react';
import { liveQuery } from 'dexie';
import { db } from '../db/schema';
import type { Hospital, Dispatch, Ambulance, GraphNode } from '../db/schema';

export function useHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    const sub = liveQuery(() => db.hospitals.toArray()).subscribe({
      next: (data) => setHospitals(data),
      error: (err) => console.error('Hospital query error:', err),
    });
    return () => sub.unsubscribe();
  }, []);

  const updateBeds = useCallback(async (id: number, bedsAvailable: number) => {
    await db.hospitals.update(id, { bedsAvailable });
  }, []);

  const updateMedicine = useCallback(async (id: number, medicine: string, quantity: number) => {
    const hospital = await db.hospitals.get(id);
    if (hospital) {
      const stock = { ...hospital.medicineStock, [medicine]: quantity };
      await db.hospitals.update(id, { medicineStock: stock });
    }
  }, []);

  return { hospitals, updateBeds, updateMedicine };
}

export function useDispatches() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);

  useEffect(() => {
    const sub = liveQuery(() =>
      db.dispatches.orderBy('timestamp').reverse().limit(50).toArray()
    ).subscribe({
      next: (data) => setDispatches(data),
      error: (err) => console.error('Dispatch query error:', err),
    });
    return () => sub.unsubscribe();
  }, []);

  const addDispatch = useCallback(async (dispatch: Omit<Dispatch, 'id'>) => {
    return db.dispatches.add(dispatch as Dispatch);
  }, []);

  const updateStatus = useCallback(async (id: number, status: Dispatch['status']) => {
    await db.dispatches.update(id, { status });
  }, []);

  const pendingCount = dispatches.filter((d) => d.status === 'SYNC_PENDING').length;

  return { dispatches, addDispatch, updateStatus, pendingCount };
}

export function useAmbulances() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);

  useEffect(() => {
    const sub = liveQuery(() => db.ambulances.toArray()).subscribe({
      next: (data) => setAmbulances(data),
      error: (err) => console.error('Ambulance query error:', err),
    });
    return () => sub.unsubscribe();
  }, []);

  const updateAmbulance = useCallback(
    async (id: number, updates: Partial<Ambulance>) => {
      await db.ambulances.update(id, updates);
    },
    [],
  );

  const idleCount = ambulances.filter((a) => a.status === 'IDLE').length;
  const activeCount = ambulances.filter((a) => a.status !== 'IDLE').length;

  return { ambulances, updateAmbulance, idleCount, activeCount };
}

export function useNodes() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadNodes = useCallback(async () => {
    const data = await db.nodes.toArray();
    setNodes(data);
    setIsLoaded(true);
  }, []);

  return { nodes, isLoaded, loadNodes };
}

export function useEdges() {
  const loadEdges = useCallback(async () => {
    return db.edges.toArray();
  }, []);

  return { loadEdges };
}

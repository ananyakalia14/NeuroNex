/* ── Database Schema — RuralHealthDB ──
   Dexie v4 + IndexedDB for full offline storage
   Stores: nodes, edges, hospitals, ambulances, dispatches
*/

import Dexie, { type EntityTable } from 'dexie';

// ── Type Definitions ──

export type NodeType = 'village' | 'hospital' | 'junction';

export interface GraphNode {
  id: number;
  lat: number;
  lng: number;
  type: NodeType;
  name?: string;
  population?: number;
}

export interface GraphEdge {
  id: number;
  u: number; // source node id
  v: number; // target node id
  weight: number; // travel time in minutes
  distance: number; // distance in km
  blocked: boolean;
  roadType?: 'highway' | 'district' | 'village' | 'dirt';
}

export type Specialty =
  | 'general'
  | 'emergency'
  | 'pediatrics'
  | 'orthopedics'
  | 'cardiology'
  | 'obstetrics'
  | 'neurology'
  | 'ophthalmology';

export interface Hospital {
  id: number;
  nodeId: number;
  name: string;
  bedsAvailable: number;
  bedsTotal: number;
  specialties: Specialty[];
  medicineStock: Record<string, number>;
  tier: 'PHC' | 'CHC' | 'DH'; // Primary Health Centre / Community / District
}

export type UrgencyTier = 1 | 2 | 3; // 1=critical, 2=urgent, 3=standard

export type DispatchStatus =
  | 'PENDING'
  | 'DISPATCHED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'SYNC_PENDING'
  | 'SYNCED';

export interface Dispatch {
  id?: number;
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  driverName?: string;
  driverPhone?: string;
  ambulanceNumber?: string;
  sourceNodeId: number;
  urgencyTier: UrgencyTier;
  requiredSpecialty?: Specialty;
  requiredMedicine?: string;
  assignedHospitalId: number;
  assignedAmbulanceId?: number;
  routeNodeIds: number[];
  routeDistance: number; // km
  routeTime: number; // minutes
  status: DispatchStatus;
  eta: number; // minutes
  rationale: string;
  alternativesConsidered: AlternativeHospital[];
  timestamp: number;
}

export interface AlternativeHospital {
  hospitalId: number;
  hospitalName: string;
  score: number;
  reason: string;
}

export type AmbulanceStatus = 'IDLE' | 'DISPATCHED' | 'EN_ROUTE' | 'RETURNING';

export interface Ambulance {
  id: number;
  currentNodeId: number;
  status: AmbulanceStatus;
  assignedDispatchId?: number;
  vehicleType: 'BLS' | 'ALS'; // Basic / Advanced Life Support
}

// ── Database Class ──

export class RuralHealthDB extends Dexie {
  nodes!: EntityTable<GraphNode, 'id'>;
  edges!: EntityTable<GraphEdge, 'id'>;
  hospitals!: EntityTable<Hospital, 'id'>;
  ambulances!: EntityTable<Ambulance, 'id'>;
  dispatches!: EntityTable<Dispatch, 'id'>;

  constructor() {
    super('RuralHealthDB');

    this.version(1).stores({
      nodes: 'id, type, lat, lng',
      edges: 'id, u, v, blocked',
      hospitals: 'id, nodeId, tier',
      ambulances: 'id, status, currentNodeId',
      dispatches: '++id, status, urgencyTier, timestamp, assignedHospitalId',
    });
  }
}

// ── Singleton Instance ──
export const db = new RuralHealthDB();

// ── Helper to check if DB is seeded with Dombivli graph ──
export async function isDbSeeded(): Promise<boolean> {
  const count = await db.nodes.count();
  if (count === 0) return false;
  const sample = await db.nodes.get(0);
  if (sample && (sample.lat < 19.10 || sample.lat > 19.35)) {
    return false; // Re-seed with realistic Dombivli region
  }
  return true;
}

// ── Helper to clear DB ──
export async function clearDb(): Promise<void> {
  await db.transaction('rw', [db.nodes, db.edges, db.hospitals, db.ambulances, db.dispatches], async () => {
    await db.nodes.clear();
    await db.edges.clear();
    await db.hospitals.clear();
    await db.ambulances.clear();
    await db.dispatches.clear();
  });
}

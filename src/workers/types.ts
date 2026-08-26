/* ── Worker Message Types ──
   Protocol for main thread ↔ pathfinding worker communication
*/

import type { UrgencyTier, Specialty, AlternativeHospital } from '../db/schema';

// ── Requests (Main → Worker) ──

export interface InitGraphMessage {
  type: 'INIT_GRAPH';
  nodes: { id: number; lat: number; lng: number; type: string }[];
  edges: { id: number; u: number; v: number; weight: number; blocked: boolean }[];
  hospitals: {
    id: number;
    nodeId: number;
    name: string;
    bedsAvailable: number;
    bedsTotal: number;
    specialties: string[];
    medicineStock: Record<string, number>;
  }[];
}

export interface FindRouteMessage {
  type: 'FIND_ROUTE';
  requestId: string;
  sourceNodeId: number;
  urgencyTier: UrgencyTier;
  requiredSpecialty?: Specialty;
  requiredMedicine?: string;
}

export interface UpdateEdgeMessage {
  type: 'UPDATE_EDGE';
  edgeId: number;
  blocked: boolean;
}

export interface UpdateHospitalMessage {
  type: 'UPDATE_HOSPITAL';
  hospitalId: number;
  bedsAvailable?: number;
  medicineStock?: Record<string, number>;
}

export type WorkerRequest =
  | InitGraphMessage
  | FindRouteMessage
  | UpdateEdgeMessage
  | UpdateHospitalMessage;

// ── Responses (Worker → Main) ──

export interface InitGraphResult {
  type: 'INIT_GRAPH_RESULT';
  success: boolean;
  nodeCount: number;
  edgeCount: number;
}

export interface RouteResult {
  type: 'ROUTE_RESULT';
  requestId: string;
  success: boolean;
  hospitalId: number;
  hospitalName: string;
  routeNodeIds: number[];
  totalDistance: number; // km approx
  totalTime: number; // minutes
  score: number;
  rationale: string;
  alternativesConsidered: AlternativeHospital[];
  computeTimeMs: number;
}

export interface RouteError {
  type: 'ROUTE_ERROR';
  requestId: string;
  error: string;
}

export interface EdgeUpdateResult {
  type: 'EDGE_UPDATE_RESULT';
  edgeId: number;
  success: boolean;
}

export type WorkerResponse =
  | InitGraphResult
  | RouteResult
  | RouteError
  | EdgeUpdateResult;

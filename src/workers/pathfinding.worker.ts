/* ═══════════════════════════════════════════════════════════
   Pathfinding Web Worker — A* with Min-Heap Priority Queue
   Composite cost: α·travel + β·wait + γ·medicine + δ·beds
   ═══════════════════════════════════════════════════════════ */

import type {
  WorkerRequest,
  WorkerResponse,
  InitGraphMessage,
  FindRouteMessage,
  RouteResult,
} from './types';
import type { AlternativeHospital } from '../db/schema';

// ═══════════════════════════════════════
// Min-Heap Priority Queue — O(log N)
// ═══════════════════════════════════════

interface HeapNode {
  id: number;
  priority: number;
}

class MinHeap {
  private heap: HeapNode[] = [];

  get size(): number {
    return this.heap.length;
  }

  push(id: number, priority: number): void {
    this.heap.push({ id, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[i].priority >= this.heap[parent].priority) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < n && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

// ═══════════════════════════════════════
// In-Memory Graph Data Structure
// ═══════════════════════════════════════

interface NodeData {
  id: number;
  lat: number;
  lng: number;
  type: string;
}

interface EdgeData {
  id: number;
  to: number;
  weight: number;
  blocked: boolean;
}

interface HospitalData {
  id: number;
  nodeId: number;
  name: string;
  bedsAvailable: number;
  bedsTotal: number;
  specialties: string[];
  medicineStock: Record<string, number>;
}

// Graph stored as adjacency list
const adjacencyList: Map<number, EdgeData[]> = new Map();
const nodeMap: Map<number, NodeData> = new Map();
const hospitalMap: Map<number, HospitalData> = new Map();
const hospitalByNode: Map<number, number> = new Map(); // nodeId → hospitalId
const edgeById: Map<number, { u: number; v: number; idx_u: number; idx_v: number }> = new Map();

// ═══════════════════════════════════════
// Haversine Distance (for A* heuristic)
// ═══════════════════════════════════════

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Heuristic: time estimate at avg 30 km/h
function heuristic(fromId: number, toId: number): number {
  const from = nodeMap.get(fromId);
  const to = nodeMap.get(toId);
  if (!from || !to) return 0;
  const distKm = haversineKm(from.lat, from.lng, to.lat, to.lng);
  return (distKm / 30) * 60; // minutes
}

// ═══════════════════════════════════════
// A* Pathfinding
// ═══════════════════════════════════════

interface AStarResult {
  path: number[];
  totalCost: number;
  found: boolean;
}

function aStar(sourceId: number, targetId: number): AStarResult {
  const gScore = new Map<number, number>();
  const fScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const closedSet = new Set<number>();

  const openHeap = new MinHeap();

  gScore.set(sourceId, 0);
  fScore.set(sourceId, heuristic(sourceId, targetId));
  openHeap.push(sourceId, fScore.get(sourceId)!);

  while (openHeap.size > 0) {
    const current = openHeap.pop()!;
    const currentId = current.id;

    if (currentId === targetId) {
      // Reconstruct path
      const path: number[] = [currentId];
      let node = currentId;
      while (cameFrom.has(node)) {
        node = cameFrom.get(node)!;
        path.unshift(node);
      }
      return { path, totalCost: gScore.get(currentId)!, found: true };
    }

    if (closedSet.has(currentId)) continue;
    closedSet.add(currentId);

    const neighbors = adjacencyList.get(currentId) || [];
    for (const edge of neighbors) {
      if (edge.blocked || closedSet.has(edge.to)) continue;

      const tentativeG = (gScore.get(currentId) ?? Infinity) + edge.weight;
      if (tentativeG < (gScore.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, currentId);
        gScore.set(edge.to, tentativeG);
        const f = tentativeG + heuristic(edge.to, targetId);
        fScore.set(edge.to, f);
        openHeap.push(edge.to, f);
      }
    }
  }

  return { path: [], totalCost: Infinity, found: false };
}

// ═══════════════════════════════════════
// Composite Hospital Scoring
// ═══════════════════════════════════════

// Cost = α·travel_time + β·wait_time + γ·medicine_penalty + δ·bed_penalty
const ALPHA = 0.50; // travel time weight
const BETA = 0.20;  // wait time weight
const GAMMA = 0.15; // medicine availability weight
const DELTA = 0.15; // bed availability weight

interface HospitalScore {
  hospitalId: number;
  hospitalName: string;
  nodeId: number;
  path: number[];
  travelTime: number;
  waitTime: number;
  medicinePenalty: number;
  bedPenalty: number;
  compositeScore: number;
  reason: string;
}

function scoreHospital(
  hospital: HospitalData,
  travelTime: number,
  path: number[],
  urgencyTier: number,
  requiredSpecialty?: string,
  requiredMedicine?: string,
): HospitalScore {
  // Wait time: inverse of bed availability ratio
  const bedRatio = hospital.bedsTotal > 0 ? hospital.bedsAvailable / hospital.bedsTotal : 0;
  const waitTime = bedRatio > 0.3 ? 0 : bedRatio > 0.1 ? 30 : 60; // minutes

  // Medicine penalty
  let medicinePenalty = 0;
  if (requiredMedicine) {
    const stock = hospital.medicineStock[requiredMedicine] ?? 0;
    medicinePenalty = stock > 10 ? 0 : stock > 0 ? 50 : 100;
  }

  // Bed penalty
  const bedPenalty = hospital.bedsAvailable > 5 ? 0 :
                     hospital.bedsAvailable > 0 ? 40 : 100;

  // Specialty penalty (added to travel time as extra cost)
  let specialtyBonus = 0;
  if (requiredSpecialty && !hospital.specialties.includes(requiredSpecialty)) {
    specialtyBonus = 80; // big penalty for missing specialty
  }

  // Urgency multiplier — critical cases weight travel time more
  const urgencyMult = urgencyTier === 1 ? 1.5 : urgencyTier === 2 ? 1.2 : 1.0;

  const compositeScore =
    ALPHA * travelTime * urgencyMult +
    BETA * waitTime +
    GAMMA * medicinePenalty +
    DELTA * bedPenalty +
    specialtyBonus;

  // Generate human-readable rationale
  const reasons: string[] = [];
  reasons.push(`Travel: ${travelTime.toFixed(1)} min`);
  if (bedRatio > 0.3) reasons.push(`Beds: ${hospital.bedsAvailable}/${hospital.bedsTotal} (good)`);
  else reasons.push(`Beds: ${hospital.bedsAvailable}/${hospital.bedsTotal} (limited)`);
  if (requiredSpecialty) {
    reasons.push(hospital.specialties.includes(requiredSpecialty)
      ? `Has ${requiredSpecialty}` : `Missing ${requiredSpecialty}`);
  }
  if (requiredMedicine) {
    const stock = hospital.medicineStock[requiredMedicine] ?? 0;
    reasons.push(`${requiredMedicine}: ${stock} units`);
  }

  return {
    hospitalId: hospital.id,
    hospitalName: hospital.name,
    nodeId: hospital.nodeId,
    path,
    travelTime,
    waitTime,
    medicinePenalty,
    bedPenalty,
    compositeScore,
    reason: reasons.join(' | '),
  };
}

// ═══════════════════════════════════════
// Message Handlers
// ═══════════════════════════════════════

function handleInitGraph(msg: InitGraphMessage): void {
  adjacencyList.clear();
  nodeMap.clear();
  hospitalMap.clear();
  hospitalByNode.clear();
  edgeById.clear();

  // Build node map
  for (const n of msg.nodes) {
    nodeMap.set(n.id, n);
    adjacencyList.set(n.id, []);
  }

  // Build adjacency list
  for (const e of msg.edges) {
    const edgeForward: EdgeData = { id: e.id, to: e.v, weight: e.weight, blocked: e.blocked };
    const edgeBackward: EdgeData = { id: e.id, to: e.u, weight: e.weight, blocked: e.blocked };

    adjacencyList.get(e.u)?.push(edgeForward);
    adjacencyList.get(e.v)?.push(edgeBackward);

    edgeById.set(e.id, {
      u: e.u, v: e.v,
      idx_u: (adjacencyList.get(e.u)?.length ?? 1) - 1,
      idx_v: (adjacencyList.get(e.v)?.length ?? 1) - 1,
    });
  }

  // Build hospital map
  for (const h of msg.hospitals) {
    hospitalMap.set(h.id, h);
    hospitalByNode.set(h.nodeId, h.id);
  }

  const response: WorkerResponse = {
    type: 'INIT_GRAPH_RESULT',
    success: true,
    nodeCount: msg.nodes.length,
    edgeCount: msg.edges.length,
  };
  self.postMessage(response);
}

function handleFindRoute(msg: FindRouteMessage): void {
  const startTime = performance.now();

  const sourceNode = nodeMap.get(msg.sourceNodeId);
  if (!sourceNode) {
    const error: WorkerResponse = {
      type: 'ROUTE_ERROR',
      requestId: msg.requestId,
      error: `Source node ${msg.sourceNodeId} not found`,
    };
    self.postMessage(error);
    return;
  }

  // Score all hospitals
  const scores: HospitalScore[] = [];

  for (const [, hospital] of hospitalMap) {
    // Skip hospitals with no beds for critical patients
    if (msg.urgencyTier === 1 && hospital.bedsAvailable === 0) continue;

    const result = aStar(msg.sourceNodeId, hospital.nodeId);
    if (!result.found) continue;

    const score = scoreHospital(
      hospital,
      result.totalCost,
      result.path,
      msg.urgencyTier,
      msg.requiredSpecialty,
      msg.requiredMedicine,
    );
    scores.push(score);
  }

  // Sort by composite score (lower = better)
  scores.sort((a, b) => a.compositeScore - b.compositeScore);

  const computeTimeMs = performance.now() - startTime;

  if (scores.length === 0) {
    const error: WorkerResponse = {
      type: 'ROUTE_ERROR',
      requestId: msg.requestId,
      error: 'No reachable hospital found. All routes may be blocked.',
    };
    self.postMessage(error);
    return;
  }

  const best = scores[0];
  const alternatives: AlternativeHospital[] = scores.slice(1, 4).map((s) => ({
    hospitalId: s.hospitalId,
    hospitalName: s.hospitalName,
    score: Math.round(s.compositeScore * 100) / 100,
    reason: s.reason,
  }));

  const distKm = best.path.length > 1
    ? best.path.reduce((sum, nodeId, idx) => {
        if (idx === 0) return 0;
        const prev = nodeMap.get(best.path[idx - 1])!;
        const curr = nodeMap.get(nodeId)!;
        return sum + haversineKm(prev.lat, prev.lng, curr.lat, curr.lng);
      }, 0)
    : 0;

  const response: RouteResult = {
    type: 'ROUTE_RESULT',
    requestId: msg.requestId,
    success: true,
    hospitalId: best.hospitalId,
    hospitalName: best.hospitalName,
    routeNodeIds: best.path,
    totalDistance: Math.round(distKm * 100) / 100,
    totalTime: Math.round(best.travelTime * 10) / 10,
    score: Math.round(best.compositeScore * 100) / 100,
    rationale: `Selected ${best.hospitalName}: ${best.reason}`,
    alternativesConsidered: alternatives,
    computeTimeMs: Math.round(computeTimeMs),
  };
  self.postMessage(response);
}

// ═══════════════════════════════════════
// Worker Entry Point
// ═══════════════════════════════════════

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'INIT_GRAPH':
      handleInitGraph(msg);
      break;
    case 'FIND_ROUTE':
      handleFindRoute(msg);
      break;
    case 'UPDATE_EDGE': {
      const info = edgeById.get(msg.edgeId);
      if (info) {
        const listU = adjacencyList.get(info.u);
        const listV = adjacencyList.get(info.v);
        if (listU?.[info.idx_u]) listU[info.idx_u].blocked = msg.blocked;
        if (listV?.[info.idx_v]) listV[info.idx_v].blocked = msg.blocked;
      }
      self.postMessage({ type: 'EDGE_UPDATE_RESULT', edgeId: msg.edgeId, success: true });
      break;
    }
    case 'UPDATE_HOSPITAL': {
      const h = hospitalMap.get(msg.hospitalId);
      if (h) {
        if (msg.bedsAvailable !== undefined) h.bedsAvailable = msg.bedsAvailable;
        if (msg.medicineStock) h.medicineStock = { ...h.medicineStock, ...msg.medicineStock };
      }
      break;
    }
  }
};

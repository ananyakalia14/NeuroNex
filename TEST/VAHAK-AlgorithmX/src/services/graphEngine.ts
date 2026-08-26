import {
  GraphNode,
  GraphEdge,
  NodeType,
  Village,
  Hospital,
  Pharmacy,
  RoadSegment,
} from '../types';

/**
 * Calculates accurate geodesic distance (in kilometers) between two geographic coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Weighted Road Network Graph with Adjacency List
 */
export class RoadNetworkGraph {
  public nodes: Map<string, GraphNode> = new Map();
  public adjacencyList: Map<string, GraphEdge[]> = new Map();
  public edges: Map<string, GraphEdge> = new Map();
  public version = 1;

  constructor() {
    this.nodes = new Map();
    this.adjacencyList = new Map();
    this.edges = new Map();
    this.version = 1;
  }

  /**
   * Add a node to the graph
   */
  public addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.adjacencyList.has(node.id)) {
      this.adjacencyList.set(node.id, []);
    }
  }

  /**
   * Add an edge to the graph (bidirectional by default for rural 2-way roads)
   */
  public addEdge(edge: GraphEdge, bidirectional = true): void {
    this.edges.set(edge.id, edge);

    if (!this.adjacencyList.has(edge.from)) {
      this.adjacencyList.set(edge.from, []);
    }
    this.adjacencyList.get(edge.from)!.push(edge);

    if (bidirectional) {
      const reverseEdge: GraphEdge = {
        ...edge,
        id: `${edge.id}-rev`,
        from: edge.to,
        to: edge.from,
      };
      if (!this.adjacencyList.has(edge.to)) {
        this.adjacencyList.set(edge.to, []);
      }
      this.adjacencyList.get(edge.to)!.push(reverseEdge);
    }
  }

  /**
   * Get all outgoing edges from a given node
   */
  public getNeighbors(nodeId: string): GraphEdge[] {
    return this.adjacencyList.get(nodeId) || [];
  }

  /**
   * Get node by ID
   */
  public getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Find the closest graph node to a given 3D position or lat/lon
   */
  public findClosestNode(
    pos: [number, number, number] | { lat?: number; lon?: number } | null | undefined
  ): GraphNode | null {
    if (!pos) {
      // Fallback to first node if available
      const first = this.nodes.values().next().value;
      return first || null;
    }
    let closestNode: GraphNode | null = null;
    let minDistance = Infinity;

    if (Array.isArray(pos)) {
      for (const node of this.nodes.values()) {
        const dx = node.position3D[0] - (pos[0] || 0);
        const dz = node.position3D[2] - (pos[2] || 0);
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }
    } else if (typeof pos === 'object' && typeof pos.lat === 'number' && typeof pos.lon === 'number') {
      for (const node of this.nodes.values()) {
        const dist = calculateHaversineDistanceKm(pos.lat, pos.lon, node.latitude, node.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestNode = node;
        }
      }
    } else {
      // Fallback search
      const first = this.nodes.values().next().value;
      return first || null;
    }

    return closestNode;
  }

  /**
   * Set road blocked status and increment graph version to invalidate stale caches
   */
  public setEdgeBlocked(roadId: string, blocked: boolean, reason?: string): boolean {
    let found = false;
    for (const [id, edge] of this.edges.entries()) {
      if (id === roadId || edge.id === roadId) {
        edge.blocked = blocked;
        edge.blockedReason = reason;
        found = true;
      }
    }

    // Also update in adjacency list
    for (const edges of this.adjacencyList.values()) {
      for (const edge of edges) {
        if (edge.id === roadId || edge.id === `${roadId}-rev`) {
          edge.blocked = blocked;
          edge.blockedReason = reason;
          found = true;
        }
      }
    }

    if (found) {
      this.version += 1;
    }
    return found;
  }

  /**
   * Calculate dynamic traversal impedance (cost in minutes)
   */
  public getEdgeTravelTime(edge: GraphEdge): number {
    if (edge.blocked) {
      return Infinity;
    }

    const baseTime = edge.travelTimeMin || (edge.distanceKm / 50) * 60;
    const traffic = edge.trafficMultiplier || 1.0;
    let conditionMultiplier = 1.0;

    switch (edge.roadCondition) {
      case 'GOOD':
        conditionMultiplier = 1.0;
        break;
      case 'FAIR':
        conditionMultiplier = 1.25;
        break;
      case 'POOR':
        conditionMultiplier = 1.6;
        break;
      case 'UNPAVED':
        conditionMultiplier = 2.0;
        break;
    }

    const slopePenalty = edge.elevationSlopePercent && edge.elevationSlopePercent > 8
      ? 1 + (edge.elevationSlopePercent - 8) * 0.05
      : 1.0;

    return baseTime * traffic * conditionMultiplier * slopePenalty;
  }

  /**
   * Geographic distance heuristic (Haversine converted to lower-bound travel time)
   * Admissible: assumes maximum allowable straight-line highway speed (90 km/h)
   */
  public heuristic(fromNodeId: string, toNodeId: string): number {
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    if (!fromNode || !toNode) return 0;

    const distanceKm = calculateHaversineDistanceKm(
      fromNode.latitude,
      fromNode.longitude,
      toNode.latitude,
      toNode.longitude
    );

    // Maximum speed for rural ambulance on clear direct highway = 90 km/h
    // Travel time lower bound = (distanceKm / 90) * 60 minutes
    const maxVelocityKmh = 90;
    return (distanceKm / maxVelocityKmh) * 60;
  }
}

/**
 * Factory function to construct the complete topological Road Network Graph
 * from villages, hospitals, pharmacies, and road segments.
 */
export function buildRoadNetworkGraph(
  villages: Village[],
  hospitals: Hospital[],
  pharmacies: Pharmacy[],
  roadSegments: RoadSegment[]
): RoadNetworkGraph {
  const graph = new RoadNetworkGraph();

  // 1. Add Village nodes
  villages.forEach((v) => {
    graph.addNode({
      id: v.id,
      name: v.name,
      latitude: v.latitude,
      longitude: v.longitude,
      type: 'VILLAGE',
      position3D: v.position,
      elevationMeters: v.elevationMeters,
    });
  });

  // 2. Add Hospital nodes
  hospitals.forEach((h) => {
    graph.addNode({
      id: h.id,
      name: h.name,
      latitude: h.latitude,
      longitude: h.longitude,
      type: 'HOSPITAL',
      position3D: h.position,
      elevationMeters: 300,
    });
  });

  // 3. Add Pharmacy nodes
  pharmacies.forEach((p) => {
    graph.addNode({
      id: p.id,
      name: p.name,
      latitude: p.latitude || 24.5,
      longitude: p.longitude || 85.0,
      type: 'PHARMACY',
      position3D: p.position,
    });
  });

  // 4. Add Arterial Highway Junction nodes to form a realistic connected mesh
  const junctionNodes: GraphNode[] = [
    { id: 'junc-alpha', name: 'Valley Arterial Crossroad (J-01)', latitude: 24.52, longitude: 84.95, type: 'JUNCTION', position3D: [-5, 0.25, -5] },
    { id: 'junc-bravo', name: 'Northern Mountain Pass Junction (J-02)', latitude: 24.65, longitude: 85.08, type: 'JUNCTION', position3D: [12, 0.45, -14] },
    { id: 'junc-charlie', name: 'River Basin Causeway Interchange (J-03)', latitude: 24.42, longitude: 85.15, type: 'JUNCTION', position3D: [16, 0.2, 8] },
    { id: 'junc-delta', name: 'Southern Foothills Checkpoint (J-04)', latitude: 24.38, longitude: 84.88, type: 'JUNCTION', position3D: [-18, 0.3, 14] },
    { id: 'junc-echo', name: 'Western Highway Bypass (J-05)', latitude: 24.58, longitude: 84.80, type: 'JUNCTION', position3D: [-25, 0.2, -8] },
    { id: 'junc-foxtrot', name: 'Eastern Plateau Central Hub (J-06)', latitude: 24.60, longitude: 85.25, type: 'JUNCTION', position3D: [28, 0.35, -4] },
  ];

  junctionNodes.forEach((j) => graph.addNode(j));

  // 5. Add Road Edges from RoadSegments
  roadSegments.forEach((seg) => {
    const isBlocked = seg.status === 'BLOCKED_LANDSLIDE';
    const condition: 'GOOD' | 'FAIR' | 'POOR' | 'UNPAVED' =
      seg.status === 'WARNING_FLOOD'
        ? 'POOR'
        : seg.surfaceType === 'Gravel / Dirt'
        ? 'UNPAVED'
        : seg.surfaceType === 'Paved Rural'
        ? 'FAIR'
        : 'GOOD';

    const distanceKm = seg.lengthKm || 10;
    const speed = seg.maxSpeedKmh || 60;
    const travelTimeMin = parseFloat(((distanceKm / speed) * 60).toFixed(1));

    graph.addEdge({
      id: seg.id,
      from: seg.fromNodeId,
      to: seg.toNodeId,
      distanceKm,
      travelTimeMin,
      trafficMultiplier: 1.0,
      blocked: isBlocked,
      roadCondition: condition,
      surfaceType: seg.surfaceType,
      elevationSlopePercent: seg.elevationSlopePercent || 4,
      maxSpeedKmh: seg.maxSpeedKmh,
      blockedReason: seg.blockedReason,
    });
  });

  // 6. Ensure full connectivity across junctions if any nodes are disconnected
  junctionNodes.forEach((junc, idx) => {
    const nextJunc = junctionNodes[(idx + 1) % junctionNodes.length];
    const dist = calculateHaversineDistanceKm(junc.latitude, junc.longitude, nextJunc.latitude, nextJunc.longitude);
    const edgeId = `edge-ring-${junc.id}-${nextJunc.id}`;
    if (!graph.edges.has(edgeId)) {
      graph.addEdge({
        id: edgeId,
        from: junc.id,
        to: nextJunc.id,
        distanceKm: dist || 12,
        travelTimeMin: ((dist || 12) / 65) * 60,
        trafficMultiplier: 1.0,
        blocked: false,
        roadCondition: 'GOOD',
        surfaceType: 'Asphalt Highway',
        maxSpeedKmh: 65,
      });
    }
  });

  return graph;
}

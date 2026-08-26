import {
  GraphNode,
  GraphEdge,
  AlgorithmicRouteResult,
  RouteComparisonResult,
  RouteCacheStats,
  ExplorationTree,
  ExplorationStep,
} from '../types';
import { RoadNetworkGraph, calculateHaversineDistanceKm } from './graphEngine';
import { BinaryHeap } from './priorityQueue';
import { generateSmoothSplinePoints } from './routingAlgorithm';

interface PriorityNode {
  nodeId: string;
  priority: number; // fScore for A*, dist for Dijkstra
}

/**
 * Route Cache Manager with versioned invalidation and hit/miss telemetry
 */
export class RouteCacheManager {
  private cache: Map<string, AlgorithmicRouteResult> = new Map();
  private stats: RouteCacheStats = {
    hits: 0,
    misses: 0,
    totalLookups: 0,
    hitRatePercent: 0,
    cacheSize: 0,
    graphVersion: 1,
  };

  private buildKey(fromId: string, toId: string, graphVersion: number, algorithm: string): string {
    return `${fromId}->${toId}:v${graphVersion}:${algorithm}`;
  }

  public get(
    fromId: string,
    toId: string,
    graphVersion: number,
    algorithm: string
  ): AlgorithmicRouteResult | null {
    this.stats.totalLookups++;
    const key = this.buildKey(fromId, toId, graphVersion, algorithm);
    const cached = this.cache.get(key);

    if (cached) {
      this.stats.hits++;
      this.updateHitRate();
      return { ...cached, cacheHit: true };
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  public set(
    fromId: string,
    toId: string,
    graphVersion: number,
    algorithm: string,
    result: AlgorithmicRouteResult
  ): void {
    const key = this.buildKey(fromId, toId, graphVersion, algorithm);
    this.cache.set(key, result);
    this.stats.cacheSize = this.cache.size;
    this.stats.graphVersion = graphVersion;
  }

  /**
   * Invalidate all routes containing specific node or invalidate when graph version changes
   */
  public invalidateGraphVersion(newVersion: number): void {
    this.cache.clear();
    this.stats.cacheSize = 0;
    this.stats.graphVersion = newVersion;
  }

  public invalidateAffectedEdge(roadId: string): void {
    // Purge cached entries that could have used this road
    this.cache.clear();
    this.stats.cacheSize = 0;
  }

  public getStats(): RouteCacheStats {
    return { ...this.stats };
  }

  public clearStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.totalLookups = 0;
    this.stats.hitRatePercent = 0;
  }

  private updateHitRate(): void {
    if (this.stats.totalLookups > 0) {
      this.stats.hitRatePercent = parseFloat(
        ((this.stats.hits / this.stats.totalLookups) * 100).toFixed(1)
      );
    }
  }
}

export const globalRouteCache = new RouteCacheManager();

/**
 * Real A* Shortest-Path Algorithm on Weighted Road Graph
 * f(n) = g(n) + h(n)
 * g(n): accumulated travel time in minutes along unblocked edges
 * h(n): admissible Haversine-based geodesic distance heuristic
 */
export function aStarSearch(
  graph: RoadNetworkGraph,
  startNodeId: string,
  goalNodeId: string,
  options?: { bypassCache?: boolean }
): AlgorithmicRouteResult {
  const startTime = performance.now();

  // Check route cache
  if (!options?.bypassCache) {
    const cached = globalRouteCache.get(startNodeId, goalNodeId, graph.version, 'A_STAR');
    if (cached) {
      return cached;
    }
  }

  const startNode = graph.getNode(startNodeId);
  const goalNode = graph.getNode(goalNodeId);

  if (!startNode || !goalNode) {
    const execTime = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      route: [],
      distanceKm: 0,
      travelTimeMin: 0,
      visitedNodes: 0,
      executionTimeMs: execTime,
      waypoints3D: [],
      algorithm: 'A_STAR',
      cacheHit: false,
    };
  }

  // If start is the goal
  if (startNodeId === goalNodeId) {
    const execTime = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      route: [startNodeId],
      routeNodeObjects: [startNode],
      distanceKm: 0,
      travelTimeMin: 0,
      visitedNodes: 1,
      executionTimeMs: execTime,
      waypoints3D: [startNode.position3D],
      algorithm: 'A_STAR',
      cacheHit: false,
    };
  }

  // Open set priority queue (min-heap keyed on fScore)
  const openSet = new BinaryHeap<PriorityNode>((a, b) => a.priority - b.priority);

  // Maps to track shortest discovered path and ancestors
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const cameFrom = new Map<string, { prevNodeId: string; edge: GraphEdge }>();
  const inOpenSet = new Set<string>();
  const closedSet = new Set<string>();

  // Exploration tree recording
  const visitedSteps: ExplorationStep[] = [];
  const heuristicRays: { from: [number, number, number]; to: [number, number, number]; hVal: number }[] = [];
  let prunedEdgesCount = 0;

  let visitedNodesCount = 0;

  // Initialize start node
  gScore.set(startNodeId, 0);
  const initialH = graph.heuristic(startNodeId, goalNodeId);
  fScore.set(startNodeId, initialH);
  openSet.push({ nodeId: startNodeId, priority: initialH });
  inOpenSet.add(startNodeId);

  while (!openSet.isEmpty()) {
    const current = openSet.pop()!;
    const currentNodeId = current.nodeId;
    inOpenSet.delete(currentNodeId);

    const nodeObj = graph.getNode(currentNodeId);
    const parentLink = cameFrom.get(currentNodeId);
    const parentNode = parentLink ? graph.getNode(parentLink.prevNodeId) : undefined;
    const currentG = gScore.get(currentNodeId) ?? 0;
    const currentH = graph.heuristic(currentNodeId, goalNodeId);
    const currentF = currentG + currentH;

    visitedNodesCount++;

    if (nodeObj) {
      visitedSteps.push({
        nodeId: currentNodeId,
        nodeName: nodeObj.name,
        position3D: nodeObj.position3D,
        fScore: parseFloat(currentF.toFixed(2)),
        gScore: parseFloat(currentG.toFixed(2)),
        hScore: parseFloat(currentH.toFixed(2)),
        parentPos: parentNode?.position3D,
        isGoal: currentNodeId === goalNodeId,
        order: visitedNodesCount,
      });

      if (currentNodeId !== goalNodeId) {
        heuristicRays.push({
          from: nodeObj.position3D,
          to: goalNode.position3D,
          hVal: parseFloat(currentH.toFixed(1)),
        });
      }
    }

    // Goal reached!
    if (currentNodeId === goalNodeId) {
      const execTime = parseFloat((performance.now() - startTime).toFixed(2));
      const reconstructed = reconstructPath(graph, cameFrom, startNodeId, goalNodeId);

      // Collect frontier
      const frontierNodes: { nodeId: string; name: string; position3D: [number, number, number]; fScore: number }[] = [];
      for (const fId of inOpenSet) {
        const fn = graph.getNode(fId);
        if (fn) {
          frontierNodes.push({
            nodeId: fn.id,
            name: fn.name,
            position3D: fn.position3D,
            fScore: parseFloat((fScore.get(fId) || 0).toFixed(2)),
          });
        }
      }

      const explorationTree: ExplorationTree = {
        algorithm: 'A_STAR',
        visitedSteps,
        frontierNodes,
        heuristicRays: heuristicRays.slice(-16), // most recent active rays
        startNodePos: startNode.position3D,
        goalNodePos: goalNode.position3D,
        nodesExpanded: visitedNodesCount,
        prunedEdgesCount,
        executionTimeMs: Math.max(0.1, execTime),
      };

      const result: AlgorithmicRouteResult = {
        route: reconstructed.nodeIds,
        routeNodeObjects: reconstructed.nodes,
        distanceKm: reconstructed.totalDistanceKm,
        travelTimeMin: reconstructed.totalTravelTimeMin,
        visitedNodes: visitedNodesCount,
        executionTimeMs: Math.max(0.1, execTime),
        waypoints3D: reconstructed.waypoints3D,
        algorithm: 'A_STAR',
        cacheHit: false,
        elevationProfile: reconstructed.elevationProfile,
        explorationTree,
      };

      // Store in Cache
      globalRouteCache.set(startNodeId, goalNodeId, graph.version, 'A_STAR', result);
      return result;
    }

    closedSet.add(currentNodeId);

    // Examine unblocked adjacent neighbors
    const edges = graph.getNeighbors(currentNodeId);
    for (const edge of edges) {
      if (edge.blocked) {
        prunedEdgesCount++;
        continue; // Skip landslide/flood closures
      }

      const neighborId = edge.to;
      if (closedSet.has(neighborId)) {
        prunedEdgesCount++;
        continue;
      }

      const edgeCost = graph.getEdgeTravelTime(edge);
      if (!isFinite(edgeCost)) continue;

      const tentativeGScore = currentG + edgeCost;
      const previousNeighborG = gScore.get(neighborId) ?? Infinity;

      if (tentativeGScore < previousNeighborG) {
        // Discovered a faster path to neighbor!
        cameFrom.set(neighborId, { prevNodeId: currentNodeId, edge });
        gScore.set(neighborId, tentativeGScore);

        const h = graph.heuristic(neighborId, goalNodeId);
        const f = tentativeGScore + h;
        fScore.set(neighborId, f);

        if (!inOpenSet.has(neighborId)) {
          openSet.push({ nodeId: neighborId, priority: f });
          inOpenSet.add(neighborId);
        }
      } else {
        prunedEdgesCount++;
      }
    }
  }

  // If search exhausted with no path found (islanded / blocked network)
  const execTime = parseFloat((performance.now() - startTime).toFixed(2));
  return {
    route: [],
    distanceKm: 0,
    travelTimeMin: 0,
    visitedNodes: visitedNodesCount,
    executionTimeMs: Math.max(0.1, execTime),
    waypoints3D: [],
    algorithm: 'A_STAR',
    cacheHit: false,
  };
}

/**
 * Real Dijkstra Shortest-Path Algorithm on Weighted Road Graph
 * Uniform-cost search (h(n) = 0) for baseline benchmark comparison.
 */
export function dijkstraSearch(
  graph: RoadNetworkGraph,
  startNodeId: string,
  goalNodeId: string,
  options?: { bypassCache?: boolean }
): AlgorithmicRouteResult {
  const startTime = performance.now();

  // Check cache
  if (!options?.bypassCache) {
    const cached = globalRouteCache.get(startNodeId, goalNodeId, graph.version, 'DIJKSTRA');
    if (cached) {
      return cached;
    }
  }

  const startNode = graph.getNode(startNodeId);
  const goalNode = graph.getNode(goalNodeId);

  if (!startNode || !goalNode) {
    const execTime = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      route: [],
      distanceKm: 0,
      travelTimeMin: 0,
      visitedNodes: 0,
      executionTimeMs: execTime,
      waypoints3D: [],
      algorithm: 'DIJKSTRA',
      cacheHit: false,
    };
  }

  if (startNodeId === goalNodeId) {
    const execTime = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      route: [startNodeId],
      routeNodeObjects: [startNode],
      distanceKm: 0,
      travelTimeMin: 0,
      visitedNodes: 1,
      executionTimeMs: execTime,
      waypoints3D: [startNode.position3D],
      algorithm: 'DIJKSTRA',
      cacheHit: false,
    };
  }

  const dist = new Map<string, number>();
  const cameFrom = new Map<string, { prevNodeId: string; edge: GraphEdge }>();
  const visited = new Set<string>();
  const priorityQueue = new BinaryHeap<PriorityNode>((a, b) => a.priority - b.priority);

  // Exploration tree recording
  const visitedSteps: ExplorationStep[] = [];
  let prunedEdgesCount = 0;
  let visitedNodesCount = 0;

  dist.set(startNodeId, 0);
  priorityQueue.push({ nodeId: startNodeId, priority: 0 });

  while (!priorityQueue.isEmpty()) {
    const current = priorityQueue.pop()!;
    const currentNodeId = current.nodeId;

    if (visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);
    visitedNodesCount++;

    const nodeObj = graph.getNode(currentNodeId);
    const parentLink = cameFrom.get(currentNodeId);
    const parentNode = parentLink ? graph.getNode(parentLink.prevNodeId) : undefined;
    const currentCost = dist.get(currentNodeId) ?? 0;

    if (nodeObj) {
      visitedSteps.push({
        nodeId: currentNodeId,
        nodeName: nodeObj.name,
        position3D: nodeObj.position3D,
        fScore: parseFloat(currentCost.toFixed(2)),
        gScore: parseFloat(currentCost.toFixed(2)),
        hScore: 0, // Dijkstra uniform cost (h = 0)
        parentPos: parentNode?.position3D,
        isGoal: currentNodeId === goalNodeId,
        order: visitedNodesCount,
      });
    }

    if (currentNodeId === goalNodeId) {
      const execTime = parseFloat((performance.now() - startTime).toFixed(2));
      const reconstructed = reconstructPath(graph, cameFrom, startNodeId, goalNodeId);

      const explorationTree: ExplorationTree = {
        algorithm: 'DIJKSTRA',
        visitedSteps,
        frontierNodes: [],
        heuristicRays: [],
        startNodePos: startNode.position3D,
        goalNodePos: goalNode.position3D,
        nodesExpanded: visitedNodesCount,
        prunedEdgesCount,
        executionTimeMs: Math.max(0.1, execTime),
      };

      const result: AlgorithmicRouteResult = {
        route: reconstructed.nodeIds,
        routeNodeObjects: reconstructed.nodes,
        distanceKm: reconstructed.totalDistanceKm,
        travelTimeMin: reconstructed.totalTravelTimeMin,
        visitedNodes: visitedNodesCount,
        executionTimeMs: Math.max(0.1, execTime),
        waypoints3D: reconstructed.waypoints3D,
        algorithm: 'DIJKSTRA',
        cacheHit: false,
        elevationProfile: reconstructed.elevationProfile,
        explorationTree,
      };

      globalRouteCache.set(startNodeId, goalNodeId, graph.version, 'DIJKSTRA', result);
      return result;
    }

    const currentDist = dist.get(currentNodeId) ?? Infinity;
    const edges = graph.getNeighbors(currentNodeId);

    for (const edge of edges) {
      if (edge.blocked) {
        prunedEdgesCount++;
        continue;
      }

      const neighborId = edge.to;
      if (visited.has(neighborId)) {
        prunedEdgesCount++;
        continue;
      }

      const edgeCost = graph.getEdgeTravelTime(edge);
      if (!isFinite(edgeCost)) continue;

      const newDist = currentDist + edgeCost;
      const prevDist = dist.get(neighborId) ?? Infinity;

      if (newDist < prevDist) {
        dist.set(neighborId, newDist);
        cameFrom.set(neighborId, { prevNodeId: currentNodeId, edge });
        priorityQueue.push({ nodeId: neighborId, priority: newDist });
      } else {
        prunedEdgesCount++;
      }
    }
  }

  const execTime = parseFloat((performance.now() - startTime).toFixed(2));
  return {
    route: [],
    distanceKm: 0,
    travelTimeMin: 0,
    visitedNodes: visitedNodesCount,
    executionTimeMs: Math.max(0.1, execTime),
    waypoints3D: [],
    algorithm: 'DIJKSTRA',
    cacheHit: false,
  };
}

/**
 * Reconstruct node path and generate 3D waypoints with elevation profiles
 */
function reconstructPath(
  graph: RoadNetworkGraph,
  cameFrom: Map<string, { prevNodeId: string; edge: GraphEdge }>,
  startNodeId: string,
  goalNodeId: string
): {
  nodeIds: string[];
  nodes: GraphNode[];
  totalDistanceKm: number;
  totalTravelTimeMin: number;
  waypoints3D: [number, number, number][];
  elevationProfile: { distKm: number; elevationM: number }[];
} {
  const nodeIds: string[] = [goalNodeId];
  let totalDistanceKm = 0;
  let totalTravelTimeMin = 0;

  let current = goalNodeId;
  while (cameFrom.has(current)) {
    const step = cameFrom.get(current)!;
    totalDistanceKm += step.edge.distanceKm;
    totalTravelTimeMin += graph.getEdgeTravelTime(step.edge);
    nodeIds.unshift(step.prevNodeId);
    current = step.prevNodeId;
  }

  const nodes: GraphNode[] = nodeIds
    .map((id) => graph.getNode(id))
    .filter((n): n is GraphNode => Boolean(n));

  const rawWaypoints: [number, number, number][] = nodes.map((n) => n.position3D);
  const smoothWaypoints = generateSmoothSplinePoints(rawWaypoints, 12);

  // Construct elevation profile
  let runningDist = 0;
  const elevationProfile = nodes.map((n, idx) => {
    if (idx > 0) {
      const prevNode = nodes[idx - 1];
      runningDist += calculateHaversineDistanceKm(
        prevNode.latitude,
        prevNode.longitude,
        n.latitude,
        n.longitude
      );
    }
    return {
      distKm: parseFloat(runningDist.toFixed(1)),
      elevationM: n.elevationMeters || 320 + Math.round(Math.abs(n.position3D[1] * 800)),
    };
  });

  return {
    nodeIds,
    nodes,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(1)),
    totalTravelTimeMin: parseFloat(totalTravelTimeMin.toFixed(1)),
    waypoints3D: smoothWaypoints,
    elevationProfile,
  };
}

/**
 * Benchmark & Compare A* vs Dijkstra on the same route
 */
export function compareRoutingAlgorithms(
  graph: RoadNetworkGraph,
  startNodeId: string,
  goalNodeId: string
): RouteComparisonResult {
  // Bypass cache to get real raw benchmark timing
  const aStarRes = aStarSearch(graph, startNodeId, goalNodeId, { bypassCache: true });
  const dijkstraRes = dijkstraSearch(graph, startNodeId, goalNodeId, { bypassCache: true });

  const distanceDiff = parseFloat(
    Math.abs(aStarRes.distanceKm - dijkstraRes.distanceKm).toFixed(2)
  );
  const timeDiff = parseFloat(
    Math.abs(aStarRes.travelTimeMin - dijkstraRes.travelTimeMin).toFixed(2)
  );

  const execRatio =
    aStarRes.executionTimeMs > 0
      ? parseFloat((dijkstraRes.executionTimeMs / aStarRes.executionTimeMs).toFixed(2))
      : 1.0;

  const visitedRatio =
    aStarRes.visitedNodes > 0
      ? parseFloat((dijkstraRes.visitedNodes / aStarRes.visitedNodes).toFixed(2))
      : 1.0;

  const pathsIdentical =
    aStarRes.route.length === dijkstraRes.route.length &&
    aStarRes.route.every((id, idx) => id === dijkstraRes.route[idx]);

  return {
    aStar: aStarRes,
    dijkstra: dijkstraRes,
    distanceDifferenceKm: distanceDiff,
    travelTimeDifferenceMin: timeDiff,
    executionTimeRatio: Math.max(1.0, execRatio),
    nodesVisitedRatio: Math.max(1.0, visitedRatio),
    pathsIdentical,
  };
}

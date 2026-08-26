import { Emergency, EmergencyUrgency } from '../types';

/**
 * Generic Comparator function: returns negative if itemA has higher priority than itemB
 */
export type PriorityComparator<T> = (a: T, b: T) => number;

/**
 * High-Performance Binary Min-Heap Priority Queue
 * All insertions and extractions operate in O(log n) time complexity.
 */
export class BinaryHeap<T> {
  private heap: T[] = [];
  private comparator: PriorityComparator<T>;

  constructor(comparator: PriorityComparator<T>) {
    this.comparator = comparator;
  }

  public size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public peek(): T | undefined {
    return this.heap[0];
  }

  /**
   * Insert item into priority queue: O(log n)
   */
  public push(item: T): void {
    this.heap.push(item);
    this.siftUp(this.heap.length - 1);
  }

  /**
   * Extract highest priority item: O(log n)
   */
  public pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.siftDown(0);
    return root;
  }

  /**
   * Remove a specific item from the queue: O(n + log n)
   */
  public remove(predicate: (item: T) => boolean): boolean {
    const index = this.heap.findIndex(predicate);
    if (index === -1) return false;

    if (index === this.heap.length - 1) {
      this.heap.pop();
      return true;
    }

    this.heap[index] = this.heap.pop()!;
    this.siftDown(index);
    this.siftUp(index);
    return true;
  }

  /**
   * Returns items in priority sorted order without mutating original heap
   */
  public toArraySorted(): T[] {
    const clone = new BinaryHeap<T>(this.comparator);
    clone.heap = [...this.heap];
    const result: T[] = [];
    while (!clone.isEmpty()) {
      result.push(clone.pop()!);
    }
    return result;
  }

  public toRawArray(): T[] {
    return [...this.heap];
  }

  public clear(): void {
    this.heap = [];
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      // If heap[current] has higher priority than heap[parent] (comparator < 0)
      if (this.comparator(this.heap[current], this.heap[parent]) < 0) {
        this.swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (true) {
      const left = 2 * current + 1;
      const right = 2 * current + 2;
      let highestPriority = current;

      if (
        left < length &&
        this.comparator(this.heap[left], this.heap[highestPriority]) < 0
      ) {
        highestPriority = left;
      }

      if (
        right < length &&
        this.comparator(this.heap[right], this.heap[highestPriority]) < 0
      ) {
        highestPriority = right;
      }

      if (highestPriority !== current) {
        this.swap(current, highestPriority);
        current = highestPriority;
      } else {
        break;
      }
    }
  }

  private swap(i: number, j: number): void {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}

// --------------------------------------------------------------------------
// EMERGENCY PRIORITY QUEUE HEURISTIC EVALUATOR
// --------------------------------------------------------------------------

const URGENCY_WEIGHTS: Record<EmergencyUrgency | string, number> = {
  CRITICAL: 1,
  Critical: 1,
  HIGH: 2,
  High: 2,
  MEDIUM: 3,
  Medium: 3,
  LOW: 4,
  Low: 4,
};

/**
 * Calculates medical severity score (0 to 100, higher is more severe)
 * based on physiological vital signs (GCS, SpO2, Heart Rate, Systolic BP).
 */
export function calculateMedicalSeverityScore(emergency: Emergency): number {
  let severityScore = 50;

  // Urgency baseline
  if (emergency.severity === 'Critical' || emergency.urgency === 'CRITICAL') {
    severityScore += 30;
  } else if (emergency.severity === 'High' || emergency.urgency === 'HIGH') {
    severityScore += 15;
  }

  const vitals = emergency.vitals || {};

  // Glasgow Coma Scale (GCS: 3-15)
  if (vitals.gcs !== undefined) {
    if (vitals.gcs <= 8) severityScore += 20; // Severe brain injury / coma
    else if (vitals.gcs <= 12) severityScore += 10;
  }

  // Oxygen Saturation SpO2 (%)
  if (vitals.spO2 !== undefined) {
    if (vitals.spO2 < 88) severityScore += 20; // Hypoxic crisis
    else if (vitals.spO2 < 93) severityScore += 10;
  }

  // Heart Rate (bpm)
  if (vitals.heartRate !== undefined) {
    if (vitals.heartRate > 140 || vitals.heartRate < 45) severityScore += 15; // Severe tachycardia / bradycardia
    else if (vitals.heartRate > 115 || vitals.heartRate < 55) severityScore += 5;
  }

  return Math.min(100, Math.max(0, severityScore));
}

/**
 * Calculate elapsed waiting time in minutes
 */
export function calculateWaitingTimeMinutes(emergency: Emergency): number {
  if (emergency.created_at) {
    const elapsedMs = Date.now() - new Date(emergency.created_at).getTime();
    return Math.max(0, Math.round(elapsedMs / 60000));
  }
  return 5; // Default 5 mins for mock items
}

/**
 * Calculate remaining SLA in minutes
 */
export function calculateSlaRemainingMinutes(emergency: Emergency): number {
  const targetSla = emergency.slaTargetMinutes || emergency.sla_minutes || 30;
  const elapsed = calculateWaitingTimeMinutes(emergency);
  return targetSla - elapsed;
}

/**
 * Emergency Priority Comparator implementing strict algorithmic criteria:
 * 1. Urgency: CRITICAL > HIGH > MEDIUM > LOW
 * Within the same urgency:
 * 1. Least SLA remaining (lowest remaining time has higher priority)
 * 2. Longest waiting time (longest waiting has higher priority)
 * 3. Medical severity score (higher severity has higher priority)
 */
export function emergencyPriorityComparator(a: Emergency, b: Emergency): number {
  // 1. Urgency Tier
  const urgencyA = URGENCY_WEIGHTS[a.urgency || a.severity] || 3;
  const urgencyB = URGENCY_WEIGHTS[b.urgency || b.severity] || 3;

  if (urgencyA !== urgencyB) {
    return urgencyA - urgencyB; // Lower weight number means higher priority (1 vs 2)
  }

  // 2. Least SLA Remaining
  const slaRemainingA = calculateSlaRemainingMinutes(a);
  const slaRemainingB = calculateSlaRemainingMinutes(b);
  if (slaRemainingA !== slaRemainingB) {
    return slaRemainingA - slaRemainingB; // Less remaining SLA time = more urgent
  }

  // 3. Longest Waiting Time
  const waitingA = calculateWaitingTimeMinutes(a);
  const waitingB = calculateWaitingTimeMinutes(b);
  if (waitingA !== waitingB) {
    return waitingB - waitingA; // More waiting time = higher priority
  }

  // 4. Medical Severity Score
  const severityA = calculateMedicalSeverityScore(a);
  const severityB = calculateMedicalSeverityScore(b);
  return severityB - severityA; // Higher score = higher priority
}

/**
 * Dedicated Priority Queue for Emergency Triage
 */
export class EmergencyPriorityQueue {
  private heap: BinaryHeap<Emergency>;

  constructor() {
    this.heap = new BinaryHeap<Emergency>(emergencyPriorityComparator);
  }

  public enqueue(emergency: Emergency): void {
    this.heap.push(emergency);
  }

  public dequeue(): Emergency | undefined {
    return this.heap.pop();
  }

  public peek(): Emergency | undefined {
    return this.heap.peek();
  }

  public size(): number {
    return this.heap.size();
  }

  public isEmpty(): boolean {
    return this.heap.isEmpty();
  }

  public remove(emergencyId: string): boolean {
    return this.heap.remove((e) => e.id === emergencyId);
  }

  public getSortedList(): Emergency[] {
    return this.heap.toArraySorted();
  }

  public getRawList(): Emergency[] {
    return this.heap.toRawArray();
  }

  public clear(): void {
    this.heap.clear();
  }
}

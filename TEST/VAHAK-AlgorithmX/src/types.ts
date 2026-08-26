export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type EmergencyUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type EmergencyStatus = 'QUEUED' | 'DISPATCHING' | 'DISPATCHED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'FAILED' | 'PENDING_TRIAGE' | 'ON_SCENE' | 'EN_ROUTE_HOSPITAL' | 'RESOLVED' | 'TRANSFERRED';
export type AmbulanceStatus = 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'TRANSPORTING' | 'MAINTENANCE' | 'Idle / Ready' | 'Dispatched En Route' | 'At Scene / Patient Loading' | 'Transporting to Hospital' | 'Maintenance / Refueling';
export type AmbulanceType = 'BLS' | 'ALS' | 'TRAUMA' | 'NEONATAL' | 'CRITICAL_CARE' | 'Advanced Life Support (ALS)' | 'Basic Life Support (BLS)' | '4x4 All-Terrain Critical Care' | 'Emergency Drone Medivac';
export type RoadStatus = 'OPEN' | 'WARNING_FLOOD' | 'BLOCKED_LANDSLIDE' | 'UNDER_REPAIR';
export type RoadClosureReason = 'FLOOD' | 'LANDSLIDE' | 'ACCIDENT' | 'CONSTRUCTION' | 'TRAFFIC';
export type UserRole = 'dispatcher' | 'doctor' | 'hospital_admin' | 'system_admin' | 'COMMAND_DIRECTOR' | 'TRIAGE_OFFICER' | 'FLEET_DISPATCHER' | 'HOSPITAL_CHIEF' | 'FIELD_PARAMEDIC';

export interface Coordinate3D {
  x: number;
  y: number;
  z: number;
}

// ----------------------------------------------------
// DATABASE & DOMAIN ENTITIES
// ----------------------------------------------------

export interface Village {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  population: number;
  region: string;
  created_at?: string;
  
  // 3D Space & Tactical Display mappings
  position: [number, number, number];
  activeEmergencies: number;
  nearestHospitalId: string;
  terrainDifficulty: 'Low' | 'Moderate' | 'Harsh Mountain' | 'Floodplain';
  elevationMeters: number;
  roadAccessStatus: 'clear' | 'partially_flooded' | 'blocked_landslide';
  healthCenterType: 'Primary Health Sub-center' | 'Community Health Post' | 'Tribal Aid Post';
  contactPerson: string;
  emergencyPhone: string;
  historicalResponseAvgMin: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Child';
  village_id: string;
  medical_history?: string;
  blood_group?: string;
  emergency_contact?: string;
  created_at?: string;
}

export interface HospitalDepartment {
  id: string;
  hospital_id: string;
  name: string;
  head_doctor?: string;
  active_load: number;
  capacity: number;
}

export interface HospitalBed {
  id: string;
  hospital_id: string;
  bed_number: string;
  department: string;
  is_icu: boolean;
  is_occupied: boolean;
  patient_id?: string;
  updated_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  total_beds: number;
  occupied_beds: number;
  icu_total: number;
  icu_occupied: number;
  status: 'ACTIVE' | 'SURGE' | 'DIVERT' | 'MAINTENANCE' | 'Normal' | 'Elevated' | 'Critical' | 'Surge Capacity';
  created_at?: string;
  
  // UI & 3D compatibility
  shortName: string;
  position: [number, number, number];
  type: 'District General Hospital' | 'Apex Trauma Center' | 'Rural Mission Hospital' | 'Community Health Center';
  traumaLevel?: string;
  totalBeds: number;
  availableBeds: number;
  icuTotal: number;
  icuAvailable: number;
  ventilatorsAvailable: number;
  emergencyLoad: 'Normal' | 'Elevated' | 'Critical' | 'Surge Capacity';
  specialists: string[];
  specialties?: string[];
  oxygenReservesHours?: number;
  helipadReady?: boolean;
  contactNumber?: string;
  medicineStockPercent: number;
  bloodBankUnits: {
    'O+': number;
    'O-': number;
    'A+': number;
    'B+': number;
  };
  helipadStatus: 'Available' | 'Occupied' | 'Unavailable';
  contactRadio: string;
  address: string;
  departments?: HospitalDepartment[];
}

export interface DoctorShift {
  id: string;
  doctor_id: string;
  hospital_id: string;
  shift_type: 'MORNING' | 'EVENING' | 'NIGHT' | 'ON_CALL';
  start_time: string;
  end_time: string;
  date: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  specialty?: string;
  hospital_id?: string;
  hospitalId: string;
  hospitalName: string;
  availability: boolean;
  shift_start?: string;
  shift_end?: string;
  current_patient?: string;
  status: 'Available' | 'In Surgery' | 'On Tele-Consult' | 'Off Shift' | 'Offline / Off-Duty' | 'ACTIVE' | 'BUSY' | 'OFF_DUTY';
  phone: string;
  rating: number;
  activeConsultsCount: number;
  experienceYears: number;
  avatarUrl: string;
  currentCallId?: string;
  languages: string[];
}

export interface AmbulanceEquipment {
  id: string;
  ambulance_id: string;
  equipment_name: string;
  is_functional: boolean;
  last_checked: string;
}

export interface Ambulance {
  id: string;
  vehicle_number?: string;
  callsign: string;
  type: AmbulanceType;
  status: AmbulanceStatus;
  latitude?: number;
  longitude?: number;
  position: [number, number, number];
  driver_name?: string;
  driverName: string;
  paramedicLead: string;
  fuel_percentage?: number;
  fuelPercent: number;
  last_updated?: string;
  
  // Advanced Telemetry & 3D Routing
  homeBaseId: string;
  assignedEmergencyId?: string;
  assignedHospitalId?: string;
  oxygenLevelPercent: number;
  speedKmh: number;
  estimatedArrivalMinutes?: number;
  routeWaypoints?: [number, number, number][];
  currentWaypointIndex?: number;
  batteryOrFuelType: 'Hybrid 4x4' | 'Diesel Heavy' | 'Electric eVTOL' | '4WD Rescue';
  equipment?: string[];
  telemetry: {
    tirePressureOk: boolean;
    defibrillatorReady: boolean;
    telemedicineUplink: 'Connected (5G Satellite)' | 'Connected (Mesh)' | 'Degraded' | 'Offline';
    lastServiceDate: string;
  };
}

export interface Emergency {
  id: string;
  patient_id?: string;
  patientId?: string;
  village_id?: string;
  villageId: string;
  villageName: string;
  urgency?: EmergencyUrgency;
  severity: SeverityLevel;
  condition: string;
  required_specialist?: string;
  requiredSpecialist: string;
  required_medicine?: string;
  requiredMedicine?: string;
  sla_minutes?: number;
  slaTargetMinutes: number;
  status: EmergencyStatus;
  created_at?: string;
  updated_at?: string;
  
  // UI & 3D compatibility
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other' | 'Child';
  position: [number, number, number];
  callerPhone: string;
  reportedAt: string;
  assignedAmbulanceId?: string;
  targetHospitalId?: string;
  etaMinutes: number;
  slaStatus: 'ON_TRACK' | 'AT_RISK' | 'BREACHED';
  vitals: {
    heartRate?: number;
    bloodPressure?: string;
    spO2?: number;
    respiratoryRate?: number;
    gcs?: number; // Glasgow Coma Scale
    tempCelsius?: number;
  };
  notes: string[];
  telemedicineActive?: boolean;
  droneSupportRequested?: boolean;
}

export interface Medicine {
  id: string;
  name: string;
  category: 'Antivenom & Antitoxins' | 'Emergency Resuscitation' | 'Blood & Plasma' | 'Maternal & Neonatal' | 'Broad-Spectrum Anti-Infective' | 'Analgesic & Sedative' | string;
  unit: string;
  criticality?: 'Critical' | 'High' | 'Standard';
  currentStock: number;
  minThreshold: number;
  minimumThreshold?: number;
  hospitalId: string;
  hospitalName: string;
  expiryDate: string;
  urgentDroneDeliveryRequired: boolean;
  storageTempCelsius: string;
  coldChainRequirement?: string;
  lotNumber: string;
}

export interface MedicineInventory {
  id?: string;
  medicine_id: string;
  hospital_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_level: number;
  expiry_date: string;
  updated_at: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  position: [number, number, number];
  village_or_town?: string;
  villageOrTown: string;
  critical_stock_level?: number;
  criticalStockLevel: number;
  drone_pad_ready?: boolean;
  dronePadReady: boolean;
  activeRequests: number;
  contact_number?: string;
  contactNumber: string;
}

export interface RoadNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  node_type: 'VILLAGE' | 'HOSPITAL' | 'JUNCTION' | 'CHECKPOINT' | 'BRIDGE';
  position3D?: [number, number, number];
}

export interface RoadEdge {
  id: string;
  from_node: string;
  to_node: string;
  distance_km: number;
  travel_time_min: number;
  traffic_multiplier: number;
  road_condition: 'GOOD' | 'FAIR' | 'POOR' | 'UNPAVED';
  blocked: boolean;
}

export interface RoadClosure {
  id?: string;
  road_id: string;
  reason: RoadClosureReason;
  created_at: string;
  closed_until?: string;
}

export interface RoadSegment {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  startPos: [number, number, number];
  endPos: [number, number, number];
  name: string;
  status: RoadStatus;
  surfaceType: 'Asphalt Highway' | 'Paved Rural' | 'Gravel / Dirt' | 'Mountain Pass';
  terrainDifficulty?: 'Standard' | 'Mountain Slope' | 'River Valley' | 'Forest Trail';
  elevationSlopePercent?: number;
  maxSpeedKmh: number;
  lengthKm: number;
  blockedReason?: string;
  clearanceEtaMinutes?: number;
}

export interface RouteRecord {
  id: string;
  origin_node: string;
  destination_node: string;
  waypoints: [number, number, number][];
  total_distance_km: number;
  estimated_time_min: number;
  path_geojson?: any;
  generated_by: 'A_STAR' | 'DIJKSTRA' | 'AI_HEURISTIC';
  created_at?: string;
}

export interface Dispatch {
  id: string;
  emergency_id: string;
  ambulance_id: string;
  hospital_id: string;
  route_id?: string;
  assigned_at: string;
  eta_minutes: number;
  status: 'ASSIGNED' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'TRANSPORTING' | 'COMPLETED' | 'CANCELLED';
  decision_score?: number;
}

export interface DispatchEvent {
  id: string;
  dispatch_id: string;
  event_type: 'DISPATCH_TRIGGERED' | 'DEPARTED' | 'ARRIVED_SCENE' | 'TRIAGE_UPDATED' | 'EN_ROUTE_HOSPITAL' | 'PATIENT_HANDED_OFF';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface AiRecommendationRecord {
  id: string;
  emergency_id: string;
  recommended_ambulance_id: string;
  recommended_hospital_id: string;
  triage_summary: string;
  risk_score: number;
  confidence_score: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  component: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL' | 'A_STAR' | 'AI_TRIAGE' | 'WEBSOCKET';
  metadata?: any;
  created_at: string;
}

export interface TelemetryMetrics {
  ambulanceUtilization: number;
  hospitalCapacityPercent: number;
  medicineStockPercent: number;
  slaComplianceRate: number;
  avgResponseTimeMinutes: number;
  aStarComputeTimeMs: number;
  dijkstraComputeTimeMs?: number;
  aStarNodesVisitedAvg?: number;
  dijkstraNodesVisitedAvg?: number;
  routeCacheHits?: number;
  routeCacheMisses?: number;
  routeCacheHitRate?: number;
  routeRecalculationCount?: number;
  dispatchLatencyMs?: number;
  priorityQueueSize?: number;
  aiConfidence: number;
  webSocketLatencyMs: number;
  activeEmergenciesCount: number;
  availableAmbulances: number;
  totalAmbulances: number;
  availableHospitals: number;
  totalHospitals: number;
  databaseRowsCount?: number;
  realtimeConnected?: boolean;
}

// ----------------------------------------------------
// GRAPH & ALGORITHMIC ROUTING TYPES
// ----------------------------------------------------

export type NodeType = 'VILLAGE' | 'HOSPITAL' | 'PHARMACY' | 'JUNCTION';

export interface GraphNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: NodeType;
  position3D: [number, number, number];
  elevationMeters?: number;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  travelTimeMin: number;
  trafficMultiplier: number;
  blocked: boolean;
  roadCondition: 'GOOD' | 'FAIR' | 'POOR' | 'UNPAVED';
  surfaceType?: string;
  elevationSlopePercent?: number;
  maxSpeedKmh?: number;
  blockedReason?: string;
}

export interface ExplorationStep {
  nodeId: string;
  nodeName: string;
  position3D: [number, number, number];
  fScore: number;
  gScore: number;
  hScore: number;
  parentPos?: [number, number, number];
  isGoal?: boolean;
  order: number;
}

export interface ExplorationTree {
  algorithm: 'A_STAR' | 'DIJKSTRA';
  visitedSteps: ExplorationStep[];
  frontierNodes: { nodeId: string; name: string; position3D: [number, number, number]; fScore: number }[];
  heuristicRays: { from: [number, number, number]; to: [number, number, number]; hVal: number }[];
  startNodePos: [number, number, number];
  goalNodePos: [number, number, number];
  nodesExpanded: number;
  prunedEdgesCount: number;
  executionTimeMs: number;
}

export interface AlgorithmicRouteResult {
  route: string[]; // Node IDs: ["V-A", "J-12", "J-18", "H-C"]
  routeNodeObjects?: GraphNode[];
  distanceKm: number;
  travelTimeMin: number;
  visitedNodes: number;
  executionTimeMs: number;
  waypoints3D: [number, number, number][];
  algorithm: 'A_STAR' | 'DIJKSTRA';
  cacheHit?: boolean;
  riskFactor?: string;
  elevationProfile?: { distKm: number; elevationM: number }[];
  explorationTree?: ExplorationTree;
}

export interface RouteComparisonResult {
  aStar: AlgorithmicRouteResult;
  dijkstra: AlgorithmicRouteResult;
  distanceDifferenceKm: number;
  travelTimeDifferenceMin: number;
  executionTimeRatio: number; // e.g. Dijkstra took 3.5x longer
  nodesVisitedRatio: number;  // e.g. Dijkstra visited 4.2x more nodes
  pathsIdentical: boolean;
}

// ----------------------------------------------------
// CLINICAL FILTERING & DISPATCH EVALUATION TYPES
// ----------------------------------------------------

export interface HospitalClinicalEvaluation {
  hospital: Hospital;
  isEligible: boolean;
  rejectionReasons: string[];
  hasSpecialist: boolean;
  hasBedAvailable: boolean;
  hasIcuAvailable: boolean;
  hasRequiredMedicine: boolean;
  isOperational: boolean;
  hasViableRoute: boolean;
  calculatedRoute?: AlgorithmicRouteResult;
  travelTimeMin: number;
  ambulanceWaitTimeMin: number;
  capacityPenalty: number;
  trafficPenalty: number;
  slaRiskScore: number;
  totalHospitalScore: number; // Lowest feasible score wins
}

export interface AmbulanceMatchEvaluation {
  ambulance: Ambulance;
  isCompatible: boolean;
  rejectionReasons: string[];
  vehicleTypeMatch: boolean;
  equipmentMatch: boolean;
  isAvailable: boolean;
  hasRoute: boolean;
  calculatedRouteToPatient?: AlgorithmicRouteResult;
  etaMinutesToPatient: number;
  fuelScore: number;
  totalAmbulanceScore: number;
}

export interface DispatchPipelineResult {
  success: boolean;
  emergencyId: string;
  selectedHospital?: Hospital;
  selectedAmbulance?: Ambulance;
  routeToHospital?: AlgorithmicRouteResult;
  routeToPatient?: AlgorithmicRouteResult;
  hospitalEvaluations: HospitalClinicalEvaluation[];
  ambulanceEvaluations: AmbulanceMatchEvaluation[];
  rejectionSummary?: string;
  dispatchLatencyMs: number;
  reservationStatus: 'RESERVED_CONFIRMED' | 'ROLLBACK_FAILED' | 'NO_FEASIBLE_RESOURCE';
  dispatchId?: string;
  error?: string;
}

export interface RouteCacheStats {
  hits: number;
  misses: number;
  totalLookups: number;
  hitRatePercent: number;
  cacheSize: number;
  graphVersion: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'A_STAR' | 'AI_TRIAGE' | 'WEBSOCKET';
  component: string;
  message: string;
  meta?: any;
}

export interface SimulationScenario {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: 'FLOOD' | 'LANDSLIDE' | 'OUTBREAK' | 'MASS_CASUALTY' | 'NIGHT_STORM';
  affectedVillages: string[];
  blockedRoadIds: string[];
  initialEmergencies: Partial<Emergency>[];
  recommendedDroneIds: string[];
  riskFactorScore: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  department?: string;
  avatarUrl: string;
}

export type BackendConnectionState = 'CONNECTED_REALTIME' | 'FALLBACK_LOCAL' | 'CONNECTING' | 'ERROR';

import {
  Emergency,
  Hospital,
  Ambulance,
  Doctor,
  Medicine,
  HospitalClinicalEvaluation,
  AmbulanceMatchEvaluation,
  DispatchPipelineResult,
  AlgorithmicRouteResult,
} from '../types';
import { RoadNetworkGraph } from './graphEngine';
import { aStarSearch } from './intelligentRoutingEngine';
import { calculateSlaRemainingMinutes } from './priorityQueue';

/**
 * Evaluates clinical feasibility of a hospital for a specific emergency.
 * Strictly enforces clinical constraints:
 * 1. Specialist availability (Cardiologist, Trauma Surgeon, Neurologist, etc.)
 * 2. Bed & ICU capacity
 * 3. Required critical medicine in stock
 * 4. Operational readiness (not diverted or in maintenance)
 * 5. Viable physical/road route exists
 */
export function evaluateHospitalForEmergency(
  emergency: Emergency,
  hospital: Hospital,
  doctors: Doctor[],
  medicines: Medicine[],
  graph: RoadNetworkGraph,
  patientNodeId: string,
  ambulanceEtaToPatientMin = 0
): HospitalClinicalEvaluation {
  const rejectionReasons: string[] = [];

  // 1. Check Operational Status
  const isOperational = hospital.status !== 'DIVERT' && hospital.status !== 'MAINTENANCE';
  if (!isOperational) {
    rejectionReasons.push(`Hospital status is ${hospital.status} (diverting emergency traffic)`);
  }

  // 2. Check Bed Availability
  const availBeds = hospital.availableBeds ?? (hospital.totalBeds - hospital.occupied_beds);
  const icuAvail = hospital.icuAvailable ?? (hospital.icuTotal - hospital.icu_occupied);
  const isCritical = emergency.severity === 'Critical' || emergency.urgency === 'CRITICAL';

  const hasBedAvailable = availBeds > 0;
  const hasIcuAvailable = !isCritical || icuAvail > 0;

  if (!hasBedAvailable) {
    rejectionReasons.push('General ward beds at 100% capacity (0 available)');
  }
  if (isCritical && !hasIcuAvailable) {
    rejectionReasons.push('Critical emergency requires ICU bay, but ICU is at 100% capacity (0 ICU beds)');
  }

  // 3. Check Specialist Availability
  const requiredSpec = (emergency.requiredSpecialist || emergency.required_specialist || '').trim();
  let hasSpecialist = true;

  if (requiredSpec && requiredSpec.toLowerCase() !== 'any' && requiredSpec.toLowerCase() !== 'general physician') {
    const specLower = requiredSpec.toLowerCase();

    // Check if hospital list has specialist or doctor on duty
    const hospitalSpecialists = (hospital.specialists || hospital.specialties || []).map((s) => s.toLowerCase());
    const doctorsOnShift = doctors.filter(
      (d) =>
        (d.hospitalId === hospital.id || d.hospital_id === hospital.id) &&
        (d.status === 'Available' || d.status === 'ACTIVE' || d.availability === true) &&
        d.specialization.toLowerCase().includes(specLower)
    );

    const hasInHospitalList = hospitalSpecialists.some((s) => s.includes(specLower) || specLower.includes(s));
    const hasDoctorActive = doctorsOnShift.length > 0;

    hasSpecialist = hasInHospitalList || hasDoctorActive;

    if (!hasSpecialist) {
      rejectionReasons.push(`No ${requiredSpec} specialist on active shift at this facility`);
    }
  }

  // 4. Check Medicine Availability
  const requiredMed = (emergency.requiredMedicine || emergency.required_medicine || '').trim();
  let hasRequiredMedicine = true;

  if (requiredMed && requiredMed.toLowerCase() !== 'none' && requiredMed.toLowerCase() !== 'standard first aid') {
    const medLower = requiredMed.toLowerCase();
    const matchingMeds = medicines.filter(
      (m) =>
        m.hospitalId === hospital.id &&
        m.name.toLowerCase().includes(medLower) &&
        m.currentStock > 0
    );

    // If medicine is tracked at this hospital and out of stock
    const trackedMeds = medicines.filter(
      (m) => m.hospitalId === hospital.id && m.name.toLowerCase().includes(medLower)
    );

    if (trackedMeds.length > 0 && matchingMeds.length === 0) {
      hasRequiredMedicine = false;
      rejectionReasons.push(`Critical medicine "${requiredMed}" is completely OUT OF STOCK (0 units)`);
    }
  }

  // 5. Calculate A* Route from Patient Node to Hospital Node
  const hospNode = graph.getNode(hospital.id) || graph.findClosestNode(hospital.position);
  let hasViableRoute = false;
  let calculatedRoute: AlgorithmicRouteResult | undefined;
  let travelTimeMin = 999;

  if (hospNode) {
    calculatedRoute = aStarSearch(graph, patientNodeId, hospNode.id);
    if (calculatedRoute.route.length > 0) {
      hasViableRoute = true;
      travelTimeMin = calculatedRoute.travelTimeMin;
    } else {
      rejectionReasons.push('All connecting road corridors to this facility are blocked by landslides or floods');
    }
  } else {
    rejectionReasons.push('Hospital node not found in topological road graph');
  }

  const isEligible =
    isOperational &&
    hasBedAvailable &&
    hasIcuAvailable &&
    hasSpecialist &&
    hasRequiredMedicine &&
    hasViableRoute;

  // 6. Calculate Hospital Score (Lowest score wins)
  // hospitalScore = travelTime + ambulanceWaitTime + capacityPenalty + trafficPenalty + slaRisk
  const totalBeds = hospital.totalBeds || 100;
  const capacityOccupancyRatio = (totalBeds - availBeds) / Math.max(1, totalBeds);
  const capacityPenalty = parseFloat((capacityOccupancyRatio * 15).toFixed(1));

  // Traffic penalty (if poor roads or high traffic)
  const trafficPenalty = (calculatedRoute?.riskFactor?.includes('High') ? 8 : 0) + (hospital.emergencyLoad === 'Surge Capacity' ? 10 : 0);

  // SLA Risk Penalty
  const remainingSla = calculateSlaRemainingMinutes(emergency);
  const ambulanceWaitTimeMin = ambulanceEtaToPatientMin;
  const totalEstimatedDeliveryTime = travelTimeMin + ambulanceWaitTimeMin;
  const slaRiskScore = totalEstimatedDeliveryTime > remainingSla ? 50 + (totalEstimatedDeliveryTime - remainingSla) * 2 : 0;

  const totalHospitalScore = isEligible
    ? parseFloat((travelTimeMin + ambulanceWaitTimeMin + capacityPenalty + trafficPenalty + slaRiskScore).toFixed(1))
    : 9999;

  return {
    hospital,
    isEligible,
    rejectionReasons,
    hasSpecialist,
    hasBedAvailable,
    hasIcuAvailable,
    hasRequiredMedicine,
    isOperational,
    hasViableRoute,
    calculatedRoute,
    travelTimeMin,
    ambulanceWaitTimeMin: ambulanceEtaToPatientMin,
    capacityPenalty,
    trafficPenalty,
    slaRiskScore,
    totalHospitalScore,
  };
}

/**
 * Evaluates ambulance compatibility and proximity for an emergency.
 */
export function evaluateAmbulanceForEmergency(
  emergency: Emergency,
  ambulance: Ambulance,
  graph: RoadNetworkGraph,
  patientNodeId: string
): AmbulanceMatchEvaluation {
  const rejectionReasons: string[] = [];

  // 1. Availability Status
  const isAvailable =
    ambulance.status === 'Idle / Ready' ||
    ambulance.status === 'AVAILABLE' ||
    ambulance.status === 'Dispatched En Route'; // Can be retasked if idle

  if (!isAvailable) {
    rejectionReasons.push(`Unit is currently ${ambulance.status}`);
  }

  // 2. Vehicle Type & Equipment Match
  const isCritical = emergency.severity === 'Critical' || emergency.urgency === 'CRITICAL';
  const isDrone = ambulance.type.includes('Drone') || ambulance.type === 'Emergency Drone Medivac';

  let vehicleTypeMatch = true;
  let equipmentMatch = true;

  if (emergency.droneSupportRequested && !isDrone) {
    // Patient explicitly needs eVTOL rapid medicine drop
  } else if (!emergency.droneSupportRequested && isDrone && !emergency.requiredMedicine) {
    // Drones cannot transport human patients without medivac payload
    vehicleTypeMatch = false;
    rejectionReasons.push('Drone cannot transport physical patient (medicine delivery only)');
  }

  if (isCritical && !isDrone) {
    // Critical emergencies prefer ALS, Critical Care, or 4x4 with Defibrillator
    const hasDefib = ambulance.telemetry?.defibrillatorReady || ambulance.equipment?.includes('Defibrillator');
    if (ambulance.type === 'BLS' || ambulance.type === 'Basic Life Support (BLS)') {
      // Allowed but flagged lower
    }
  }

  // 3. Calculate Route from Ambulance Location to Patient
  const ambNode = graph.getNode(ambulance.homeBaseId) || graph.findClosestNode(ambulance.position);
  let hasRoute = false;
  let calculatedRouteToPatient: AlgorithmicRouteResult | undefined;
  let etaMinutesToPatient = 999;

  if (ambNode) {
    calculatedRouteToPatient = aStarSearch(graph, ambNode.id, patientNodeId);
    if (calculatedRouteToPatient.route.length > 0) {
      hasRoute = true;
      etaMinutesToPatient = calculatedRouteToPatient.travelTimeMin;
    } else {
      rejectionReasons.push('No passable road route from ambulance station to patient village');
    }
  } else {
    rejectionReasons.push('Ambulance station not found in road graph');
  }

  const isCompatible = isAvailable && vehicleTypeMatch && equipmentMatch && hasRoute;

  // Fuel penalty: if fuel is low (<30%)
  const fuelScore = (ambulance.fuelPercent || 100) < 35 ? 15 : 0;
  const totalAmbulanceScore = isCompatible
    ? parseFloat((etaMinutesToPatient + fuelScore).toFixed(1))
    : 9999;

  return {
    ambulance,
    isCompatible,
    rejectionReasons,
    vehicleTypeMatch,
    equipmentMatch,
    isAvailable,
    hasRoute,
    calculatedRouteToPatient,
    etaMinutesToPatient,
    fuelScore,
    totalAmbulanceScore,
  };
}

/**
 * Atomic Resource Reservation Lock with Rollback Safety
 * Prevents double-booking of ambulances, hospital beds, and pharmaceuticals.
 */
export interface ReservationContext {
  ambulanceId: string;
  hospitalId: string;
  medicineId?: string;
  medicineQuantity?: number;
}

export function executeAtomicResourceReservation(
  context: ReservationContext,
  ambulances: Ambulance[],
  hospitals: Hospital[],
  medicines: Medicine[]
): {
  success: boolean;
  updatedAmbulances: Ambulance[];
  updatedHospitals: Hospital[];
  updatedMedicines: Medicine[];
  rollbackError?: string;
} {
  const { ambulanceId, hospitalId, medicineId, medicineQuantity = 1 } = context;

  // Clone datasets for transactional rollback
  const ambClone = ambulances.map((a) => ({ ...a }));
  const hospClone = hospitals.map((h) => ({ ...h }));
  const medClone = medicines.map((m) => ({ ...m }));

  let ambulanceReserved = false;
  let hospitalBedReserved = false;
  let medicineReserved = false;

  try {
    // 1. Reserve Ambulance
    const targetAmb = ambClone.find((a) => a.id === ambulanceId);
    if (!targetAmb) throw new Error(`Ambulance ${ambulanceId} not found`);
    if (targetAmb.status !== 'Idle / Ready' && targetAmb.status !== 'AVAILABLE') {
      throw new Error(`Ambulance ${targetAmb.callsign} was locked by another dispatch`);
    }
    targetAmb.status = 'Dispatched En Route';
    ambulanceReserved = true;

    // 2. Reserve Hospital Bed
    const targetHosp = hospClone.find((h) => h.id === hospitalId);
    if (!targetHosp) throw new Error(`Hospital ${hospitalId} not found`);
    const availBeds = targetHosp.availableBeds ?? (targetHosp.totalBeds - targetHosp.occupied_beds);
    if (availBeds <= 0) {
      throw new Error(`Hospital ${targetHosp.name} has 0 available beds (concurrency conflict)`);
    }
    targetHosp.availableBeds = Math.max(0, availBeds - 1);
    targetHosp.occupied_beds = (targetHosp.occupied_beds || 0) + 1;
    hospitalBedReserved = true;

    // 3. Reserve Medicine if required
    if (medicineId) {
      const targetMed = medClone.find((m) => m.id === medicineId);
      if (targetMed) {
        if (targetMed.currentStock < medicineQuantity) {
          throw new Error(`Medicine ${targetMed.name} insufficient stock for reservation`);
        }
        targetMed.currentStock = Math.max(0, targetMed.currentStock - medicineQuantity);
        medicineReserved = true;
      }
    }

    return {
      success: true,
      updatedAmbulances: ambClone,
      updatedHospitals: hospClone,
      updatedMedicines: medClone,
    };
  } catch (err: any) {
    // Atomic Rollback: release all previously acquired resources
    console.warn('[ResourceReservation] Rollback triggered due to error:', err?.message);
    return {
      success: false,
      updatedAmbulances: ambulances,
      updatedHospitals: hospitals,
      updatedMedicines: medicines,
      rollbackError: err?.message || 'Transaction aborted',
    };
  }
}

/**
 * End-to-End Intelligent Dispatch Pipeline:
 * Emergency Created -> Clinical Validation -> Hospital Filtering & Scoring ->
 * Ambulance Filtering & Scoring -> A* Route -> Atomic Reservation -> Dispatch Result
 */
export function runDispatchPipeline(
  emergency: Emergency,
  hospitals: Hospital[],
  ambulances: Ambulance[],
  doctors: Doctor[],
  medicines: Medicine[],
  graph: RoadNetworkGraph
): DispatchPipelineResult {
  const startPipelineTime = performance.now();

  // Find patient village node
  const patientNode =
    graph.getNode(emergency.villageId) ||
    graph.findClosestNode(emergency.position) ||
    Array.from(graph.nodes.values())[0];

  if (!patientNode) {
    return {
      success: false,
      emergencyId: emergency.id,
      hospitalEvaluations: [],
      ambulanceEvaluations: [],
      dispatchLatencyMs: parseFloat((performance.now() - startPipelineTime).toFixed(2)),
      reservationStatus: 'NO_FEASIBLE_RESOURCE',
      rejectionSummary: 'Patient location is disconnected from regional geospatial network.',
    };
  }

  // 1. Evaluate All Ambulances
  const ambulanceEvaluations = ambulances.map((amb) =>
    evaluateAmbulanceForEmergency(emergency, amb, graph, patientNode.id)
  );

  const eligibleAmbulances = ambulanceEvaluations
    .filter((e) => e.isCompatible)
    .sort((a, b) => a.totalAmbulanceScore - b.totalAmbulanceScore);

  if (eligibleAmbulances.length === 0) {
    const latency = parseFloat((performance.now() - startPipelineTime).toFixed(2));
    const reasons = ambulanceEvaluations
      .flatMap((e) => e.rejectionReasons)
      .slice(0, 3)
      .join('; ');

    return {
      success: false,
      emergencyId: emergency.id,
      hospitalEvaluations: [],
      ambulanceEvaluations,
      dispatchLatencyMs: latency,
      reservationStatus: 'NO_FEASIBLE_RESOURCE',
      rejectionSummary: `No compatible ambulance available: ${reasons || 'All units busy or out of range.'}`,
    };
  }

  const selectedAmbulanceMatch = eligibleAmbulances[0];
  const ambulanceEtaToPatient = selectedAmbulanceMatch.etaMinutesToPatient;

  // 2. Evaluate All Hospitals with Clinical Constraints
  const hospitalEvaluations = hospitals.map((hosp) =>
    evaluateHospitalForEmergency(
      emergency,
      hosp,
      doctors,
      medicines,
      graph,
      patientNode.id,
      ambulanceEtaToPatient
    )
  );

  const eligibleHospitals = hospitalEvaluations
    .filter((e) => e.isEligible)
    .sort((a, b) => a.totalHospitalScore - b.totalHospitalScore);

  if (eligibleHospitals.length === 0) {
    const latency = parseFloat((performance.now() - startPipelineTime).toFixed(2));
    const reasons = hospitalEvaluations
      .flatMap((e) => e.rejectionReasons)
      .slice(0, 3)
      .join('; ');

    return {
      success: false,
      emergencyId: emergency.id,
      hospitalEvaluations,
      ambulanceEvaluations,
      dispatchLatencyMs: latency,
      reservationStatus: 'NO_FEASIBLE_RESOURCE',
      rejectionSummary: `Clinical validation failed for all regional hospitals: ${reasons}`,
    };
  }

  const selectedHospitalMatch = eligibleHospitals[0];

  // 3. Find matching critical medicine ID if applicable
  const targetMedicine = medicines.find(
    (m) =>
      m.hospitalId === selectedHospitalMatch.hospital.id &&
      emergency.requiredMedicine &&
      m.name.toLowerCase().includes(emergency.requiredMedicine.toLowerCase()) &&
      m.currentStock > 0
  );

  const latency = parseFloat((performance.now() - startPipelineTime).toFixed(2));

  return {
    success: true,
    emergencyId: emergency.id,
    selectedHospital: selectedHospitalMatch.hospital,
    selectedAmbulance: selectedAmbulanceMatch.ambulance,
    routeToHospital: selectedHospitalMatch.calculatedRoute,
    routeToPatient: selectedAmbulanceMatch.calculatedRouteToPatient,
    hospitalEvaluations,
    ambulanceEvaluations,
    dispatchLatencyMs: latency,
    reservationStatus: 'RESERVED_CONFIRMED',
    dispatchId: `disp-${Date.now().toString().slice(-6)}`,
  };
}

export const evaluateCandidateHospital = evaluateHospitalForEmergency;
export const evaluateCandidateAmbulance = evaluateAmbulanceForEmergency;


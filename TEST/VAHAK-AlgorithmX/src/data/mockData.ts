import {
  Village,
  Hospital,
  Ambulance,
  Emergency,
  Doctor,
  Medicine,
  RoadSegment,
  Pharmacy,
  SimulationScenario,
  TelemetryLog,
  User,
} from '../types';
import { generateSeedData } from '../services/seedDataGenerator';

export const INITIAL_USER: User = {
  id: 'usr-001',
  name: 'Dr. Evelyn Vasquez',
  email: 'e.vasquez@ruralhealth.ops',
  role: 'COMMAND_DIRECTOR',
  badgeNumber: 'CMD-9941',
  department: 'Emergency Dispatch & Regional Trauma Coordination',
  avatarUrl: 'https://images.unsplash.com/photo-1594824813589-72c01991d798?w=150&auto=format&fit=crop&q=80',
};

const seed = generateSeedData();

export const INITIAL_VILLAGES: Village[] = seed.villages;
export const INITIAL_HOSPITALS: Hospital[] = seed.hospitals;
export const INITIAL_AMBULANCES: Ambulance[] = seed.ambulances;
export const INITIAL_EMERGENCIES: Emergency[] = seed.emergencies;
export const INITIAL_DOCTORS: Doctor[] = seed.doctors;
export const INITIAL_MEDICINES: Medicine[] = seed.medicines;
export const INITIAL_ROAD_SEGMENTS: RoadSegment[] = seed.roadSegments;
export const INITIAL_PHARMACIES: Pharmacy[] = seed.pharmacies;
export const INITIAL_SIMULATIONS: SimulationScenario[] = seed.simulations;
export const INITIAL_LOGS: TelemetryLog[] = seed.logs;

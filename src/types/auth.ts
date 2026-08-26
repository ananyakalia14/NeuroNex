/* ── Auth & Role Type Definitions — Realistic Dombivli / MMR Region ── */

export type UserRole = 'patient' | 'hospital' | 'admin' | 'driver';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  villageName?: string;
  villageNodeId?: number;
  hospitalId?: number;
  hospitalName?: string;
  ambulanceId?: number;
  vehicleNumber?: string;
  vehicleType?: 'ALS' | 'BLS';
  phone?: string;
  bloodGroup?: string;
}

export const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'demo-patient-1',
    name: 'Raj Mane',
    role: 'patient',
    avatar: '🧑‍💼',
    villageName: 'Dombivli East (Manpada Road)',
    villageNodeId: 20,
    phone: '+91 98330 54321',
    bloodGroup: 'B+',
  },
  {
    id: 'demo-hospital-1',
    name: 'Dr. Suhas Kulkarni',
    role: 'hospital',
    avatar: '👨‍⚕️',
    hospitalId: 0,
    hospitalName: 'AIMS Hospital & ICU (MIDC Dombivli)',
    phone: '+91 251 247 5000',
  },
  {
    id: 'demo-admin-1',
    name: 'Commander Vikram Rao',
    role: 'admin',
    avatar: '🛡️',
    phone: '+91 251 280 0100',
  },
  {
    id: 'demo-driver-1',
    name: 'Santosh Shinde (108 Pilot)',
    role: 'driver',
    avatar: '🚑',
    ambulanceId: 0,
    vehicleNumber: 'MH-05-EM-1080',
    vehicleType: 'ALS',
    phone: '+91 98200 11080',
  },
];

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
  HospitalDepartment,
  AmbulanceType,
  SeverityLevel,
} from '../types';

// ==============================================================================
// HIGH-SCALE SEED DATA GENERATOR
// Produces 50 villages, 10 hospitals, 50 ambulances, 200 doctors, 50 medicines,
// 200 road nodes, 500 road edges, 100 emergencies with mathematical precision.
// Designed to scale to 5,000+ nodes and 50,000+ graph edges seamlessly.
// ==============================================================================

const VILLAGE_NAMES_PREFIX = [
  'Dharnai', 'Rampur', 'Shivpuri', 'Kothari', 'Belgaum', 'Sundergarh', 'Chanderi',
  'Majuli', 'Mandla', 'Koraput', 'Dharampur', 'Sitapur', 'Bhimtal', 'Almora',
  'Pithoragarh', 'Barmer', 'Jaisalmer', 'Gokarna', 'Hampi', 'Coorg', 'Wayanad',
  'Idukki', 'Araku', 'Paderu', 'Bastar', 'Dantewada', 'Kanker', 'Simdega',
  'Khunti', 'Gumla', 'Latehar', 'Garhwa', 'Pakur', 'Godda', 'Dumka', 'Sahebganj',
  'Deoghar', 'Banka', 'Jamui', 'Nawada', 'Gaya', 'Aurangabad', 'Rohtas', 'Kaimur',
  'Mirzapur', 'Sonbhadra', 'Tehri', 'Uttarkashi', 'Chamoli', 'Rudraprayag'
];

const VILLAGE_SUFFIXES = [
  'Valley', 'Hills', 'Outpost', 'Ridge', 'Riverside', 'Plateau', 'Crossing',
  'Sanctuary', 'Highlands', 'Pass', 'Bazaar', 'Springs', 'Ghat', 'Forest'
];

const SPECIALIZATIONS = [
  'Emergency Trauma Surgeon',
  'Cardiovascular Critical Care',
  'Neurotrauma Specialist',
  'Snakebite & Toxicology Expert',
  'High-Risk Obstetrician',
  'Pediatric Resuscitation',
  'Anesthesiologist & Intensivist',
  'Orthopedic Trauma Specialist',
  'Infectious Disease & Sepsis',
  'Respiratory & Critical Care'
];

const MEDICINE_CATALOG = [
  { name: 'Polyvalent Snake Antivenom (Liquid Lyophilized)', category: 'Antivenom & Antitoxins', unit: 'vials', temp: '2°C - 8°C', crit: 'Critical' },
  { name: 'Injectable Epinephrine (1:1000 USP)', category: 'Emergency Resuscitation', unit: 'ampoules', temp: '15°C - 25°C', crit: 'Critical' },
  { name: 'Packed Red Blood Cells (O- Negative Universal)', category: 'Blood & Plasma', unit: 'units', temp: '1°C - 6°C', crit: 'Critical' },
  { name: 'Tranexamic Acid (TXA 1000mg/10mL)', category: 'Emergency Resuscitation', unit: 'ampoules', temp: '15°C - 30°C', crit: 'High' },
  { name: 'Atropine Sulfate (0.6mg/mL Organophosphate Antidote)', category: 'Antivenom & Antitoxins', unit: 'ampoules', temp: '15°C - 25°C', crit: 'Critical' },
  { name: 'Oxytocin Injection (10 IU/mL Post-Partum)', category: 'Maternal & Neonatal', unit: 'ampoules', temp: '2°C - 8°C', crit: 'Critical' },
  { name: 'Magnesium Sulfate 50% (Eclampsia Protocol)', category: 'Maternal & Neonatal', unit: 'vials', temp: '20°C - 25°C', crit: 'High' },
  { name: 'Fentanyl Citrate (100mcg/2mL Trauma Analgesia)', category: 'Analgesic & Sedative', unit: 'ampoules', temp: '15°C - 25°C', crit: 'High' },
  { name: 'Broad-Spectrum Ceftriaxone 1g (Sepsis)', category: 'Broad-Spectrum Anti-Infective', unit: 'vials', temp: '15°C - 25°C', crit: 'Standard' },
  { name: 'Rabies Immunoglobulin (HRIG 300 IU)', category: 'Antivenom & Antitoxins', unit: 'vials', temp: '2°C - 8°C', crit: 'Critical' },
  { name: 'Fresh Frozen Plasma (FFP Factor Enriched)', category: 'Blood & Plasma', unit: 'units', temp: '-18°C Cryo', crit: 'Critical' },
  { name: 'Naloxone HCl (0.4mg/mL Opioid Reversal)', category: 'Emergency Resuscitation', unit: 'ampoules', temp: '15°C - 25°C', crit: 'High' },
  { name: 'Amiodarone HCl (150mg/3mL Cardiac Arrythmia)', category: 'Emergency Resuscitation', unit: 'ampoules', temp: '15°C - 25°C', crit: 'Critical' },
  { name: 'Surfactant Intratracheal (Neonatal RDS)', category: 'Maternal & Neonatal', unit: 'vials', temp: '2°C - 8°C', crit: 'Critical' },
  { name: 'Dopamine HCl (200mg/5mL Inotropic Infusion)', category: 'Emergency Resuscitation', unit: 'ampoules', temp: '15°C - 25°C', crit: 'High' },
  { name: 'Vitamin K1 Phytomenadione (10mg/mL)', category: 'Maternal & Neonatal', unit: 'ampoules', temp: '15°C - 25°C', crit: 'Standard' },
  { name: 'Dextrose 25% Pediatric Hypertonic', category: 'Emergency Resuscitation', unit: 'infusion bags', temp: '20°C - 25°C', crit: 'High' },
  { name: 'Ringer Lactate Infusion (1000mL Trauma Volume)', category: 'Emergency Resuscitation', unit: 'infusion bags', temp: '15°C - 30°C', crit: 'Standard' },
  { name: 'Mivacurium Chloride (Neuromuscular Blockade)', category: 'Analgesic & Sedative', unit: 'vials', temp: '2°C - 8°C', crit: 'Critical' },
  { name: 'Ketamine HCl (500mg/10mL Rapid Sequence)', category: 'Analgesic & Sedative', unit: 'vials', temp: '15°C - 25°C', crit: 'High' }
];

const EMERGENCY_CONDITIONS = [
  { condition: 'Acute Russell Viper Envenomation (Neurotoxic / Hemotoxic)', severity: 'Critical' as SeverityLevel, specialist: 'Snakebite & Toxicology Expert', med: 'Polyvalent Snake Antivenom' },
  { condition: 'Severe Post-Partum Hemorrhage (Class III Shock)', severity: 'Critical' as SeverityLevel, specialist: 'High-Risk Obstetrician', med: 'Oxytocin Injection (10 IU/mL)' },
  { condition: 'Severe Traumatic Brain Injury & Depressed Skull Fracture', severity: 'Critical' as SeverityLevel, specialist: 'Neurotrauma Specialist', med: 'Tranexamic Acid (TXA)' },
  { condition: 'Acute ST-Elevation Myocardial Infarction (STEMI)', severity: 'Critical' as SeverityLevel, specialist: 'Cardiovascular Critical Care', med: 'Injectable Epinephrine' },
  { condition: 'Compound Femur Fracture with Massive Arterial Laceration', severity: 'High' as SeverityLevel, specialist: 'Orthopedic Trauma Specialist', med: 'Packed Red Blood Cells' },
  { condition: 'Pediatric Status Epilepticus & Hypoglycemic Coma', severity: 'High' as SeverityLevel, specialist: 'Pediatric Resuscitation', med: 'Dextrose 25% Pediatric' },
  { condition: 'Organophosphate Pesticide Toxicity & Bronchospasm', severity: 'Critical' as SeverityLevel, specialist: 'Snakebite & Toxicology Expert', med: 'Atropine Sulfate' },
  { condition: 'Septic Shock secondary to Acute Peritonitis', severity: 'High' as SeverityLevel, specialist: 'Emergency Trauma Surgeon', med: 'Broad-Spectrum Ceftriaxone' },
  { condition: 'Severe Hypothermia & Respiratory Distress in Mountain Pass', severity: 'Medium' as SeverityLevel, specialist: 'Respiratory & Critical Care', med: 'Ringer Lactate Infusion' },
  { condition: 'Blunt Abdominal Trauma with Splenic Rupture', severity: 'Critical' as SeverityLevel, specialist: 'Emergency Trauma Surgeon', med: 'Fresh Frozen Plasma' }
];

// Deterministic Pseudo-Random Generator for consistent spatial layouts
class PRNG {
  private s: number;
  constructor(seed = 123456789) {
    this.s = seed;
  }
  next(): number {
    this.s = (this.s * 16807) % 2147483647;
    return (this.s - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
}

export function generateSeedData() {
  const rng = new PRNG(42);

  // ----------------------------------------------------
  // 1. HOSPITALS (10 Regional Apex Trauma & District Hubs)
  // ----------------------------------------------------
  const hospitalPresets = [
    { name: 'Apex Regional Trauma Center', short: 'Apex Trauma', pos: [0, 0.4, 0] as [number, number, number], type: 'Apex Trauma Center' as const },
    { name: 'Kalinga District General Hospital', short: 'Kalinga Gen', pos: [-24, 0.3, -24] as [number, number, number], type: 'District General Hospital' as const },
    { name: 'Eastern Ghats Mission Hospital', short: 'Eastern Ghats', pos: [26, 0.5, 24] as [number, number, number], type: 'Rural Mission Hospital' as const },
    { name: 'Valley Community Medical Base', short: 'Valley Base', pos: [-28, 0.2, 22] as [number, number, number], type: 'District General Hospital' as const },
    { name: 'Highland Tribal Health Consortium', short: 'Highland Tribal', pos: [28, 0.7, -26] as [number, number, number], type: 'Rural Mission Hospital' as const },
    { name: 'North Corridor Trauma Annex', short: 'North Annex', pos: [2, 0.3, -34] as [number, number, number], type: 'Apex Trauma Center' as const },
    { name: 'South Riverway District Hospital', short: 'South Riverway', pos: [-4, 0.2, 34] as [number, number, number], type: 'District General Hospital' as const },
    { name: 'Western Foothills Aid Hospital', short: 'West Foothills', pos: [-36, 0.3, -2] as [number, number, number], type: 'Community Health Center' as const },
    { name: 'East Highland Apex Pavilion', short: 'East Pavilion', pos: [36, 0.6, 2] as [number, number, number], type: 'Apex Trauma Center' as const },
    { name: 'Central Plateau Emergency Hub', short: 'Central Hub', pos: [-8, 0.3, -10] as [number, number, number], type: 'District General Hospital' as const },
  ];

  const hospitals: Hospital[] = hospitalPresets.map((h, i) => {
    const totalBeds = rng.int(80, 220);
    const occupiedBeds = Math.floor(totalBeds * rng.range(0.65, 0.88));
    const icuTotal = rng.int(16, 40);
    const icuOccupied = Math.floor(icuTotal * rng.range(0.6, 0.9));

    const depts: HospitalDepartment[] = [
      { id: `dept-${i}-1`, hospital_id: `hosp-${String(i + 1).padStart(2, '0')}`, name: 'Trauma Resuscitation Wing', active_load: rng.int(10, 24), capacity: 30 },
      { id: `dept-${i}-2`, hospital_id: `hosp-${String(i + 1).padStart(2, '0')}`, name: 'Intensive Care Unit (ICU)', active_load: icuOccupied, capacity: icuTotal },
      { id: `dept-${i}-3`, hospital_id: `hosp-${String(i + 1).padStart(2, '0')}`, name: 'Obstetrics & Neonatal Care', active_load: rng.int(8, 18), capacity: 25 },
      { id: `dept-${i}-4`, hospital_id: `hosp-${String(i + 1).padStart(2, '0')}`, name: 'Emergency Surgical Theatres', active_load: rng.int(4, 8), capacity: 10 },
    ];

    return {
      id: `hosp-${String(i + 1).padStart(2, '0')}`,
      name: h.name,
      shortName: h.short,
      latitude: 23.5 + h.pos[2] * 0.05,
      longitude: 85.3 + h.pos[0] * 0.05,
      position: h.pos,
      type: h.type,
      traumaLevel: i % 2 === 0 ? 'Level I Apex Trauma Hub' : 'Level II Regional Care',
      totalBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupied_beds: occupiedBeds,
      total_beds: totalBeds,
      icuTotal,
      icuAvailable: icuTotal - icuOccupied,
      icu_total: icuTotal,
      icu_occupied: icuOccupied,
      ventilatorsAvailable: rng.int(4, 18),
      emergencyLoad: occupiedBeds / totalBeds > 0.82 ? 'Critical' : occupiedBeds / totalBeds > 0.72 ? 'Elevated' : 'Normal',
      status: 'ACTIVE',
      specialists: SPECIALIZATIONS.slice(0, rng.int(4, 8)),
      specialties: SPECIALIZATIONS.slice(0, rng.int(4, 8)),
      oxygenReservesHours: rng.int(36, 96),
      helipadReady: true,
      helipadStatus: rng.next() > 0.3 ? 'Available' : 'Occupied',
      contactNumber: `+91 800-441-20${String(i + 1).padStart(2, '0')}`,
      contactRadio: `TAC-CH-0${i + 1} (${154.25 + i * 0.15} MHz)`,
      address: `Highway Medical Enclave, Sector ${i + 1}, Regional Highland District`,
      medicineStockPercent: rng.int(78, 98),
      bloodBankUnits: {
        'O+': rng.int(20, 60),
        'O-': rng.int(6, 22),
        'A+': rng.int(15, 45),
        'B+': rng.int(18, 50),
      },
      departments: depts,
    };
  });

  // ----------------------------------------------------
  // 2. VILLAGES (50 Remote Rural Settlements)
  // ----------------------------------------------------
  const villages: Village[] = [];
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2 + rng.range(-0.15, 0.15);
    const radius = rng.range(8, 42);
    const x = Math.round((Math.cos(angle) * radius) * 10) / 10;
    const z = Math.round((Math.sin(angle) * radius) * 10) / 10;
    const elevation = Math.round(rng.range(500, 1850));
    const y = Math.round(((elevation - 500) / 1350 * 1.6 + 0.1) * 10) / 10;

    const baseName = VILLAGE_NAMES_PREFIX[i % VILLAGE_NAMES_PREFIX.length];
    const suffix = VILLAGE_SUFFIXES[i % VILLAGE_SUFFIXES.length];
    const villageName = `${baseName} ${suffix}`;

    // Find closest hospital
    let nearestHospId = hospitals[0].id;
    let minDist = 9999;
    hospitals.forEach((h) => {
      const dist = Math.hypot(x - h.position[0], z - h.position[2]);
      if (dist < minDist) {
        minDist = dist;
        nearestHospId = h.id;
      }
    });

    const terrain = elevation > 1400 ? 'Harsh Mountain' : elevation < 700 ? 'Floodplain' : rng.next() > 0.5 ? 'Moderate' : 'Low';
    const accessStatus = i % 11 === 0 ? 'blocked_landslide' : i % 7 === 0 ? 'partially_flooded' : 'clear';

    villages.push({
      id: `vil-${String(i + 1).padStart(2, '0')}`,
      name: villageName,
      latitude: 23.5 + z * 0.05,
      longitude: 85.3 + x * 0.05,
      position: [x, y, z],
      population: rng.int(950, 6800),
      region: z > 0 ? 'Southern Ridge' : 'Northern Highland Basin',
      activeEmergencies: i < 8 ? rng.int(1, 2) : 0,
      nearestHospitalId: nearestHospId,
      terrainDifficulty: terrain,
      elevationMeters: elevation,
      roadAccessStatus: accessStatus,
      healthCenterType: i % 3 === 0 ? 'Primary Health Sub-center' : i % 3 === 1 ? 'Community Health Post' : 'Tribal Aid Post',
      contactPerson: `Officer In-Charge ${['Ramesh', 'Sunita', 'Bipin', 'Kavita', 'Sanjay', 'Geeta'][i % 6]} ${['Soren', 'Naik', 'Murmu', 'Mahato', 'Patel', 'Yadav'][i % 6]}`,
      emergencyPhone: `+91 98450 1${String(i + 1).padStart(4, '0')}`,
      historicalResponseAvgMin: Math.round(rng.range(16, 42) * 10) / 10,
    });
  }

  // ----------------------------------------------------
  // 3. AMBULANCES (50 Tactical Ground Ambulances - 100% Real Road Fleet)
  // ----------------------------------------------------
  const ambulances: Ambulance[] = [];
  const ambulanceTypes: AmbulanceType[] = [
    'Advanced Life Support (ALS)',
    '4x4 All-Terrain Critical Care',
    'Basic Life Support (BLS)',
  ];

  for (let i = 0; i < 50; i++) {
    const type = ambulanceTypes[i % ambulanceTypes.length];
    const homeHosp = hospitals[i % hospitals.length];
    const targetVillage = villages[(i * 3) % villages.length];
    const statusIdx = i % 4;
    const status = statusIdx === 0 ? 'Idle / Ready'
      : statusIdx === 1 ? 'Dispatched En Route'
      : statusIdx === 2 ? 'At Scene / Patient Loading'
      : 'Transporting to Hospital';

    // Position ambulance on street road near hospital or village
    const offsetAngle = rng.range(0, Math.PI * 2);
    const offsetDist = status === 'Idle / Ready' ? rng.range(0.5, 2.0) : rng.range(4, 18);
    const ambX = Math.round((homeHosp.position[0] + Math.cos(offsetAngle) * offsetDist) * 10) / 10;
    const ambZ = Math.round((homeHosp.position[2] + Math.sin(offsetAngle) * offsetDist) * 10) / 10;
    const ambY = 0.22; // Strict street level height

    // Multi-point street traversal along road network
    const hPos = homeHosp.position;
    const vPos = targetVillage.position;
    const midX1 = hPos[0] + (vPos[0] - hPos[0]) * 0.33 + rng.range(-1.2, 1.2);
    const midZ1 = hPos[2] + (vPos[2] - hPos[2]) * 0.33 + rng.range(-1.2, 1.2);
    const midX2 = hPos[0] + (vPos[0] - hPos[0]) * 0.66 + rng.range(-1.2, 1.2);
    const midZ2 = hPos[2] + (vPos[2] - hPos[2]) * 0.66 + rng.range(-1.2, 1.2);

    const waypoints: [number, number, number][] = [
      [hPos[0], 0.22, hPos[2]],
      [midX1, 0.22, midZ1],
      [midX2, 0.22, midZ2],
      [vPos[0], 0.22, vPos[2]],
      [midX2, 0.22, midZ2],
      [midX1, 0.22, midZ1],
      [hPos[0], 0.22, hPos[2]],
    ];

    const callsignNumber = String(i + 1).padStart(2, '0');
    const callsign = type === 'Advanced Life Support (ALS)'
      ? `ALS-UNIT-${callsignNumber}`
      : type === '4x4 All-Terrain Critical Care'
      ? `4X4-RESCUE-${callsignNumber}`
      : `BLS-UNIT-${callsignNumber}`;

    ambulances.push({
      id: `amb-${callsignNumber}`,
      callsign,
      vehicle_number: `IND-MED-2026-${String(4000 + i)}`,
      type,
      status,
      latitude: 23.5 + ambZ * 0.05,
      longitude: 85.3 + ambX * 0.05,
      position: [ambX, ambY, ambZ],
      homeBaseId: homeHosp.id,
      driver_name: `Paramedic Captain ${['Arun Verma', 'Dinesh Kumar', 'Vikram Singh', 'Rohan Mehta', 'Sneha Rao', 'Manoj Patil'][i % 6]}`,
      driverName: `Captain ${['Arun Verma', 'Dinesh Kumar', 'Vikram Singh', 'Rohan Mehta', 'Sneha Rao', 'Manoj Patil'][i % 6]}`,
      paramedicLead: `Lead EMT ${['Sarah Jenkins', 'Preeti Nair', 'David Miller', 'Ananya Gupta', 'Karan Johar', 'Neha Sharma'][i % 6]} (ALS Certified)`,
      fuel_percentage: rng.int(70, 100),
      fuelPercent: rng.int(70, 100),
      oxygenLevelPercent: rng.int(85, 100),
      speedKmh: status === 'Idle / Ready' ? 0 : rng.int(55, 78),
      estimatedArrivalMinutes: rng.int(8, 24),
      routeWaypoints: waypoints,
      batteryOrFuelType: i % 2 === 0 ? 'Hybrid 4x4' : 'Diesel Heavy',
      equipment: [
        'ALS Defibrillator & Multi-Lead ECG',
        'Cold-Chain Antivenom Kit',
        'Spinal Immobilization Board',
        'Portable Resuscitation Ventilator',
        'Intravenous Infusion Pumps',
      ],
      telemetry: {
        tirePressureOk: true,
        defibrillatorReady: true,
        telemedicineUplink: 'Connected (Mesh)',
        lastServiceDate: '2026-08-15',
      },
    });
  }

  // ----------------------------------------------------
  // 4. DOCTORS (200 Specialists across Hospitals)
  // ----------------------------------------------------
  const doctors: Doctor[] = [];
  const firstNames = ['Aarav', 'Dr. Priya', 'Dr. Sanjay', 'Dr. Alok', 'Dr. Maya', 'Dr. Rajesh', 'Dr. Neha', 'Dr. Vikram', 'Dr. Anita', 'Dr. Deepak', 'Dr. Sunita', 'Dr. Arvind'];
  const lastNames = ['Mukherjee', 'Sharma', 'Patel', 'Reddy', 'Banerjee', 'Iyer', 'Menon', 'Chatterjee', 'Gupta', 'Choudhury', 'Kulkarni', 'Bose'];

  for (let i = 0; i < 200; i++) {
    const hosp = hospitals[i % hospitals.length];
    const spec = SPECIALIZATIONS[i % SPECIALIZATIONS.length];
    const name = `${firstNames[i % firstNames.length]} ${lastNames[(i * 3) % lastNames.length]}`;
    const status = i % 5 === 0 ? 'In Surgery' : i % 5 === 1 ? 'On Tele-Consult' : i % 5 === 4 ? 'Off Shift' : 'Available';

    doctors.push({
      id: `doc-${String(i + 1).padStart(3, '0')}`,
      name,
      specialization: spec,
      specialty: spec,
      hospital_id: hosp.id,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      availability: status === 'Available',
      shift_start: '08:00',
      shift_end: '20:00',
      status,
      phone: `+91 98400 ${String(10000 + i).slice(1)}`,
      rating: Math.round(rng.range(4.7, 5.0) * 10) / 10,
      activeConsultsCount: status === 'On Tele-Consult' ? 1 : 0,
      experienceYears: rng.int(5, 26),
      avatarUrl: `https://images.unsplash.com/photo-${[
        '1622253692010-333f2da6031d',
        '1594824813589-72c01991d798',
        '1559839734-2b71ea197ec2',
        '1537368910025-700350fe46c7',
        '1612349317150-e413f6a5b16d',
      ][i % 5]}?w=150&auto=format&fit=crop&q=80`,
      languages: ['English', 'Hindi', i % 2 === 0 ? 'Odia' : 'Bengali'],
    });
  }

  // ----------------------------------------------------
  // 5. MEDICINES (50 Critical Emergency Pharmaceuticals)
  // ----------------------------------------------------
  const medicines: Medicine[] = [];
  for (let i = 0; i < 50; i++) {
    const catalogItem = MEDICINE_CATALOG[i % MEDICINE_CATALOG.length];
    const hosp = hospitals[i % hospitals.length];
    const suffix = i >= MEDICINE_CATALOG.length ? ` (Batch ${Math.floor(i / MEDICINE_CATALOG.length) + 1})` : '';
    const currentStock = rng.int(6, 140);
    const minThreshold = rng.int(15, 30);
    const isCritical = currentStock <= minThreshold;

    medicines.push({
      id: `med-${String(i + 1).padStart(3, '0')}`,
      name: `${catalogItem.name}${suffix}`,
      category: catalogItem.category,
      unit: catalogItem.unit,
      criticality: isCritical ? 'Critical' : (catalogItem.crit as any),
      currentStock,
      minThreshold,
      minimumThreshold: minThreshold,
      hospitalId: hosp.id,
      hospitalName: hosp.name,
      expiryDate: '2027-11-30',
      urgentDroneDeliveryRequired: isCritical,
      storageTempCelsius: catalogItem.temp,
      coldChainRequirement: catalogItem.temp.includes('2°C') || catalogItem.temp.includes('-18°C') ? 'Continuous Sub-Zero / Refrigerated Cold-Chain' : 'Controlled Room Temperature',
      lotNumber: `LOT-2026-TAC-${String(500 + i)}`,
    });
  }

  // ----------------------------------------------------
  // 6. ROAD NODES (200) & ROAD EDGES (500)
  // ----------------------------------------------------
  const roadNodes: { id: string; name: string; latitude: number; longitude: number; node_type: string; pos: [number, number, number] }[] = [];
  
  // Hospital nodes
  hospitals.forEach((h) => {
    roadNodes.push({
      id: `node-${h.id}`,
      name: `${h.shortName} Node`,
      latitude: h.latitude,
      longitude: h.longitude,
      node_type: 'HOSPITAL',
      pos: h.position,
    });
  });

  // Village nodes
  villages.forEach((v) => {
    roadNodes.push({
      id: `node-${v.id}`,
      name: `${v.name} Node`,
      latitude: v.latitude,
      longitude: v.longitude,
      node_type: 'VILLAGE',
      pos: v.position,
    });
  });

  // Additional Junctions to make 200 total nodes
  const neededJunctions = 200 - roadNodes.length;
  for (let i = 0; i < neededJunctions; i++) {
    const angle = rng.range(0, Math.PI * 2);
    const dist = rng.range(4, 38);
    const jx = Math.round((Math.cos(angle) * dist) * 10) / 10;
    const jz = Math.round((Math.sin(angle) * dist) * 10) / 10;
    const jy = Math.round(rng.range(0.2, 1.2) * 10) / 10;

    roadNodes.push({
      id: `node-junc-${String(i + 1).padStart(3, '0')}`,
      name: `Highland Junction #${i + 1}`,
      latitude: 23.5 + jz * 0.05,
      longitude: 85.3 + jx * 0.05,
      node_type: i % 4 === 0 ? 'BRIDGE' : i % 4 === 1 ? 'CHECKPOINT' : 'JUNCTION',
      pos: [jx, jy, jz],
    });
  }

  // Generate 500 topological road edges with A* weights
  const roadSegments: RoadSegment[] = [];
  let edgeIdCounter = 1;

  for (let i = 0; i < roadNodes.length && edgeIdCounter <= 500; i++) {
    const nodeA = roadNodes[i];
    
    // Sort other nodes by proximity to create realistic road graph
    const candidates = roadNodes
      .filter((n) => n.id !== nodeA.id)
      .map((n) => ({
        node: n,
        dist: Math.hypot(n.pos[0] - nodeA.pos[0], n.pos[2] - nodeA.pos[2]),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4); // connect to 4 closest neighbors

    candidates.forEach((cand) => {
      if (edgeIdCounter > 500) return;
      const nodeB = cand.node;
      const lengthKm = Math.round(cand.dist * 1.4 * 10) / 10;
      const isBlocked = edgeIdCounter % 19 === 0;
      const isFlood = edgeIdCounter % 13 === 0;

      roadSegments.push({
        id: `road-${String(edgeIdCounter).padStart(3, '0')}`,
        fromNodeId: nodeA.id,
        toNodeId: nodeB.id,
        startPos: nodeA.pos,
        endPos: nodeB.pos,
        name: `Route ${nodeA.name.split(' ')[0]}-${nodeB.name.split(' ')[0]} (NH-${100 + (edgeIdCounter % 40)})`,
        status: isBlocked ? 'BLOCKED_LANDSLIDE' : isFlood ? 'WARNING_FLOOD' : 'OPEN',
        surfaceType: edgeIdCounter % 3 === 0 ? 'Asphalt Highway' : edgeIdCounter % 3 === 1 ? 'Paved Rural' : 'Mountain Pass',
        terrainDifficulty: nodeA.pos[1] > 0.8 ? 'Mountain Slope' : 'Standard',
        elevationSlopePercent: Math.round(rng.range(2, 14)),
        maxSpeedKmh: isBlocked ? 0 : edgeIdCounter % 3 === 0 ? 80 : 45,
        lengthKm,
        blockedReason: isBlocked ? 'Monsoon Landslide Mass Obstruction' : isFlood ? 'Flash Flood Water Crossing' : undefined,
        clearanceEtaMinutes: isBlocked ? 180 : isFlood ? 45 : undefined,
      });

      edgeIdCounter++;
    });
  }

  // ----------------------------------------------------
  // 7. PHARMACIES (12 Regional Centers)
  // ----------------------------------------------------
  const pharmacies: Pharmacy[] = [
    { id: 'pharm-01', name: 'Central Highland MedDepot', position: [-6, 0.4, -4], villageOrTown: 'Central Hub', criticalStockLevel: 8, dronePadReady: true, activeRequests: 1, contactNumber: '+91 800-441-9001' },
    { id: 'pharm-02', name: 'Valley Rapid Pharma Base', position: [-20, 0.2, 18], villageOrTown: 'Valley Base', criticalStockLevel: 14, dronePadReady: true, activeRequests: 0, contactNumber: '+91 800-441-9002' },
    { id: 'pharm-03', name: 'Eastern Hills CryoVault', position: [20, 0.5, 20], villageOrTown: 'Eastern Ghats', criticalStockLevel: 22, dronePadReady: true, activeRequests: 2, contactNumber: '+91 800-441-9003' },
    { id: 'pharm-04', name: 'Tribal Aid Supply Depot', position: [22, 0.6, -20], villageOrTown: 'Highland Tribal', criticalStockLevel: 5, dronePadReady: true, activeRequests: 1, contactNumber: '+91 800-441-9004' },
    { id: 'pharm-05', name: 'North Corridor Cold Depot', position: [0, 0.3, -28], villageOrTown: 'North Annex', criticalStockLevel: 18, dronePadReady: true, activeRequests: 0, contactNumber: '+91 800-441-9005' },
    { id: 'pharm-06', name: 'South Riverway Dispensary', position: [-2, 0.2, 28], villageOrTown: 'South Riverway', criticalStockLevel: 12, dronePadReady: true, activeRequests: 0, contactNumber: '+91 800-441-9006' },
  ];

  // ----------------------------------------------------
  // 8. EMERGENCIES (100 High-Fidelity Incident Records)
  // ----------------------------------------------------
  const emergencies: Emergency[] = [];
  const patientNames = ['Gopal Kisku', 'Manju Devi', 'Kishan Murmu', 'Laxmi Soren', 'Bharat Mahato', 'Deepak Naik', 'Sarita Soren', 'Anil Hansda', 'Suman Besra', 'Sunil Marandi'];

  for (let i = 0; i < 100; i++) {
    const village = villages[i % villages.length];
    const conditionObj = EMERGENCY_CONDITIONS[i % EMERGENCY_CONDITIONS.length];
    const name = `${patientNames[i % patientNames.length]} (ID #${1000 + i})`;
    const status: Emergency['status'] = i < 8 ? 'DISPATCHED' : i < 16 ? 'QUEUED' : i < 24 ? 'EN_ROUTE' : 'RESOLVED';
    const slaTarget = conditionObj.severity === 'Critical' ? 25 : conditionObj.severity === 'High' ? 40 : 60;
    const eta = rng.int(10, 35);
    const slaStatus = eta > slaTarget ? 'BREACHED' : eta > slaTarget * 0.8 ? 'AT_RISK' : 'ON_TRACK';

    emergencies.push({
      id: `emg-${String(i + 1).padStart(3, '0')}`,
      patientName: name,
      patientAge: rng.int(8, 76),
      patientGender: i % 2 === 0 ? 'Female' : 'Male',
      villageId: village.id,
      villageName: village.name,
      position: village.position,
      condition: conditionObj.condition,
      severity: conditionObj.severity,
      requiredSpecialist: conditionObj.specialist,
      requiredMedicine: conditionObj.med,
      callerPhone: village.emergencyPhone,
      reportedAt: `2026-08-25T${String(12 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00Z`,
      assignedAmbulanceId: status !== 'QUEUED' ? ambulances[i % ambulances.length].id : undefined,
      targetHospitalId: village.nearestHospitalId,
      status,
      etaMinutes: eta,
      slaTargetMinutes: slaTarget,
      slaStatus,
      vitals: {
        heartRate: rng.int(65, 148),
        bloodPressure: `${rng.int(85, 160)}/${rng.int(55, 105)}`,
        spO2: rng.int(82, 99),
        respiratoryRate: rng.int(14, 34),
        gcs: conditionObj.severity === 'Critical' ? rng.int(7, 13) : 15,
        tempCelsius: Math.round(rng.range(36.4, 39.8) * 10) / 10,
      },
      notes: [
        `Distress beacon triggered from ${village.name}.`,
        `Terrain impedance factor: ${village.terrainDifficulty}.`,
        `Specialist protocol: ${conditionObj.specialist} alerted.`,
      ],
      telemedicineActive: i % 5 === 0,
      droneSupportRequested: conditionObj.severity === 'Critical' || village.roadAccessStatus !== 'clear',
    });
  }

  // ----------------------------------------------------
  // 9. SIMULATION SCENARIOS & INITIAL LOGS
  // ----------------------------------------------------
  const simulations: SimulationScenario[] = [
    {
      id: 'sim-monsoon-flood',
      title: 'Monsoon Flash Flood & Road Inundation',
      subtitle: 'Critical Lowland River Basin Cutoff',
      description: 'Severe 72-hour precipitation causes rivers to breach banks, completely blocking ground transit to 8 remote villages.',
      category: 'FLOOD',
      affectedVillages: ['vil-01', 'vil-04', 'vil-07', 'vil-11'],
      blockedRoadIds: ['road-001', 'road-003', 'road-007'],
      initialEmergencies: emergencies.slice(0, 4),
      recommendedDroneIds: ['amb-03', 'amb-07', 'amb-11'],
      riskFactorScore: 8.9,
    },
    {
      id: 'sim-landslide-pass',
      title: 'Highland Mountain Pass Mass Landslide',
      subtitle: 'Eastern Ridge Highway Total Obstruction',
      description: 'Seismic tremors and soil liquefaction trigger massive rockfalls on NH-104, isolating 6 mountain health centers.',
      category: 'LANDSLIDE',
      affectedVillages: ['vil-03', 'vil-08', 'vil-14'],
      blockedRoadIds: ['road-002', 'road-009', 'road-014'],
      initialEmergencies: emergencies.slice(4, 7),
      recommendedDroneIds: ['amb-03', 'amb-15'],
      riskFactorScore: 9.4,
    },
    {
      id: 'sim-mass-casualty',
      title: 'Highway Transport Mass Casualty Incident',
      subtitle: 'Multiple Vehicle Rollover in Valley Pass',
      description: 'Overturned passenger transport with 18 trauma injuries requiring rapid triage and multi-hospital bed orchestration.',
      category: 'MASS_CASUALTY',
      affectedVillages: ['vil-02', 'vil-05'],
      blockedRoadIds: ['road-005'],
      initialEmergencies: emergencies.slice(7, 12),
      recommendedDroneIds: ['amb-07', 'amb-19', 'amb-23'],
      riskFactorScore: 9.8,
    }
  ];

  const logs: TelemetryLog[] = [
    { id: 'log-001', timestamp: '22:36:01', level: 'WEBSOCKET', component: 'Supabase Realtime', message: 'Replication channel subscribed for emergencies & ambulance telemetry' },
    { id: 'log-002', timestamp: '22:35:48', level: 'A_STAR', component: 'Tactical Routing Engine', message: 'Graph topology evaluated: 200 nodes, 500 edges loaded in 3.4ms' },
    { id: 'log-003', timestamp: '22:35:12', level: 'AI_TRIAGE', component: 'Gemini Co-Pilot', message: 'Emergency #emg-001 triaged as High-Risk Envenomation; antivenom drone queued' },
    { id: 'log-004', timestamp: '22:34:55', level: 'INFO', component: 'Command Mesh', message: 'Apex Regional Trauma Center reporting 92% ICU bed capacity' },
  ];

  return {
    hospitals,
    villages,
    ambulances,
    doctors,
    medicines,
    roadNodes,
    roadSegments,
    pharmacies,
    emergencies,
    simulations,
    logs,
  };
}

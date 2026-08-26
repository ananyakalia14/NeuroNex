/* ── Seed Utility — Realistic Dombivli / Kalyan / Thane / MMR Emergency Graph Generator ──
   Real coordinates, real hospitals in Dombivli, Kalyan, Thane, Ambernath, Ulhasnagar, and rural fringes
*/

import { db } from './schema';
import type { GraphNode, GraphEdge, Hospital, Ambulance } from './schema';

import { MUMBAI_MMR_HOSPITALS } from '../data/mumbaiHospitals';

// ── Configuration ──
const CONFIG = {
  nodeCount: 50000,
  chunkSize: 2000,
  // Bounding box covering Mumbai City, Suburbs, Thane, Navi Mumbai, Kalyan & Dombivli:
  bounds: {
    minLat: 18.88,
    maxLat: 19.38,
    minLng: 72.75,
    maxLng: 73.40,
  },
};


const LOCALITY_NAMES = [
  'Dombivli East (Manpada)', 'Dombivli East (Phadke Rd)', 'Dombivli East (Gharda Circle)',
  'Dombivli West (Shastri Nagar)', 'Dombivli West (Din Dayal Rd)', 'Dombivli West (Old Dombivli)',
  'Thakurli (90 Feet Rd)', 'Kopar East', 'Kopar West', 'Nilje Station Area',
  'Lodha Palava Phase 1', 'Lodha Palava Phase 2', 'Kolegaon Village', 'Usarghar Gaon',
  'Sagaon MIDC', 'Bhadreshwar Temple Area', 'Pendharkar College Chowk', 'Regency Estate',
  'Kalyan West (Shivaji Chowk)', 'Kalyan West (Syndicate)', 'Kalyan East (Katemanivali)',
  'Kalyan East (Tisgaon)', 'Mohone (Kalyan)', 'Titwala Ganpati Mandir Road',
  'Khadavli Rural Post', 'Shahad Station Area', 'Ulhasnagar Camp 3', 'Ulhasnagar Camp 4',
  'Ambernath West (MIDC)', 'Ambernath East (Shiv Mandir)', 'Badlapur East (Gandhi Chowk)',
  'Badlapur West (Rameshwar)', 'Kulgaon Rural Post', 'Murbad Rural Highway',
  'Shilphata Junction', 'Katai Naka (Kalyan-Shil Rd)', 'Diva Junction East',
  'Kalwa Naka', 'Thane West (Panchpakhadi)', 'Thane West (Ghodbunder Rd)',
  'Airoli Knowledge Park', 'Ghansoli Coastal Area',
];

const MEDICINES = [

  'paracetamol', 'amoxicillin', 'metformin', 'amlodipine',
  'omeprazole', 'azithromycin', 'ibuprofen', 'cetirizine',
  'salbutamol', 'insulin', 'atorvastatin', 'aspirin',
  'diclofenac', 'ranitidine', 'ciprofloxacin', 'dexamethasone',
  'morphine', 'epinephrine', 'atropine', 'diazepam',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export async function seedDatabase(
  onProgress?: (phase: string, progress: number) => void
): Promise<void> {
  const rand = seededRandom(42);

  // Clear existing data for fresh realistic seed
  await db.nodes.clear();
  await db.edges.clear();
  await db.hospitals.clear();
  await db.ambulances.clear();
  await db.dispatches.clear();

  onProgress?.('Generating Dombivli / MMR Graph Nodes...', 15);

  const nodes: GraphNode[] = [];
  const { minLat, maxLat, minLng, maxLng } = CONFIG.bounds;

  // 1. Create Real Mumbai & MMR Hospitals First
  for (let i = 0; i < MUMBAI_MMR_HOSPITALS.length; i++) {
    const hosp = MUMBAI_MMR_HOSPITALS[i];
    const id = i;
    nodes.push({
      id,
      lat: hosp.lat,
      lng: hosp.lng,
      name: `${hosp.name} (${hosp.location})`,
      type: 'hospital',
    });
  }

  // 2. Create Dombivli / Kalyan / Mumbai Named Localities
  for (let i = 0; i < LOCALITY_NAMES.length; i++) {
    const id = MUMBAI_MMR_HOSPITALS.length + i;
    const latOffset = (rand() - 0.5) * 0.14;
    const lngOffset = (rand() - 0.5) * 0.20;
    nodes.push({
      id,
      lat: 19.2183 + latOffset,
      lng: 73.0867 + lngOffset,
      name: LOCALITY_NAMES[i],
      type: 'village',
    });
  }


  // 3. Populate Remaining Nodes for 50,000+ Graph Density
  const remainingStart = nodes.length;
  for (let i = remainingStart; i < CONFIG.nodeCount; i++) {
    const lat = minLat + rand() * (maxLat - minLat);
    const lng = minLng + rand() * (maxLng - minLng);
    nodes.push({
      id: i,
      lat,
      lng,
      type: 'junction',
    });
  }

  // Chunked bulk put for nodes
  onProgress?.('Saving 50,000+ Road Nodes to IndexedDB...', 40);
  for (let i = 0; i < nodes.length; i += CONFIG.chunkSize) {
    const chunk = nodes.slice(i, i + CONFIG.chunkSize);
    await db.nodes.bulkPut(chunk);
    const pct = 40 + Math.floor((i / nodes.length) * 20);
    onProgress?.(`Saved ${Math.min(i + CONFIG.chunkSize, nodes.length)} / ${nodes.length} nodes...`, pct);
  }

  // 4. Generate Road Edges
  onProgress?.('Building High-Speed Road Network...', 65);
  const edges: GraphEdge[] = [];
  let edgeId = 0;
  const kNeighbors = 4;

  const gridSize = 100;
  const grid: Map<string, number[]> = new Map();

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const gx = Math.floor(((n.lng - minLng) / (maxLng - minLng)) * gridSize);
    const gy = Math.floor(((n.lat - minLat) / (maxLat - minLat)) * gridSize);
    const key = `${gx},${gy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(i);
  }

  const connectedPairs = new Set<string>();

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const gx = Math.floor(((n.lng - minLng) / (maxLng - minLng)) * gridSize);
    const gy = Math.floor(((n.lat - minLat) / (maxLat - minLat)) * gridSize);

    const candidates: number[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gx + dx},${gy + dy}`;
        const cell = grid.get(key);
        if (cell) {
          for (const idx of cell) {
            if (idx !== i) candidates.push(idx);
          }
        }
      }
    }

    candidates.sort((a, b) => {
      const na = nodes[a];
      const nb = nodes[b];
      const da = (na.lat - n.lat) ** 2 + (na.lng - n.lng) ** 2;
      const db = (nb.lat - n.lat) ** 2 + (nb.lng - n.lng) ** 2;
      return da - db;
    });

    const chosen = candidates.slice(0, kNeighbors);
    for (const targetIdx of chosen) {
      const target = nodes[targetIdx];
      const pairKey = i < targetIdx ? `${i}-${targetIdx}` : `${targetIdx}-${i}`;
      if (connectedPairs.has(pairKey)) continue;
      connectedPairs.add(pairKey);

      const dlat = (target.lat - n.lat) * 111;
      const dlng = (target.lng - n.lng) * 111 * Math.cos((n.lat * Math.PI) / 180);
      const distance = Math.sqrt(dlat * dlat + dlng * dlng);

      const r = rand();
      const roadType = r < 0.3 ? 'highway' : r < 0.7 ? 'district' : 'village';
      const speed = roadType === 'highway' ? 65 : roadType === 'district' ? 45 : 25;
      const weight = (distance / speed) * 60; // travel time in minutes

      edges.push({
        id: edgeId++,
        u: n.id,
        v: target.id,
        distance,
        roadType,
        blocked: false,
        weight,
      });
    }
  }

  // Chunked bulk put for edges
  onProgress?.('Saving 200,000+ Road Edges...', 80);
  for (let i = 0; i < edges.length; i += CONFIG.chunkSize * 2) {
    const chunk = edges.slice(i, i + CONFIG.chunkSize * 2);
    await db.edges.bulkPut(chunk);
    const pct = 80 + Math.floor((i / edges.length) * 12);
    onProgress?.(`Saved ${Math.min(i + CONFIG.chunkSize * 2, edges.length)} edges...`, pct);
  }

  // 5. Generate Real Mumbai & MMR Hospital Records
  onProgress?.('Configuring Mumbai & MMR Emergency Hospitals...', 93);
  const hospitals: Hospital[] = [];

  for (let i = 0; i < MUMBAI_MMR_HOSPITALS.length; i++) {
    const hospData = MUMBAI_MMR_HOSPITALS[i];
    const medStock: Record<string, number> = {};
    for (const m of MEDICINES) {
      medStock[m] = Math.floor(rand() * 100) + 15;
    }

    hospitals.push({
      id: hospData.id,
      nodeId: hospData.id,
      name: `${hospData.name} (${hospData.location})`,
      tier: hospData.tier,
      specialties: hospData.specialties,
      bedsAvailable: hospData.bedsAvailable,
      bedsTotal: hospData.bedsTotal,
      medicineStock: medStock,
    });
  }

  await db.hospitals.bulkPut(hospitals);

  // 6. Generate Ambulance Fleet
  onProgress?.('Stationing Ambulance Fleet across Mumbai...', 97);
  const ambulances: Ambulance[] = [];
  const ambulanceCount = Math.max(30, hospitals.length);
  for (let i = 0; i < ambulanceCount; i++) {
    const assignedHospitalId = i % hospitals.length;
    const hosp = hospitals[assignedHospitalId];
    ambulances.push({
      id: i,
      status: 'IDLE',
      currentNodeId: hosp.nodeId,
      vehicleType: i < 12 ? 'ALS' : 'BLS',
    });
  }

  await db.ambulances.bulkPut(ambulances);

  onProgress?.('Mumbai Metropolitan Emergency Network Ready!', 100);
}


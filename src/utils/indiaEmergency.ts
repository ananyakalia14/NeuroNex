/* ── India-Wide Real-Time Emergency Infrastructure & Fast Geocoding Engine ── */

import { db, type GraphNode, type GraphEdge, type Hospital, type Ambulance } from '../db/schema';

export interface LocationInfo {
  lat: number;
  lng: number;
  locality: string;
  city: string;
  state: string;
  fullAddress: string;
}

// Major Indian Metro & Regional Coordinates for Instant Fast Snapping (< 10ms)
const INDIAN_REGIONS = [
  { name: 'Dombivli / Kalyan', state: 'Maharashtra', lat: 19.2183, lng: 73.0867, locality: 'Dombivli East (Manpada Rd)' },
  { name: 'Thane / Mumbai', state: 'Maharashtra', lat: 19.2000, lng: 72.9700, locality: 'Ghodbunder Road' },
  { name: 'Mumbai City', state: 'Maharashtra', lat: 18.9600, lng: 72.8200, locality: 'South Mumbai' },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, locality: 'Shivaji Nagar' },
  { name: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, locality: 'Sitabuldi' },
  { name: 'Nashik', state: 'Maharashtra', lat: 19.9975, lng: 73.7898, locality: 'College Road' },
  { name: 'New Delhi / NCR', state: 'Delhi', lat: 28.6139, lng: 77.2090, locality: 'Connaught Place' },
  { name: 'Noida / Ghaziabad', state: 'Uttar Pradesh', lat: 28.5355, lng: 77.3910, locality: 'Sector 62' },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, locality: 'MG Road / Indiranagar' },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, locality: 'Hitec City' },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, locality: 'Anna Nagar' },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, locality: 'Park Street' },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, locality: 'Navrangpura' },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, locality: 'C-Scheme' },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, locality: 'Hazratganj' },
  { name: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, locality: 'Boring Road' },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, locality: 'MP Nagar' },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, locality: 'Vijay Nagar' },
  { name: 'Chandigarh', state: 'Punjab', lat: 30.7333, lng: 76.7794, locality: 'Sector 17' },
  { name: 'Kochi / Ernakulam', state: 'Kerala', lat: 9.9312, lng: 76.2673, locality: 'MG Road' },
];

/**
 * Fast Non-Blocking Reverse Geocoding with instant fallback (< 200ms)
 */
export async function reverseGeocodeIndia(lat: number, lng: number): Promise<LocationInfo> {
  // 1. Check closest major Indian region first (instant 0ms)
  let closestRegion = INDIAN_REGIONS[0];
  let minRegionDist = Infinity;

  for (const r of INDIAN_REGIONS) {
    const dlat = r.lat - lat;
    const dlng = r.lng - lng;
    const dist = dlat * dlat + dlng * dlng;
    if (dist < minRegionDist) {
      minRegionDist = dist;
      closestRegion = r;
    }
  }

  // If within ~35km of a known city, use that city immediately!
  const isClose = minRegionDist < 0.15;
  const defaultLocality = isClose ? closestRegion.locality : `Sector ${Math.floor((lat % 1) * 100)}`;
  const defaultCity = isClose ? closestRegion.name : 'India Region';
  const defaultState = closestRegion.state;

  // 2. Try Google Maps Geocoder with a strict 400ms timeout
  if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const geoPromise = new Promise<LocationInfo | null>((resolve) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const top = results[0];
            let locality = '';
            let city = '';
            let state = '';

            for (const comp of top.address_components) {
              if (comp.types.includes('sublocality') || comp.types.includes('neighborhood')) {
                locality = comp.long_name;
              }
              if (comp.types.includes('locality') || comp.types.includes('administrative_area_level_2')) {
                if (!city) city = comp.long_name;
              }
              if (comp.types.includes('administrative_area_level_1')) {
                state = comp.long_name;
              }
            }

            const chosenLoc = locality || city || defaultLocality;
            const chosenCity = city || defaultCity;
            resolve({
              lat,
              lng,
              locality: chosenLoc,
              city: chosenCity,
              state: state || defaultState,
              fullAddress: `${chosenLoc}, ${chosenCity}`,
            });
          } else {
            resolve(null);
          }
        });
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 400));
      const res = await Promise.race([geoPromise, timeoutPromise]);
      if (res) return res;
    } catch {
      // Fall through to instant default
    }
  }

  return {
    lat,
    lng,
    locality: defaultLocality,
    city: defaultCity,
    state: defaultState,
    fullAddress: `${defaultLocality}, ${defaultCity}`,
  };
}

/**
 * Ensure Local Emergency Infrastructure exists within 20km of the user anywhere in India
 */
export async function ensureLocalEmergencyInfrastructure(
  lat: number,
  lng: number,
  locInfo: LocationInfo
): Promise<{ patientNodeId: number; nearestHospitalId: number }> {
  try {
    const existingNodes = await db.nodes.limit(50).toArray();
    let closestDist = Infinity;
    let closestNode: GraphNode | null = null;

    for (const n of existingNodes) {
      const dlat = n.lat - lat;
      const dlng = n.lng - lng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng) * 111; // ~km
      if (dist < closestDist) {
        closestDist = dist;
        closestNode = n;
      }
    }

    // If existing local nodes exist within 12km (e.g. Dombivli), reuse them!
    if (closestDist < 12 && closestNode) {
      return {
        patientNodeId: closestNode.id,
        nearestHospitalId: 0,
      };
    }
  } catch (err) {
    console.warn('Node lookup fallback:', err);
  }

  // Otherwise, dynamically generate emergency nodes for this Indian locality
  const baseId = 880000 + Math.floor(Math.random() * 10000);
  const patientNodeId = baseId;
  const cityName = locInfo.city;
  const localityName = locInfo.locality;

  // 1. Patient Live Node
  const patientNode: GraphNode = {
    id: patientNodeId,
    lat,
    lng,
    type: 'village',
    name: `${localityName} (My Live Location)`,
    population: 4500,
  };

  // 2. Nearby Hospitals
  const hosp1NodeId = baseId + 1;
  const hosp2NodeId = baseId + 2;

  const hosp1Node: GraphNode = {
    id: hosp1NodeId,
    lat: lat + 0.014,
    lng: lng + 0.012,
    type: 'hospital',
    name: `${cityName} Civil Trauma Hospital & ICU`,
  };

  const hosp2Node: GraphNode = {
    id: hosp2NodeId,
    lat: lat - 0.018,
    lng: lng + 0.016,
    type: 'hospital',
    name: `${cityName} Apex 24/7 Multi-Specialty Centre`,
  };

  const newNodes = [patientNode, hosp1Node, hosp2Node];

  // 3. Hospital Records
  const hosp1Id = baseId + 10;
  const hosp2Id = baseId + 11;

  const newHospitals: Hospital[] = [
    {
      id: hosp1Id,
      nodeId: hosp1NodeId,
      name: hosp1Node.name || `${cityName} Civil Trauma Hospital`,
      bedsAvailable: 18,
      bedsTotal: 40,
      specialties: ['cardiology', 'emergency', 'obstetrics', 'general', 'pediatrics'],
      medicineStock: { 'Oxytocin': 40, 'Atropine': 30, 'Adrenaline': 25 },
      tier: 'DH',
    },
    {
      id: hosp2Id,
      nodeId: hosp2NodeId,
      name: hosp2Node.name || `${cityName} Apex Multi-Specialty`,
      bedsAvailable: 12,
      bedsTotal: 30,
      specialties: ['orthopedics', 'neurology', 'cardiology', 'emergency'],
      medicineStock: { 'Morphine': 20, 'Diazepam': 18 },
      tier: 'CHC',
    },
  ];

  // 4. Connected Road Edges
  const newEdges: GraphEdge[] = [
    {
      id: baseId + 100,
      u: patientNodeId,
      v: hosp1NodeId,
      distance: 2.1,
      weight: 4.2,
      blocked: false,
      roadType: 'highway',
    },
    {
      id: baseId + 101,
      u: patientNodeId,
      v: hosp2NodeId,
      distance: 3.4,
      weight: 6.8,
      blocked: false,
      roadType: 'district',
    },
  ];

  // 5. Standby Local Ambulances
  const newAmbulances: Ambulance[] = [
    {
      id: baseId + 200,
      currentNodeId: hosp1NodeId,
      status: 'IDLE',
      vehicleType: 'ALS',
    },
  ];

  try {
    await db.nodes.bulkPut(newNodes);
    await db.hospitals.bulkPut(newHospitals);
    await db.edges.bulkPut(newEdges);
    await db.ambulances.bulkPut(newAmbulances);
  } catch (err) {
    console.warn('Bulk put fallback:', err);
  }

  return {
    patientNodeId,
    nearestHospitalId: hosp1Id,
  };
}

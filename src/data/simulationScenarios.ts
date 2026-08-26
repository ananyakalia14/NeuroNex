export interface SimulationScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  riskFactorScore: number;
  blockedRoadNames: string[];
  initialCasualties: number;
  recommendedUnits: string[];
}

export const INITIAL_SIMULATIONS: SimulationScenario[] = [
  {
    id: 'sim-01',
    title: 'Monsoon Flash Flood & Ulhas River Highway Inundation',
    category: 'Extreme Weather Crisis',
    description: 'Heavy torrential downpour floods the low-lying Kalyan-Shilphata bridge corridor. Water levels exceed transit limits, requiring dynamic A* rerouting of 3 ALS units via the higher Dombivli Ring Road bypass.',
    riskFactorScore: 88,
    blockedRoadNames: ['Kalyan-Shilphata Lowland Causeway', 'Kalu River Embankment Rd'],
    initialCasualties: 4,
    recommendedUnits: ['4X4-RESCUE-02', 'ALS-UNIT-01', 'ALS-UNIT-03'],
  },
  {
    id: 'sim-02',
    title: 'Sudden Landslide & Rockfall on Parsik Hill Feeder Road',
    category: 'Geotechnical Crisis',
    description: 'A major rockfall severs the primary arterial transit road connecting hill settlements to trauma centers. The emergency dispatch pipeline must instantly reject the blocked pass and calculate real-time bypass.',
    riskFactorScore: 94,
    blockedRoadNames: ['Parsik Hill Pass (Sec 04)', 'Mumbra-Shilphata Ridge Link'],
    initialCasualties: 2,
    recommendedUnits: ['ALS-UNIT-03', '4X4-RESCUE-02'],
  },
  {
    id: 'sim-03',
    title: 'Multi-Vehicle Highway Pileup on Eastern Express / NH-48',
    category: 'Trauma & Mass Casualty',
    description: 'High-speed collision involving a heavy container trailer and state transit bus. 6 critical patients require multi-facility hospital load balancing across Dombivli, Kalyan, and Thane centers.',
    riskFactorScore: 92,
    blockedRoadNames: ['NH-48 / Kalyan Southbound Express Corridor'],
    initialCasualties: 6,
    recommendedUnits: ['ALS-UNIT-01', 'ALS-UNIT-05', 'BLS-UNIT-04'],
  },
  {
    id: 'sim-04',
    title: 'MIDC Phase-2 Industrial Vapor Leak Surge',
    category: 'Toxicological Emergency',
    description: 'Industrial storage tank valve failure during night shift causes toxic vapor dispersion. Tests triage routing to hospitals equipped with intensive Pulmonologists and Antidote stockpiles.',
    riskFactorScore: 85,
    blockedRoadNames: ['MIDC Phase-2 Central Cross Road'],
    initialCasualties: 5,
    recommendedUnits: ['BLS-UNIT-04', 'ALS-UNIT-01', 'BLS-UNIT-06'],
  },
];

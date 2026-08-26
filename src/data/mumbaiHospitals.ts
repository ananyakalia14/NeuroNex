import type { Specialty } from '../db/schema';

export interface MumbaiHospitalData {
  id: number;
  datasetId: string;
  name: string;
  location: string;
  administrativeArea: string;
  ownership: string;
  lat: number;
  lng: number;
  tier: 'PHC' | 'CHC' | 'DH';
  bedsTotal: number;
  bedsAvailable: number;
  specialties: Specialty[];
  medicineStock?: Record<string, number>;
}

export const MUMBAI_MMR_HOSPITALS: MumbaiHospitalData[] = [
  {
    "id": 0,
    "datasetId": "HUB1",
    "name": "AIMS Hospital & ICU",
    "location": "MIDC Phase-1, Dombivli East",
    "administrativeArea": "Thane District / KDMC",
    "ownership": "Private / Apex",
    "lat": 19.2125,
    "lng": 73.0933,
    "tier": "DH",
    "bedsTotal": 180,
    "bedsAvailable": 14,
    "specialties": [
      "cardiology",
      "emergency",
      "orthopedics",
      "neurology"
    ]
  },
  {
    "id": 1,
    "datasetId": "HUB2",
    "name": "Shastri Nagar Civic Hospital",
    "location": "Kopar Gaon Road, Shastri Nagar, Dombivli West",
    "administrativeArea": "Thane District / KDMC",
    "ownership": "KDMC",
    "lat": 19.2195,
    "lng": 73.0782,
    "tier": "CHC",
    "bedsTotal": 120,
    "bedsAvailable": 15,
    "specialties": [
      "emergency",
      "obstetrics",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 2,
    "datasetId": "HUB3",
    "name": "RR Multi-Specialty Hospital",
    "location": "Manpada Road, Dombivli East",
    "administrativeArea": "Thane District",
    "ownership": "Private",
    "lat": 19.215,
    "lng": 73.089,
    "tier": "DH",
    "bedsTotal": 110,
    "bedsAvailable": 12,
    "specialties": [
      "cardiology",
      "neurology",
      "orthopedics"
    ]
  },
  {
    "id": 3,
    "datasetId": "HUB4",
    "name": "Icon Hospital & Trauma Center",
    "location": "Manpada Road, Dombivli East",
    "administrativeArea": "Thane District",
    "ownership": "Private",
    "lat": 19.222,
    "lng": 73.091,
    "tier": "DH",
    "bedsTotal": 100,
    "bedsAvailable": 9,
    "specialties": [
      "emergency",
      "orthopedics",
      "obstetrics",
      "pediatrics"
    ]
  },
  {
    "id": 4,
    "datasetId": "HUB5",
    "name": "Fortis Super-Specialty Hospital",
    "location": "Shill-Kalyan Highway, Kalyan West",
    "administrativeArea": "Thane District",
    "ownership": "Private",
    "lat": 19.2312,
    "lng": 73.1498,
    "tier": "DH",
    "bedsTotal": 250,
    "bedsAvailable": 24,
    "specialties": [
      "cardiology",
      "neurology",
      "orthopedics",
      "emergency",
      "obstetrics"
    ]
  },
  {
    "id": 5,
    "datasetId": "MC001",
    "name": "G. T. Hospital",
    "location": "Fort, Mumbai",
    "administrativeArea": "Mumbai City",
    "ownership": "State Government",
    "lat": 18.9438,
    "lng": 72.8335,
    "tier": "DH",
    "bedsTotal": 500,
    "bedsAvailable": 42,
    "specialties": [
      "emergency",
      "general",
      "orthopedics",
      "cardiology"
    ]
  },
  {
    "id": 6,
    "datasetId": "MC002",
    "name": "J J Hospital",
    "location": "Nagpada–Mumbai Central, Mumbai",
    "administrativeArea": "Mumbai City",
    "ownership": "State Government",
    "lat": 18.9616,
    "lng": 72.8337,
    "tier": "DH",
    "bedsTotal": 1350,
    "bedsAvailable": 88,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics",
      "obstetrics",
      "pediatrics"
    ]
  },
  {
    "id": 7,
    "datasetId": "MC003",
    "name": "K E M Hospital",
    "location": "Parel, Mumbai",
    "administrativeArea": "Mumbai City",
    "ownership": "Municipal",
    "lat": 19.0028,
    "lng": 72.8427,
    "tier": "DH",
    "bedsTotal": 1800,
    "bedsAvailable": 112,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics",
      "pediatrics",
      "ophthalmology"
    ]
  },
  {
    "id": 8,
    "datasetId": "MC004",
    "name": "Municipal Hospital",
    "location": "MS Ali Road, Chor Bazaar, Kamathipura, Mumbai",
    "administrativeArea": "Mumbai City",
    "ownership": "Municipal",
    "lat": 18.965,
    "lng": 72.825,
    "tier": "CHC",
    "bedsTotal": 120,
    "bedsAvailable": 18,
    "specialties": [
      "emergency",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 9,
    "datasetId": "MC005",
    "name": "Saifee Hospital",
    "location": "Opera House, Girgaon, Mumbai",
    "administrativeArea": "Mumbai City",
    "ownership": "Private",
    "lat": 18.9554,
    "lng": 72.8188,
    "tier": "DH",
    "bedsTotal": 250,
    "bedsAvailable": 24,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics",
      "neurology"
    ]
  },
  {
    "id": 10,
    "datasetId": "MC006",
    "name": "St George Hospital",
    "location": "Fort, Mumbai",
    "administrativeArea": "Mumbai City",
    "ownership": "State Government",
    "lat": 18.9398,
    "lng": 72.8378,
    "tier": "DH",
    "bedsTotal": 460,
    "bedsAvailable": 35,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 11,
    "datasetId": "MS001",
    "name": "Bhabha Hospital",
    "location": "Bandra West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.0552,
    "lng": 72.834,
    "tier": "DH",
    "bedsTotal": 430,
    "bedsAvailable": 31,
    "specialties": [
      "emergency",
      "orthopedics",
      "obstetrics",
      "cardiology"
    ]
  },
  {
    "id": 12,
    "datasetId": "MS002",
    "name": "Centenary Municipal General Hospital",
    "location": "Kandivali West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.2064,
    "lng": 72.8436,
    "tier": "DH",
    "bedsTotal": 350,
    "bedsAvailable": 28,
    "specialties": [
      "emergency",
      "general",
      "pediatrics",
      "orthopedics"
    ]
  },
  {
    "id": 13,
    "datasetId": "MS003",
    "name": "Dr. R. N. Cooper Medical College and General Hospital",
    "location": "Juhu, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.1082,
    "lng": 72.8368,
    "tier": "DH",
    "bedsTotal": 650,
    "bedsAvailable": 52,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics",
      "obstetrics"
    ]
  },
  {
    "id": 14,
    "datasetId": "MS004",
    "name": "Lilavati Hospital and Research Centre",
    "location": "Bandra Reclamation, Bandra West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private",
    "lat": 19.0515,
    "lng": 72.8286,
    "tier": "DH",
    "bedsTotal": 300,
    "bedsAvailable": 22,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics"
    ]
  },
  {
    "id": 15,
    "datasetId": "MS005",
    "name": "Rajawadi Hospital",
    "location": "Ghatkopar East, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.0792,
    "lng": 72.908,
    "tier": "DH",
    "bedsTotal": 550,
    "bedsAvailable": 44,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics",
      "pediatrics",
      "obstetrics"
    ]
  },
  {
    "id": 16,
    "datasetId": "MS006",
    "name": "S V D Savarkar Municipal General Hospital",
    "location": "Mulund East, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.1724,
    "lng": 72.9612,
    "tier": "CHC",
    "bedsTotal": 180,
    "bedsAvailable": 19,
    "specialties": [
      "emergency",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 17,
    "datasetId": "MS007",
    "name": "V. N. Desai Municipal General Hospital",
    "location": "Santacruz East, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.0838,
    "lng": 72.848,
    "tier": "DH",
    "bedsTotal": 300,
    "bedsAvailable": 26,
    "specialties": [
      "emergency",
      "obstetrics",
      "orthopedics",
      "general"
    ]
  },
  {
    "id": 18,
    "datasetId": "TH001",
    "name": "Central Hospital Ulhasnagar",
    "location": "Press Bazar, Ulhasnagar",
    "administrativeArea": "Thane District",
    "ownership": "Government",
    "lat": 19.2215,
    "lng": 73.153,
    "tier": "DH",
    "bedsTotal": 250,
    "bedsAvailable": 22,
    "specialties": [
      "emergency",
      "general",
      "orthopedics",
      "pediatrics"
    ]
  },
  {
    "id": 19,
    "datasetId": "TH002",
    "name": "Chhatrapati Shivaji Maharaj Hospital, Kalwa",
    "location": "Thane–Belapur Road, Kalwa, Thane",
    "administrativeArea": "Thane District",
    "ownership": "Municipal / TMC",
    "lat": 19.1982,
    "lng": 72.9984,
    "tier": "DH",
    "bedsTotal": 500,
    "bedsAvailable": 48,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics",
      "obstetrics"
    ]
  },
  {
    "id": 20,
    "datasetId": "TH003",
    "name": "Civil Hospital Thane",
    "location": "Tembhi Naka, Thane West",
    "administrativeArea": "Thane District",
    "ownership": "Government",
    "lat": 19.189,
    "lng": 72.9754,
    "tier": "DH",
    "bedsTotal": 400,
    "bedsAvailable": 36,
    "specialties": [
      "emergency",
      "general",
      "orthopedics",
      "pediatrics"
    ]
  },
  {
    "id": 21,
    "datasetId": "TH004",
    "name": "Government Hospital Mira Bhayandar",
    "location": "Mira Bhayandar, Thane District",
    "administrativeArea": "Thane District",
    "ownership": "Government",
    "lat": 19.294,
    "lng": 72.855,
    "tier": "CHC",
    "bedsTotal": 200,
    "bedsAvailable": 18,
    "specialties": [
      "emergency",
      "obstetrics",
      "general"
    ]
  },
  {
    "id": 22,
    "datasetId": "TH005",
    "name": "Indira Gandhi Hospital Bhiwandi",
    "location": "Near Bhiwandi Court, Agra Road, Bhiwandi",
    "administrativeArea": "Thane District",
    "ownership": "Government / Municipal",
    "lat": 19.298,
    "lng": 73.061,
    "tier": "DH",
    "bedsTotal": 220,
    "bedsAvailable": 20,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 23,
    "datasetId": "TH006",
    "name": "KDMC Hospital, Dombivli",
    "location": "Kopar Gaon Road, Shastri Nagar, Dombivli West",
    "administrativeArea": "Thane District",
    "ownership": "KDMC",
    "lat": 19.076,
    "lng": 72.8777,
    "tier": "DH",
    "bedsTotal": 200,
    "bedsAvailable": 20,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 24,
    "datasetId": "TH007",
    "name": "NMMC Hospital Vashi Navi Mumbai",
    "location": "Sector 10A, Vashi, Navi Mumbai",
    "administrativeArea": "Navi Mumbai / Thane District",
    "ownership": "NMMC",
    "lat": 19.076,
    "lng": 73.003,
    "tier": "DH",
    "bedsTotal": 400,
    "bedsAvailable": 34,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics",
      "pediatrics"
    ]
  },
  {
    "id": 25,
    "datasetId": "TH008",
    "name": "Rukmini Hospital Kalyan",
    "location": "Mahatma Phule Chowk, Murbad Road, Kalyan",
    "administrativeArea": "Thane District",
    "ownership": "Private",
    "lat": 19.2437,
    "lng": 73.1302,
    "tier": "CHC",
    "bedsTotal": 150,
    "bedsAvailable": 14,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 26,
    "datasetId": "NM001",
    "name": "MGM Hospital",
    "location": "Belapur, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "Private",
    "lat": 19.018,
    "lng": 73.042,
    "tier": "DH",
    "bedsTotal": 350,
    "bedsAvailable": 28,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics"
    ]
  },
  {
    "id": 27,
    "datasetId": "NM003",
    "name": "Sterling Hospital",
    "location": "Vashi, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "Private",
    "lat": 19.074,
    "lng": 73.007,
    "tier": "DH",
    "bedsTotal": 150,
    "bedsAvailable": 14,
    "specialties": [
      "emergency",
      "orthopedics",
      "cardiology"
    ]
  },
  {
    "id": 28,
    "datasetId": "NM004",
    "name": "Jijamata Hospital",
    "location": "Vashi, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "Private",
    "lat": 19.072,
    "lng": 72.995,
    "tier": "CHC",
    "bedsTotal": 100,
    "bedsAvailable": 12,
    "specialties": [
      "emergency",
      "pediatrics",
      "obstetrics"
    ]
  },
  {
    "id": 29,
    "datasetId": "NM005",
    "name": "Dr. Mahajan Hospital",
    "location": "Rabale, TBIA, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "Private",
    "lat": 19.135,
    "lng": 73.008,
    "tier": "CHC",
    "bedsTotal": 80,
    "bedsAvailable": 9,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 30,
    "datasetId": "NM006",
    "name": "Shri Sadguru Seva Mandal Hospital",
    "location": "Thane–Belapur Road, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "Private",
    "lat": 19.112,
    "lng": 73.001,
    "tier": "PHC",
    "bedsTotal": 60,
    "bedsAvailable": 8,
    "specialties": [
      "emergency",
      "general"
    ]
  },
  {
    "id": 31,
    "datasetId": "NM008",
    "name": "NMMC General Hospital - Vashi",
    "location": "Vashi, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "NMMC",
    "lat": 19.076,
    "lng": 73.003,
    "tier": "DH",
    "bedsTotal": 400,
    "bedsAvailable": 32,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics"
    ]
  },
  {
    "id": 32,
    "datasetId": "NM009",
    "name": "NMMC General Hospital - Nerul",
    "location": "Nerul, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "NMMC",
    "lat": 19.033,
    "lng": 73.018,
    "tier": "DH",
    "bedsTotal": 300,
    "bedsAvailable": 26,
    "specialties": [
      "emergency",
      "pediatrics",
      "orthopedics"
    ]
  },
  {
    "id": 33,
    "datasetId": "NM010",
    "name": "NMMC General Hospital - Airoli",
    "location": "Airoli, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "NMMC",
    "lat": 19.158,
    "lng": 72.998,
    "tier": "CHC",
    "bedsTotal": 150,
    "bedsAvailable": 16,
    "specialties": [
      "emergency",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 34,
    "datasetId": "NM011",
    "name": "ESIS Hospital",
    "location": "Vashi, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "Government / ESIC",
    "lat": 19.065,
    "lng": 73.001,
    "tier": "DH",
    "bedsTotal": 250,
    "bedsAvailable": 20,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 35,
    "datasetId": "NM012",
    "name": "MCH - Turbhe",
    "location": "Turbhe, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "NMMC MCH",
    "lat": 19.06,
    "lng": 73.02,
    "tier": "PHC",
    "bedsTotal": 50,
    "bedsAvailable": 6,
    "specialties": [
      "obstetrics",
      "pediatrics",
      "general"
    ]
  },
  {
    "id": 36,
    "datasetId": "NM013",
    "name": "MCH - Koparkhairane",
    "location": "Koparkhairane, Navi Mumbai",
    "administrativeArea": "Navi Mumbai",
    "ownership": "NMMC MCH",
    "lat": 19.098,
    "lng": 73.012,
    "tier": "PHC",
    "bedsTotal": 50,
    "bedsAvailable": 7,
    "specialties": [
      "obstetrics",
      "pediatrics",
      "general"
    ]
  },
  {
    "id": 37,
    "datasetId": "CSV_8",
    "name": "Bhagwati Hospital",
    "location": "Borivali West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.231,
    "lng": 72.855,
    "tier": "DH",
    "bedsTotal": 400,
    "bedsAvailable": 48,
    "specialties": [
      "emergency",
      "general",
      "orthopedics",
      "pediatrics"
    ]
  },
  {
    "id": 38,
    "datasetId": "CSV_9",
    "name": "Dr. Babasaheb Ambedkar Municipal General Hospital",
    "location": "Kandivali, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "BMC",
    "lat": 19.206,
    "lng": 72.852,
    "tier": "DH",
    "bedsTotal": 320,
    "bedsAvailable": 38,
    "specialties": [
      "emergency",
      "general",
      "obstetrics"
    ]
  },
  {
    "id": 39,
    "datasetId": "CSV_10",
    "name": "BSES MG Hospital",
    "location": "Andheri, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.121,
    "lng": 72.846,
    "tier": "DH",
    "bedsTotal": 120,
    "bedsAvailable": 14,
    "specialties": [
      "emergency",
      "cardiology",
      "ophthalmology"
    ]
  },
  {
    "id": 40,
    "datasetId": "CSV_11",
    "name": "Godrej Memorial Hospital",
    "location": "Vikhroli/Mulund area, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.102,
    "lng": 72.932,
    "tier": "DH",
    "bedsTotal": 260,
    "bedsAvailable": 31,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics"
    ]
  },
  {
    "id": 41,
    "datasetId": "CSV_12",
    "name": "H. J. Doshi Ghatkopar Hindu Sabha Hospital",
    "location": "Ghatkopar, Mumbai 400086",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.088,
    "lng": 72.911,
    "tier": "DH",
    "bedsTotal": 180,
    "bedsAvailable": 22,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  },
  {
    "id": 42,
    "datasetId": "CSV_13",
    "name": "Mallika Hospital",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.141,
    "lng": 72.845,
    "tier": "CHC",
    "bedsTotal": 80,
    "bedsAvailable": 10,
    "specialties": [
      "emergency",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 43,
    "datasetId": "CSV_14",
    "name": "Millat Dialysis Center",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.143,
    "lng": 72.839,
    "tier": "PHC",
    "bedsTotal": 40,
    "bedsAvailable": 5,
    "specialties": [
      "general",
      "emergency"
    ]
  },
  {
    "id": 44,
    "datasetId": "CSV_15",
    "name": "Parakh Hospital",
    "location": "Ghatkopar East, Mumbai 400077",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.077,
    "lng": 72.909,
    "tier": "DH",
    "bedsTotal": 100,
    "bedsAvailable": 12,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  },
  {
    "id": 45,
    "datasetId": "CSV_16",
    "name": "Prabodhan Charitable Dialysis Center",
    "location": "Goregaon, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.168,
    "lng": 72.851,
    "tier": "PHC",
    "bedsTotal": 35,
    "bedsAvailable": 4,
    "specialties": [
      "general"
    ]
  },
  {
    "id": 46,
    "datasetId": "CSV_17",
    "name": "Riddhi Vinayak Critical Care and Cardiac Centre",
    "location": "Malad, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.186,
    "lng": 72.848,
    "tier": "DH",
    "bedsTotal": 110,
    "bedsAvailable": 13,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology"
    ]
  },
  {
    "id": 47,
    "datasetId": "CSV_18",
    "name": "SevenHills Healthcare Pvt. Ltd.",
    "location": "Andheri East, Mumbai 400059",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.117,
    "lng": 72.887,
    "tier": "DH",
    "bedsTotal": 1500,
    "bedsAvailable": 180,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics",
      "pediatrics",
      "obstetrics"
    ]
  },
  {
    "id": 48,
    "datasetId": "CSV_19",
    "name": "Shivam Nursing Home",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.172,
    "lng": 72.843,
    "tier": "PHC",
    "bedsTotal": 30,
    "bedsAvailable": 4,
    "specialties": [
      "obstetrics",
      "general"
    ]
  },
  {
    "id": 49,
    "datasetId": "CSV_20",
    "name": "Shree Balaji Super Speciality Hospital",
    "location": "Kandivali, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.208,
    "lng": 72.849,
    "tier": "DH",
    "bedsTotal": 100,
    "bedsAvailable": 12,
    "specialties": [
      "emergency",
      "orthopedics",
      "cardiology"
    ]
  },
  {
    "id": 50,
    "datasetId": "CSV_21",
    "name": "Shree Naminath Jain Foundation",
    "location": "Borivali East, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.229,
    "lng": 72.857,
    "tier": "CHC",
    "bedsTotal": 60,
    "bedsAvailable": 7,
    "specialties": [
      "general",
      "emergency"
    ]
  },
  {
    "id": 51,
    "datasetId": "CSV_26",
    "name": "General Hospital Malvani",
    "location": "Malvani, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.195,
    "lng": 72.818,
    "tier": "CHC",
    "bedsTotal": 120,
    "bedsAvailable": 14,
    "specialties": [
      "emergency",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 52,
    "datasetId": "CSV_27",
    "name": "M. T. Agarwal Hospital",
    "location": "Mulund West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.174,
    "lng": 72.951,
    "tier": "DH",
    "bedsTotal": 220,
    "bedsAvailable": 26,
    "specialties": [
      "emergency",
      "general",
      "orthopedics"
    ]
  },
  {
    "id": 53,
    "datasetId": "CSV_28",
    "name": "Jagjivanram Railway Hospital",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 18.971,
    "lng": 72.822,
    "tier": "DH",
    "bedsTotal": 380,
    "bedsAvailable": 46,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  },
  {
    "id": 54,
    "datasetId": "CSV_29",
    "name": "Kasturba Hospital for Infectious Diseases",
    "location": "Chinchpokli/Mumbai area",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 18.986,
    "lng": 72.831,
    "tier": "DH",
    "bedsTotal": 450,
    "bedsAvailable": 54,
    "specialties": [
      "emergency",
      "general",
      "pediatrics"
    ]
  },
  {
    "id": 55,
    "datasetId": "CSV_30",
    "name": "Shatabdi Hospital",
    "location": "Govandi, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.055,
    "lng": 72.918,
    "tier": "DH",
    "bedsTotal": 280,
    "bedsAvailable": 34,
    "specialties": [
      "emergency",
      "general",
      "obstetrics",
      "pediatrics"
    ]
  },
  {
    "id": 56,
    "datasetId": "CSV_31",
    "name": "Rane Hospital Pvt. Ltd.",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.155,
    "lng": 72.938,
    "tier": "CHC",
    "bedsTotal": 70,
    "bedsAvailable": 8,
    "specialties": [
      "emergency",
      "orthopedics"
    ]
  },
  {
    "id": 57,
    "datasetId": "CSV_32",
    "name": "SRCC Children's Hospital – Managed by Narayana Health",
    "location": "Haji Ali/Worli area, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 18.978,
    "lng": 72.813,
    "tier": "DH",
    "bedsTotal": 210,
    "bedsAvailable": 25,
    "specialties": [
      "pediatrics",
      "cardiology",
      "neurology",
      "emergency"
    ]
  },
  {
    "id": 58,
    "datasetId": "CSV_33",
    "name": "Dr. Meena's Multispeciality Hospital",
    "location": "Bhandup, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.148,
    "lng": 72.935,
    "tier": "CHC",
    "bedsTotal": 65,
    "bedsAvailable": 8,
    "specialties": [
      "emergency",
      "general",
      "obstetrics"
    ]
  },
  {
    "id": 59,
    "datasetId": "CSV_34",
    "name": "Nana Palkar Smruti Samiti",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 18.995,
    "lng": 72.838,
    "tier": "PHC",
    "bedsTotal": 50,
    "bedsAvailable": 6,
    "specialties": [
      "general"
    ]
  },
  {
    "id": 60,
    "datasetId": "CSV_36",
    "name": "Criticare Lifeline Hospital",
    "location": "Mumbai Suburban",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.112,
    "lng": 72.831,
    "tier": "DH",
    "bedsTotal": 150,
    "bedsAvailable": 18,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  },
  {
    "id": 61,
    "datasetId": "CSV_37",
    "name": "HCG Cancer Centre",
    "location": "Borivali West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.234,
    "lng": 72.852,
    "tier": "DH",
    "bedsTotal": 120,
    "bedsAvailable": 14,
    "specialties": [
      "emergency",
      "general"
    ]
  },
  {
    "id": 62,
    "datasetId": "CSV_38",
    "name": "Fortis Hospital Mulund",
    "location": "Mulund West, Mumbai 400078",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.162,
    "lng": 72.948,
    "tier": "DH",
    "bedsTotal": 350,
    "bedsAvailable": 42,
    "specialties": [
      "cardiology",
      "neurology",
      "orthopedics",
      "emergency",
      "obstetrics"
    ]
  },
  {
    "id": 63,
    "datasetId": "CSV_39",
    "name": "Apex Hospitals",
    "location": "Borivali West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.232,
    "lng": 72.858,
    "tier": "DH",
    "bedsTotal": 100,
    "bedsAvailable": 12,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  },
  {
    "id": 64,
    "datasetId": "CSV_40",
    "name": "Pooja Maternity and Nursing Home",
    "location": "Ghatkopar, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.085,
    "lng": 72.909,
    "tier": "PHC",
    "bedsTotal": 40,
    "bedsAvailable": 5,
    "specialties": [
      "obstetrics",
      "pediatrics"
    ]
  },
  {
    "id": 65,
    "datasetId": "CSV_41",
    "name": "Theji Hospital",
    "location": "Bhandup West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.145,
    "lng": 72.931,
    "tier": "CHC",
    "bedsTotal": 50,
    "bedsAvailable": 6,
    "specialties": [
      "emergency",
      "general"
    ]
  },
  {
    "id": 66,
    "datasetId": "CSV_42",
    "name": "Panacea Right Care Right Here",
    "location": "Andheri, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.124,
    "lng": 72.843,
    "tier": "CHC",
    "bedsTotal": 60,
    "bedsAvailable": 7,
    "specialties": [
      "emergency",
      "general"
    ]
  },
  {
    "id": 67,
    "datasetId": "CSV_43",
    "name": "Kidney Care Centre",
    "location": "Bhandup West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.147,
    "lng": 72.933,
    "tier": "PHC",
    "bedsTotal": 40,
    "bedsAvailable": 5,
    "specialties": [
      "general"
    ]
  },
  {
    "id": 68,
    "datasetId": "CSV_44",
    "name": "Parisoha Foundation / Hindu Sabha Cardiac Setup",
    "location": "Ghatkopar West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.089,
    "lng": 72.91,
    "tier": "DH",
    "bedsTotal": 80,
    "bedsAvailable": 10,
    "specialties": [
      "cardiology",
      "emergency"
    ]
  },
  {
    "id": 69,
    "datasetId": "CSV_45",
    "name": "Savla Hospital",
    "location": "Chembur, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.059,
    "lng": 72.898,
    "tier": "CHC",
    "bedsTotal": 60,
    "bedsAvailable": 7,
    "specialties": [
      "emergency",
      "general"
    ]
  },
  {
    "id": 70,
    "datasetId": "CSV_46",
    "name": "Kohinoor Hospital",
    "location": "Kurla, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.072,
    "lng": 72.889,
    "tier": "DH",
    "bedsTotal": 175,
    "bedsAvailable": 21,
    "specialties": [
      "emergency",
      "cardiology",
      "neurology",
      "orthopedics"
    ]
  },
  {
    "id": 71,
    "datasetId": "CSV_47",
    "name": "Ramakrishna Mission Hospital",
    "location": "Khar West, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.071,
    "lng": 72.836,
    "tier": "DH",
    "bedsTotal": 150,
    "bedsAvailable": 18,
    "specialties": [
      "emergency",
      "general",
      "ophthalmology",
      "pediatrics"
    ]
  },
  {
    "id": 72,
    "datasetId": "CSV_48",
    "name": "Lifeline Multispeciality Hospital",
    "location": "Malad, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.182,
    "lng": 72.846,
    "tier": "DH",
    "bedsTotal": 90,
    "bedsAvailable": 11,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  },
  {
    "id": 73,
    "datasetId": "CSV_49",
    "name": "Samant Nursing Home",
    "location": "Goregaon, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.165,
    "lng": 72.849,
    "tier": "PHC",
    "bedsTotal": 35,
    "bedsAvailable": 4,
    "specialties": [
      "obstetrics",
      "general"
    ]
  },
  {
    "id": 74,
    "datasetId": "CSV_50",
    "name": "Padmashree Nursing Home",
    "location": "Mulund, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.171,
    "lng": 72.956,
    "tier": "PHC",
    "bedsTotal": 30,
    "bedsAvailable": 4,
    "specialties": [
      "obstetrics",
      "general"
    ]
  },
  {
    "id": 75,
    "datasetId": "CSV_51",
    "name": "Bakul Parekh Children's Hospital",
    "location": "Ghatkopar East, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.081,
    "lng": 72.913,
    "tier": "CHC",
    "bedsTotal": 50,
    "bedsAvailable": 6,
    "specialties": [
      "pediatrics",
      "emergency"
    ]
  },
  {
    "id": 76,
    "datasetId": "CSV_52",
    "name": "LifeLine Medicare Hospitals Pvt. Ltd.",
    "location": "Goregaon East, Mumbai",
    "administrativeArea": "Mumbai Suburban",
    "ownership": "Private / Trust",
    "lat": 19.163,
    "lng": 72.861,
    "tier": "DH",
    "bedsTotal": 110,
    "bedsAvailable": 13,
    "specialties": [
      "emergency",
      "cardiology",
      "orthopedics"
    ]
  }
];

export const MUMBAI_HOSPITAL_COORDINATES: Record<number, { lat: number; lng: number }> = {};
MUMBAI_MMR_HOSPITALS.forEach((h) => {
  MUMBAI_HOSPITAL_COORDINATES[h.id] = { lat: h.lat, lng: h.lng };
});

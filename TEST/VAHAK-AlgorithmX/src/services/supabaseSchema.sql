-- ==============================================================================
-- RURAL HEALTHCARE 3D DISPATCH & ROUTING COMMAND CENTER
-- Production Supabase PostgreSQL Schema & Realtime Replication Engine
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS & ROLES
-- ------------------------------------------------------------------------------
CREATE TYPE user_role_type AS ENUM ('dispatcher', 'doctor', 'hospital_admin', 'system_admin');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'dispatcher',
    badge_number TEXT,
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. VILLAGES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS villages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    population INTEGER NOT NULL DEFAULT 1000,
    region TEXT NOT NULL DEFAULT 'Eastern Highlands',
    elevation_meters INTEGER DEFAULT 800,
    terrain_difficulty TEXT DEFAULT 'Moderate',
    road_access_status TEXT DEFAULT 'clear',
    health_center_type TEXT DEFAULT 'Primary Health Sub-center',
    contact_person TEXT,
    emergency_phone TEXT,
    historical_response_avg_min DOUBLE PRECISION DEFAULT 25.0,
    pos_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. PATIENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    village_id TEXT REFERENCES villages(id) ON DELETE SET NULL,
    medical_history TEXT,
    blood_group TEXT,
    emergency_contact TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. HOSPITALS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    total_beds INTEGER NOT NULL DEFAULT 100,
    occupied_beds INTEGER NOT NULL DEFAULT 50,
    icu_total INTEGER NOT NULL DEFAULT 20,
    icu_occupied INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    type TEXT DEFAULT 'District General Hospital',
    trauma_level TEXT DEFAULT 'Level II Trauma Care',
    ventilators_available INTEGER DEFAULT 8,
    emergency_load TEXT DEFAULT 'Normal',
    oxygen_reserves_hours INTEGER DEFAULT 48,
    helipad_status TEXT DEFAULT 'Available',
    contact_radio TEXT DEFAULT 'CH-16 UHF',
    contact_phone TEXT,
    address TEXT,
    medicine_stock_percent INTEGER DEFAULT 90,
    blood_bank_o_plus INTEGER DEFAULT 25,
    blood_bank_o_minus INTEGER DEFAULT 12,
    blood_bank_a_plus INTEGER DEFAULT 18,
    blood_bank_b_plus INTEGER DEFAULT 22,
    pos_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. HOSPITAL DEPARTMENTS & BEDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospital_departments (
    id TEXT PRIMARY KEY,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    head_doctor TEXT,
    active_load INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 30
);

CREATE TABLE IF NOT EXISTS hospital_beds (
    id TEXT PRIMARY KEY,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    department TEXT NOT NULL,
    is_icu BOOLEAN DEFAULT FALSE,
    is_occupied BOOLEAN DEFAULT FALSE,
    patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. DOCTORS & SHIFTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    hospital_name TEXT,
    availability BOOLEAN DEFAULT TRUE,
    shift_start TEXT DEFAULT '08:00',
    shift_end TEXT DEFAULT '20:00',
    current_patient TEXT,
    status TEXT DEFAULT 'Available',
    phone TEXT,
    rating DOUBLE PRECISION DEFAULT 4.9,
    active_consults_count INTEGER DEFAULT 0,
    experience_years INTEGER DEFAULT 10,
    avatar_url TEXT,
    languages TEXT[] DEFAULT ARRAY['English', 'Hindi'],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_shifts (
    id TEXT PRIMARY KEY,
    doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
    shift_type TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    date DATE NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. AMBULANCES & EQUIPMENT
-- ------------------------------------------------------------------------------
CREATE TYPE ambulance_type_enum AS ENUM ('BLS', 'ALS', 'TRAUMA', 'NEONATAL', 'CRITICAL_CARE');
CREATE TYPE ambulance_status_enum AS ENUM ('AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'TRANSPORTING', 'MAINTENANCE');

CREATE TABLE IF NOT EXISTS ambulances (
    id TEXT PRIMARY KEY,
    callsign TEXT NOT NULL,
    vehicle_number TEXT,
    type TEXT NOT NULL DEFAULT 'ALS',
    status TEXT NOT NULL DEFAULT 'AVAILABLE',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    pos_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    driver_name TEXT NOT NULL,
    paramedic_lead TEXT NOT NULL,
    fuel_percentage INTEGER DEFAULT 95,
    oxygen_level_percent INTEGER DEFAULT 100,
    speed_kmh INTEGER DEFAULT 0,
    home_base_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    assigned_emergency_id TEXT,
    assigned_hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    battery_or_fuel_type TEXT DEFAULT 'Hybrid 4x4',
    equipment TEXT[] DEFAULT ARRAY['ALS Defibrillator', 'Portable Ventilator', 'Cold-Chain Kit', 'Spinal Immobilization'],
    telemetry_tire_pressure_ok BOOLEAN DEFAULT TRUE,
    telemetry_defibrillator_ready BOOLEAN DEFAULT TRUE,
    telemetry_uplink TEXT DEFAULT 'Connected (5G Satellite)',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ambulance_equipment (
    id TEXT PRIMARY KEY,
    ambulance_id TEXT REFERENCES ambulances(id) ON DELETE CASCADE,
    equipment_name TEXT NOT NULL,
    is_functional BOOLEAN DEFAULT TRUE,
    last_checked TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. MEDICINES & INVENTORY
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'vials',
    criticality TEXT DEFAULT 'High',
    min_threshold INTEGER DEFAULT 20,
    storage_temp_celsius TEXT DEFAULT '2°C - 8°C',
    cold_chain_requirement TEXT DEFAULT 'Refrigerated Cold Chain',
    urgent_drone_delivery_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_inventory (
    id TEXT PRIMARY KEY,
    medicine_id TEXT REFERENCES medicines(id) ON DELETE CASCADE,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 100,
    reserved_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 20,
    expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '365 days'),
    lot_number TEXT DEFAULT 'LOT-2026-X',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. PHARMACIES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pharmacies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    pos_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    village_or_town TEXT NOT NULL,
    critical_stock_level INTEGER DEFAULT 15,
    drone_pad_ready BOOLEAN DEFAULT TRUE,
    active_requests INTEGER DEFAULT 0,
    contact_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 10. ROADS, EDGES & CLOSURES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS road_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    node_type TEXT NOT NULL DEFAULT 'JUNCTION',
    pos_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS road_edges (
    id TEXT PRIMARY KEY,
    from_node TEXT REFERENCES road_nodes(id) ON DELETE CASCADE,
    to_node TEXT REFERENCES road_nodes(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    travel_time_min DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    traffic_multiplier DOUBLE PRECISION DEFAULT 1.0,
    road_condition TEXT DEFAULT 'GOOD',
    surface_type TEXT DEFAULT 'Asphalt Highway',
    elevation_slope_percent DOUBLE PRECISION DEFAULT 4.0,
    max_speed_kmh INTEGER DEFAULT 60,
    blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE road_closure_reason_enum AS ENUM ('FLOOD', 'LANDSLIDE', 'ACCIDENT', 'CONSTRUCTION', 'TRAFFIC');

CREATE TABLE IF NOT EXISTS road_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    road_id TEXT REFERENCES road_edges(id) ON DELETE CASCADE,
    reason road_closure_reason_enum NOT NULL DEFAULT 'LANDSLIDE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_until TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 11. EMERGENCIES
-- ------------------------------------------------------------------------------
CREATE TYPE emergency_urgency_enum AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE emergency_status_enum AS ENUM ('QUEUED', 'DISPATCHING', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'FAILED');

CREATE TABLE IF NOT EXISTS emergencies (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
    village_id TEXT REFERENCES villages(id) ON DELETE SET NULL,
    urgency emergency_urgency_enum NOT NULL DEFAULT 'CRITICAL',
    condition TEXT NOT NULL,
    required_specialist TEXT,
    required_medicine TEXT,
    sla_minutes INTEGER NOT NULL DEFAULT 30,
    status emergency_status_enum NOT NULL DEFAULT 'QUEUED',
    
    -- Telemetry & 3D metadata
    patient_name TEXT NOT NULL,
    patient_age INTEGER DEFAULT 35,
    patient_gender TEXT DEFAULT 'Male',
    village_name TEXT,
    pos_x DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_y DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pos_z DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    caller_phone TEXT,
    assigned_ambulance_id TEXT REFERENCES ambulances(id) ON DELETE SET NULL,
    target_hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    eta_minutes INTEGER DEFAULT 20,
    sla_status TEXT DEFAULT 'ON_TRACK',
    vital_heart_rate INTEGER DEFAULT 90,
    vital_blood_pressure TEXT DEFAULT '120/80',
    vital_spo2 INTEGER DEFAULT 98,
    vital_respiratory_rate INTEGER DEFAULT 18,
    vital_gcs INTEGER DEFAULT 15,
    vital_temp_celsius DOUBLE PRECISION DEFAULT 37.0,
    notes TEXT[] DEFAULT ARRAY['Distress call logged by rural outpost operator.'],
    telemedicine_active BOOLEAN DEFAULT FALSE,
    drone_support_requested BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 12. ROUTES & DISPATCHES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
    id TEXT PRIMARY KEY,
    origin_node TEXT,
    destination_node TEXT,
    waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_distance_km DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    estimated_time_min DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    path_geojson JSONB,
    generated_by TEXT DEFAULT 'A_STAR',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatches (
    id TEXT PRIMARY KEY,
    emergency_id TEXT REFERENCES emergencies(id) ON DELETE CASCADE,
    ambulance_id TEXT REFERENCES ambulances(id) ON DELETE SET NULL,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    route_id TEXT REFERENCES routes(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    eta_minutes INTEGER DEFAULT 18,
    status TEXT NOT NULL DEFAULT 'DISPATCHED',
    decision_score DOUBLE PRECISION DEFAULT 0.94,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispatch_id TEXT REFERENCES dispatches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notes TEXT
);

-- ------------------------------------------------------------------------------
-- 13. AI RECOMMENDATIONS & AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emergency_id TEXT REFERENCES emergencies(id) ON DELETE CASCADE,
    recommended_ambulance_id TEXT REFERENCES ambulances(id) ON DELETE SET NULL,
    recommended_hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    triage_summary TEXT NOT NULL,
    risk_score DOUBLE PRECISION DEFAULT 8.5,
    confidence_score DOUBLE PRECISION DEFAULT 0.95,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    action TEXT NOT NULL,
    component TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospital_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE road_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous and Authenticated Read Access for Telemetry & 3D Command Visualization
CREATE POLICY "Public Read Access Villages" ON villages FOR SELECT USING (true);
CREATE POLICY "Public Read Access Hospitals" ON hospitals FOR SELECT USING (true);
CREATE POLICY "Public Read Access Hospital Beds" ON hospital_beds FOR SELECT USING (true);
CREATE POLICY "Public Read Access Hospital Depts" ON hospital_departments FOR SELECT USING (true);
CREATE POLICY "Public Read Access Doctors" ON doctors FOR SELECT USING (true);
CREATE POLICY "Public Read Access Doctor Shifts" ON doctor_shifts FOR SELECT USING (true);
CREATE POLICY "Public Read Access Ambulances" ON ambulances FOR SELECT USING (true);
CREATE POLICY "Public Read Access Ambulance Equip" ON ambulance_equipment FOR SELECT USING (true);
CREATE POLICY "Public Read Access Medicines" ON medicines FOR SELECT USING (true);
CREATE POLICY "Public Read Access Medicine Inv" ON medicine_inventory FOR SELECT USING (true);
CREATE POLICY "Public Read Access Pharmacies" ON pharmacies FOR SELECT USING (true);
CREATE POLICY "Public Read Access Road Nodes" ON road_nodes FOR SELECT USING (true);
CREATE POLICY "Public Read Access Road Edges" ON road_edges FOR SELECT USING (true);
CREATE POLICY "Public Read Access Road Closures" ON road_closures FOR SELECT USING (true);
CREATE POLICY "Public Read Access Emergencies" ON emergencies FOR SELECT USING (true);
CREATE POLICY "Public Read Access Routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public Read Access Dispatches" ON dispatches FOR SELECT USING (true);
CREATE POLICY "Public Read Access Dispatch Events" ON dispatch_events FOR SELECT USING (true);
CREATE POLICY "Public Read Access AI Recs" ON ai_recommendations FOR SELECT USING (true);
CREATE POLICY "Public Read Access Audit Logs" ON audit_logs FOR SELECT USING (true);

-- Dispatcher & System Admin Write Operations
CREATE POLICY "Allow All Operations on Emergencies" ON emergencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Ambulances" ON ambulances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Hospitals" ON hospitals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Dispatches" ON dispatches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Dispatch Events" ON dispatch_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Road Closures" ON road_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Road Edges" ON road_edges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Medicine Inv" ON medicine_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Doctors" ON doctors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Audit Logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on AI Recs" ON ai_recommendations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow All Operations on Routes" ON routes FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 15. SUPABASE REALTIME REPLICATION CONFIGURATION
-- ------------------------------------------------------------------------------
-- Add key dynamic operational tables to the realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'emergencies'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE emergencies;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'ambulances'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE ambulances;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'hospitals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hospitals;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'medicine_inventory'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE medicine_inventory;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'road_closures'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE road_closures;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'dispatches'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE dispatches;
    END IF;
END $$;

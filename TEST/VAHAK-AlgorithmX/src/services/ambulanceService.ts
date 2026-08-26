import { getSupabaseClient } from '../lib/supabaseClient';
import { Ambulance, AmbulanceStatus } from '../types';

export const ambulanceService = {
  /**
   * Fetch all ambulances from Supabase
   */
  async fetchAmbulances(): Promise<{ data: Ambulance[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error('Supabase client offline') };
    }

    try {
      const { data, error } = await client.from('ambulances').select('*');
      if (error) throw error;

      const mapped: Ambulance[] = (data || []).map((row: any) => ({
        id: row.id,
        callsign: row.callsign,
        vehicle_number: row.vehicle_number,
        type: row.type as any,
        status: (row.status === 'AVAILABLE' ? 'Idle / Ready'
          : row.status === 'ASSIGNED' ? 'Dispatched En Route'
          : row.status === 'EN_ROUTE' ? 'Dispatched En Route'
          : row.status === 'TRANSPORTING' ? 'Transporting to Hospital'
          : row.status) as AmbulanceStatus,
        latitude: row.latitude,
        longitude: row.longitude,
        position: [row.pos_x || 0, row.pos_y || 0.4, row.pos_z || 0],
        driver_name: row.driver_name || 'Driver',
        driverName: row.driver_name || 'Driver',
        paramedicLead: row.paramedic_lead || 'Lead Paramedic',
        fuel_percentage: row.fuel_percentage || 90,
        fuelPercent: row.fuel_percentage || 90,
        homeBaseId: row.home_base_id || 'hosp-01',
        assignedEmergencyId: row.assigned_emergency_id,
        assignedHospitalId: row.assigned_hospital_id,
        oxygenLevelPercent: row.oxygen_level_percent || 95,
        speedKmh: row.speed_kmh || 0,
        batteryOrFuelType: row.battery_or_fuel_type || 'Hybrid 4x4',
        equipment: row.equipment || ['ALS Defibrillator', 'Portable Ventilator'],
        telemetry: {
          tirePressureOk: row.telemetry_tire_pressure_ok ?? true,
          defibrillatorReady: row.telemetry_defibrillator_ready ?? true,
          telemedicineUplink: row.telemetry_uplink || 'Connected (5G Satellite)',
          lastServiceDate: '2026-08-15',
        },
      }));

      return { data: mapped, error: null };
    } catch (error) {
      console.warn('[ambulanceService.fetchAmbulances] Supabase query failed:', error);
      return { data: null, error };
    }
  },

  /**
   * Update ambulance live position & telemetry (e.g. while moving in 3D)
   */
  async updateAmbulanceTelemetry(id: string, updates: Partial<Ambulance>): Promise<{ success: boolean; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: new Error('Supabase client offline') };

    try {
      const payload: any = {};
      if (updates.position) {
        payload.pos_x = updates.position[0];
        payload.pos_y = updates.position[1];
        payload.pos_z = updates.position[2];
        payload.latitude = 23.5 + updates.position[2] * 0.05;
        payload.longitude = 85.3 + updates.position[0] * 0.05;
      }
      if (updates.status) payload.status = updates.status;
      if (updates.fuelPercent !== undefined) payload.fuel_percentage = updates.fuelPercent;
      if (updates.speedKmh !== undefined) payload.speed_kmh = updates.speedKmh;
      if (updates.assignedEmergencyId !== undefined) payload.assigned_emergency_id = updates.assignedEmergencyId;
      if (updates.assignedHospitalId !== undefined) payload.assigned_hospital_id = updates.assignedHospitalId;

      const { error } = await client.from('ambulances').update(payload).eq('id', id);
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Realtime subscription for ambulance movement and status
   */
  subscribeToAmbulances(onUpdate: (payload: any) => void) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const existing = client.getChannels().find(
        (c) => c.topic === 'realtime:realtime_ambulances' || c.topic === 'realtime_ambulances'
      );
      if (existing) {
        client.removeChannel(existing);
      }

      return client
        .channel('realtime_ambulances')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, onUpdate)
        .subscribe();
    } catch (err) {
      console.warn('[ambulanceService.subscribeToAmbulances] Realtime subscribe warning:', err);
      return null;
    }
  }
};

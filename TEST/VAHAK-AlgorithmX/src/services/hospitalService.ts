import { getSupabaseClient } from '../lib/supabaseClient';
import { Hospital, HospitalDepartment } from '../types';

export const hospitalService = {
  /**
   * Fetch all hospitals & capacity telemetry
   */
  async fetchHospitals(): Promise<{ data: Hospital[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error('Supabase client offline') };
    }

    try {
      const { data, error } = await client.from('hospitals').select('*');
      if (error) throw error;

      const mapped: Hospital[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        shortName: row.short_name || row.name.split(' ')[0],
        latitude: row.latitude,
        longitude: row.longitude,
        position: [row.pos_x || 0, row.pos_y || 0.4, row.pos_z || 0],
        type: row.type || 'District General Hospital',
        traumaLevel: row.trauma_level || 'Level I Trauma Care',
        totalBeds: row.total_beds || 100,
        availableBeds: (row.total_beds || 100) - (row.occupied_beds || 50),
        total_beds: row.total_beds || 100,
        occupied_beds: row.occupied_beds || 50,
        icuTotal: row.icu_total || 20,
        icuAvailable: (row.icu_total || 20) - (row.icu_occupied || 10),
        icu_total: row.icu_total || 20,
        icu_occupied: row.icu_occupied || 10,
        ventilatorsAvailable: row.ventilators_available || 6,
        emergencyLoad: row.emergency_load || 'Normal',
        status: row.status || 'ACTIVE',
        specialists: ['Trauma Surgeon', 'Cardiologist', 'Toxicologist', 'Intensivist', 'Obstetrician'],
        specialties: ['Trauma Surgeon', 'Cardiologist', 'Toxicologist', 'Intensivist', 'Obstetrician'],
        oxygenReservesHours: row.oxygen_reserves_hours || 48,
        helipadReady: true,
        helipadStatus: (row.helipad_status || 'Available') as any,
        contactRadio: row.contact_radio || 'CH-16 UHF',
        contactNumber: row.contact_phone || '+91 800-441-2000',
        address: row.address || 'District Hospital Enclave',
        medicineStockPercent: row.medicine_stock_percent || 90,
        bloodBankUnits: {
          'O+': row.blood_bank_o_plus || 25,
          'O-': row.blood_bank_o_minus || 12,
          'A+': row.blood_bank_a_plus || 18,
          'B+': row.blood_bank_b_plus || 22,
        },
      }));

      return { data: mapped, error: null };
    } catch (error) {
      console.warn('[hospitalService.fetchHospitals] Supabase query failed:', error);
      return { data: null, error };
    }
  },

  /**
   * Update hospital bed & ICU counts
   */
  async updateBedOccupancy(hospitalId: string, occupiedBeds: number, icuOccupied: number): Promise<{ success: boolean; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: new Error('Supabase client offline') };

    try {
      const { error } = await client
        .from('hospitals')
        .update({
          occupied_beds: occupiedBeds,
          icu_occupied: icuOccupied,
          updated_at: new Date().toISOString(),
        })
        .eq('id', hospitalId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Fetch hospital departments
   */
  async fetchDepartments(hospitalId: string): Promise<{ data: HospitalDepartment[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      const { data, error } = await client
        .from('hospital_departments')
        .select('*')
        .eq('hospital_id', hospitalId);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Realtime subscription for hospital bed capacity & surge changes
   */
  subscribeToHospitals(onUpdate: (payload: any) => void) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const existing = client.getChannels().find(
        (c) => c.topic === 'realtime:realtime_hospitals' || c.topic === 'realtime_hospitals'
      );
      if (existing) {
        client.removeChannel(existing);
      }

      return client
        .channel('realtime_hospitals')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'hospitals' }, onUpdate)
        .subscribe();
    } catch (err) {
      console.warn('[hospitalService.subscribeToHospitals] Realtime subscribe warning:', err);
      return null;
    }
  }
};

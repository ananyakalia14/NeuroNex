import { getSupabaseClient } from '../lib/supabaseClient';
import { Doctor } from '../types';

export const doctorService = {
  /**
   * Fetch doctors roster & active telemedicine states
   */
  async fetchDoctors(): Promise<{ data: Doctor[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      const { data, error } = await client.from('doctors').select('*');
      if (error) throw error;

      const mapped: Doctor[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        specialization: row.specialization,
        specialty: row.specialization,
        hospitalId: row.hospital_id || 'hosp-01',
        hospital_id: row.hospital_id || 'hosp-01',
        hospitalName: row.hospital_name || 'Apex Trauma Center',
        availability: row.availability ?? true,
        shift_start: row.shift_start || '08:00',
        shift_end: row.shift_end || '20:00',
        current_patient: row.current_patient,
        status: (row.status || 'Available') as any,
        phone: row.phone || '+91 98400 11000',
        rating: row.rating || 4.9,
        activeConsultsCount: row.active_consults_count || 0,
        experienceYears: row.experience_years || 10,
        avatarUrl: row.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        languages: row.languages || ['English', 'Hindi'],
      }));

      return { data: mapped, error: null };
    } catch (error) {
      console.warn('[doctorService.fetchDoctors] Supabase query failed:', error);
      return { data: null, error };
    }
  },

  /**
   * Update doctor status (e.g. In Surgery, Available, On Tele-Consult)
   */
  async updateDoctorStatus(doctorId: string, status: Doctor['status'], currentPatient?: string): Promise<{ success: boolean; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: new Error('Supabase client offline') };

    try {
      const { error } = await client
        .from('doctors')
        .update({
          status,
          availability: status === 'Available',
          current_patient: currentPatient || null,
        })
        .eq('id', doctorId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },
};

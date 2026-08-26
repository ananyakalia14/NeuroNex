import { getSupabaseClient } from '../lib/supabaseClient';
import { Emergency, SeverityLevel } from '../types';

export const emergencyService = {
  /**
   * Fetch all emergencies from Supabase or fallback
   */
  async fetchEmergencies(): Promise<{ data: Emergency[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error('Supabase client offline') };
    }

    try {
      const { data, error } = await client
        .from('emergencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map Supabase column names to UI domain models
      const mapped: Emergency[] = (data || []).map((row: any) => ({
        id: row.id,
        patientName: row.patient_name || 'Emergency Patient',
        patientAge: row.patient_age || 35,
        patientGender: row.patient_gender || 'Male',
        villageId: row.village_id || 'vil-01',
        villageName: row.village_name || 'Rural Village',
        position: [row.pos_x || 0, row.pos_y || 0.4, row.pos_z || 0],
        condition: row.condition || 'Emergency Condition',
        severity: (row.urgency === 'CRITICAL' ? 'Critical' : row.urgency === 'HIGH' ? 'High' : row.urgency === 'LOW' ? 'Low' : 'Medium') as SeverityLevel,
        requiredSpecialist: row.required_specialist || 'Emergency Trauma Surgeon',
        requiredMedicine: row.required_medicine || 'Polyvalent Antivenom',
        callerPhone: row.caller_phone || '+91 98450 00000',
        reportedAt: row.created_at || new Date().toISOString(),
        assignedAmbulanceId: row.assigned_ambulance_id,
        targetHospitalId: row.target_hospital_id,
        status: row.status || 'QUEUED',
        etaMinutes: row.eta_minutes || 20,
        slaTargetMinutes: row.sla_minutes || 30,
        slaStatus: (row.sla_status || 'ON_TRACK') as any,
        vitals: {
          heartRate: row.vital_heart_rate || 90,
          bloodPressure: row.vital_blood_pressure || '120/80',
          spO2: row.vital_spo2 || 98,
          respiratoryRate: row.vital_respiratory_rate || 18,
          gcs: row.vital_gcs || 15,
          tempCelsius: row.vital_temp_celsius || 37.0,
        },
        notes: row.notes || [],
        telemedicineActive: row.telemedicine_active || false,
        droneSupportRequested: row.drone_support_requested || false,
      }));

      return { data: mapped, error: null };
    } catch (error) {
      console.warn('[emergencyService.fetchEmergencies] Query failed, falling back to local:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new emergency in Supabase
   */
  async createEmergency(emg: Partial<Emergency>): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { data: null, error: new Error('Supabase client offline') };
    }

    try {
      const urgencyEnum = emg.severity === 'Critical' ? 'CRITICAL' : emg.severity === 'High' ? 'HIGH' : emg.severity === 'Low' ? 'LOW' : 'MEDIUM';
      const payload = {
        id: emg.id || `emg-${Date.now()}`,
        patient_name: emg.patientName,
        patient_age: emg.patientAge || 30,
        patient_gender: emg.patientGender || 'Male',
        village_id: emg.villageId,
        village_name: emg.villageName,
        urgency: urgencyEnum,
        condition: emg.condition || 'Emergency Condition',
        required_specialist: emg.requiredSpecialist,
        required_medicine: emg.requiredMedicine,
        sla_minutes: emg.slaTargetMinutes || 30,
        status: 'QUEUED',
        pos_x: emg.position?.[0] || 0,
        pos_y: emg.position?.[1] || 0.4,
        pos_z: emg.position?.[2] || 0,
        caller_phone: emg.callerPhone,
        vital_heart_rate: emg.vitals?.heartRate || 90,
        vital_blood_pressure: emg.vitals?.bloodPressure || '120/80',
        vital_spo2: emg.vitals?.spO2 || 98,
        vital_respiratory_rate: emg.vitals?.respiratoryRate || 18,
        vital_gcs: emg.vitals?.gcs || 15,
        vital_temp_celsius: emg.vitals?.tempCelsius || 37.0,
        notes: emg.notes || ['Intake logged in Command Center.'],
        drone_support_requested: emg.droneSupportRequested || false,
      };

      const { data, error } = await client.from('emergencies').insert(payload).select().single();
      return { data, error };
    } catch (error) {
      console.warn('[emergencyService.createEmergency] Insert failed:', error);
      return { data: null, error };
    }
  },

  /**
   * Update emergency status or assigned units
   */
  async updateEmergencyStatus(id: string, updates: Partial<Emergency>): Promise<{ success: boolean; error: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: new Error('Supabase client offline') };
    }

    try {
      const payload: any = {};
      if (updates.status) payload.status = updates.status;
      if (updates.assignedAmbulanceId) payload.assigned_ambulance_id = updates.assignedAmbulanceId;
      if (updates.targetHospitalId) payload.target_hospital_id = updates.targetHospitalId;
      if (updates.etaMinutes !== undefined) payload.eta_minutes = updates.etaMinutes;
      if (updates.slaStatus) payload.sla_status = updates.slaStatus;
      if (updates.telemedicineActive !== undefined) payload.telemedicine_active = updates.telemedicineActive;

      const { error } = await client.from('emergencies').update(payload).eq('id', id);
      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Subscribe to Supabase Realtime changes on emergencies table
   */
  subscribeToEmergencies(onUpdate: (payload: any) => void) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      // Remove any pre-existing channel for this topic to avoid duplicate callback / already subscribed error
      const existing = client.getChannels().find(
        (c) => c.topic === 'realtime:realtime_emergencies' || c.topic === 'realtime_emergencies'
      );
      if (existing) {
        client.removeChannel(existing);
      }

      return client
        .channel('realtime_emergencies')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, onUpdate)
        .subscribe();
    } catch (err) {
      console.warn('[emergencyService.subscribeToEmergencies] Realtime subscribe warning:', err);
      return null;
    }
  }
};

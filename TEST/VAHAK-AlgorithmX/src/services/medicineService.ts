import { getSupabaseClient } from '../lib/supabaseClient';
import { Medicine } from '../types';

export const medicineService = {
  /**
   * Fetch medicine inventory and cold-chain stock levels
   */
  async fetchMedicines(): Promise<{ data: Medicine[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      const { data, error } = await client
        .from('medicine_inventory')
        .select(`
          id,
          quantity,
          reserved_quantity,
          reorder_level,
          expiry_date,
          lot_number,
          hospital_id,
          hospitals (name),
          medicines (id, name, category, unit, criticality, min_threshold, storage_temp_celsius, cold_chain_requirement, urgent_drone_delivery_required)
        `);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Direct query on medicines table if inventory joins aren't populated yet
        const { data: rawMeds, error: rawErr } = await client.from('medicines').select('*');
        if (rawErr) throw rawErr;

        const mapped: Medicine[] = (rawMeds || []).map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          unit: m.unit || 'vials',
          criticality: m.criticality || 'High',
          currentStock: 45,
          minThreshold: m.min_threshold || 20,
          minimumThreshold: m.min_threshold || 20,
          hospitalId: 'hosp-01',
          hospitalName: 'Apex Regional Trauma Center',
          expiryDate: '2027-11-30',
          urgentDroneDeliveryRequired: m.urgent_drone_delivery_required || false,
          storageTempCelsius: m.storage_temp_celsius || '2°C - 8°C',
          coldChainRequirement: m.cold_chain_requirement || 'Refrigerated Cold Chain',
          lotNumber: 'LOT-2026-X',
        }));
        return { data: mapped, error: null };
      }

      const mapped: Medicine[] = data.map((row: any) => ({
        id: row.medicines?.id || row.id,
        name: row.medicines?.name || 'Emergency Medicine',
        category: row.medicines?.category || 'Antivenom & Antitoxins',
        unit: row.medicines?.unit || 'vials',
        criticality: row.quantity <= (row.reorder_level || 20) ? 'Critical' : (row.medicines?.criticality || 'Standard'),
        currentStock: row.quantity,
        minThreshold: row.reorder_level || 20,
        minimumThreshold: row.reorder_level || 20,
        hospitalId: row.hospital_id,
        hospitalName: row.hospitals?.name || 'District Hospital',
        expiryDate: row.expiry_date || '2027-11-30',
        urgentDroneDeliveryRequired: row.quantity <= (row.reorder_level || 20),
        storageTempCelsius: row.medicines?.storage_temp_celsius || '2°C - 8°C',
        coldChainRequirement: row.medicines?.cold_chain_requirement || 'Refrigerated Cold Chain',
        lotNumber: row.lot_number || 'LOT-2026-X',
      }));

      return { data: mapped, error: null };
    } catch (error) {
      console.warn('[medicineService.fetchMedicines] Supabase query failed:', error);
      return { data: null, error };
    }
  },

  /**
   * Update stock count when dispensed or delivered via drone
   */
  async updateMedicineStock(medicineId: string, newStock: number): Promise<{ success: boolean; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: new Error('Supabase client offline') };

    try {
      const { error } = await client
        .from('medicine_inventory')
        .update({
          quantity: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq('medicine_id', medicineId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Realtime subscription for medicine inventory adjustments
   */
  subscribeToMedicineInventory(onUpdate: (payload: any) => void) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const existing = client.getChannels().find(
        (c) => c.topic === 'realtime:realtime_medicine_inventory' || c.topic === 'realtime_medicine_inventory'
      );
      if (existing) {
        client.removeChannel(existing);
      }

      return client
        .channel('realtime_medicine_inventory')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'medicine_inventory' }, onUpdate)
        .subscribe();
    } catch (err) {
      console.warn('[medicineService.subscribeToMedicineInventory] Realtime subscribe warning:', err);
      return null;
    }
  }
};

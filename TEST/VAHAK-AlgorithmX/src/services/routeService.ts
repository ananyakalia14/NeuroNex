import { getSupabaseClient } from '../lib/supabaseClient';
import { RouteRecord, Dispatch } from '../types';

export const routeService = {
  /**
   * Save computed A* route into Supabase
   */
  async saveRoute(route: Partial<RouteRecord>): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      const payload = {
        id: route.id || `route-${Date.now()}`,
        origin_node: route.origin_node || 'origin',
        destination_node: route.destination_node || 'destination',
        waypoints: route.waypoints || [],
        total_distance_km: route.total_distance_km || 10,
        estimated_time_min: route.estimated_time_min || 20,
        generated_by: route.generated_by || 'A_STAR',
      };

      const { data, error } = await client.from('routes').insert(payload).select().single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Create tactical dispatch record
   */
  async createDispatchRecord(dispatch: Partial<Dispatch>): Promise<{ data: any; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      const payload = {
        id: dispatch.id || `disp-${Date.now()}`,
        emergency_id: dispatch.emergency_id,
        ambulance_id: dispatch.ambulance_id,
        hospital_id: dispatch.hospital_id,
        route_id: dispatch.route_id,
        assigned_at: new Date().toISOString(),
        eta_minutes: dispatch.eta_minutes || 20,
        status: dispatch.status || 'DISPATCHED',
        decision_score: dispatch.decision_score || 0.95,
      };

      const { data, error } = await client.from('dispatches').insert(payload).select().single();
      
      // Also log dispatch event
      if (data?.id) {
        await client.from('dispatch_events').insert({
          dispatch_id: data.id,
          event_type: 'DISPATCH_TRIGGERED',
          timestamp: new Date().toISOString(),
          notes: 'Ambulance assigned and route loaded.',
        });
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Subscribe to real-time dispatches
   */
  subscribeToDispatches(onUpdate: (payload: any) => void) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const existing = client.getChannels().find(
        (c) => c.topic === 'realtime:realtime_dispatches' || c.topic === 'realtime_dispatches'
      );
      if (existing) {
        client.removeChannel(existing);
      }

      return client
        .channel('realtime_dispatches')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatches' }, onUpdate)
        .subscribe();
    } catch (err) {
      console.warn('[routeService.subscribeToDispatches] Realtime subscribe warning:', err);
      return null;
    }
  }
};

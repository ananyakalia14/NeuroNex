import { getSupabaseClient } from '../lib/supabaseClient';
import { RoadSegment, RoadStatus, RoadClosureReason } from '../types';

export const roadService = {
  /**
   * Fetch road segments and topological edges
   */
  async fetchRoadSegments(): Promise<{ data: RoadSegment[] | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      const { data, error } = await client.from('road_edges').select(`
        id,
        from_node,
        to_node,
        distance_km,
        travel_time_min,
        traffic_multiplier,
        road_condition,
        surface_type,
        elevation_slope_percent,
        max_speed_kmh,
        blocked,
        blocked_reason,
        nodeA:road_nodes!from_node (id, name, pos_x, pos_y, pos_z),
        nodeB:road_nodes!to_node (id, name, pos_x, pos_y, pos_z)
      `);

      if (error) throw error;

      const mapped: RoadSegment[] = (data || []).map((row: any) => {
        const startPos: [number, number, number] = [row.nodeA?.pos_x || 0, row.nodeA?.pos_y || 0.2, row.nodeA?.pos_z || 0];
        const endPos: [number, number, number] = [row.nodeB?.pos_x || 10, row.nodeB?.pos_y || 0.2, row.nodeB?.pos_z || 10];
        const status: RoadStatus = row.blocked ? 'BLOCKED_LANDSLIDE' : row.road_condition === 'POOR' ? 'WARNING_FLOOD' : 'OPEN';

        return {
          id: row.id,
          fromNodeId: row.from_node,
          toNodeId: row.to_node,
          startPos,
          endPos,
          name: `NH-${row.id} (${row.nodeA?.name || 'Node A'} - ${row.nodeB?.name || 'Node B'})`,
          status,
          surfaceType: row.surface_type || 'Asphalt Highway',
          terrainDifficulty: (startPos[1] > 0.6 || endPos[1] > 0.6) ? 'Mountain Slope' : 'Standard',
          elevationSlopePercent: row.elevation_slope_percent || 4,
          maxSpeedKmh: row.max_speed_kmh || 60,
          lengthKm: row.distance_km || 8,
          blockedReason: row.blocked_reason,
          clearanceEtaMinutes: row.blocked ? 120 : undefined,
        };
      });

      return { data: mapped, error: null };
    } catch (error) {
      console.warn('[roadService.fetchRoadSegments] Supabase query failed:', error);
      return { data: null, error };
    }
  },

  /**
   * Toggle road blockage / landslide closure in Supabase
   */
  async toggleRoadClosure(roadId: string, isBlocked: boolean, reason: RoadClosureReason = 'LANDSLIDE'): Promise<{ success: boolean; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: new Error('Supabase client offline') };

    try {
      // 1. Update edge blocked flag
      const { error: edgeErr } = await client
        .from('road_edges')
        .update({
          blocked: isBlocked,
          blocked_reason: isBlocked ? reason : null,
        })
        .eq('id', roadId);

      if (edgeErr) throw edgeErr;

      // 2. Insert or remove closure record
      if (isBlocked) {
        await client.from('road_closures').insert({
          road_id: roadId,
          reason,
          created_at: new Date().toISOString(),
        });
      }

      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  },

  /**
   * Realtime subscription for road closures & landslides
   */
  subscribeToRoadClosures(onUpdate: (payload: any) => void) {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const existing = client.getChannels().find(
        (c) => c.topic === 'realtime:realtime_road_closures' || c.topic === 'realtime_road_closures'
      );
      if (existing) {
        client.removeChannel(existing);
      }

      return client
        .channel('realtime_road_closures')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'road_closures' }, onUpdate)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'road_edges' }, onUpdate)
        .subscribe();
    } catch (err) {
      console.warn('[roadService.subscribeToRoadClosures] Realtime subscribe warning:', err);
      return null;
    }
  }
};

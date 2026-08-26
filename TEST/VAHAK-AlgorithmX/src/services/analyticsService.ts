import { getSupabaseClient } from '../lib/supabaseClient';
import { TelemetryMetrics } from '../types';

export const analyticsService = {
  /**
   * Fetch aggregated analytics & SLA telemetry
   */
  async fetchAggregatedMetrics(): Promise<{ data: Partial<TelemetryMetrics> | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) return { data: null, error: new Error('Supabase client offline') };

    try {
      // 1. Get counts
      const [
        { count: emgCount },
        { count: ambCount },
        { count: hospCount },
        { count: docCount },
      ] = await Promise.all([
        client.from('emergencies').select('*', { count: 'exact', head: true }),
        client.from('ambulances').select('*', { count: 'exact', head: true }),
        client.from('hospitals').select('*', { count: 'exact', head: true }),
        client.from('doctors').select('*', { count: 'exact', head: true }),
      ]);

      return {
        data: {
          activeEmergenciesCount: emgCount || 0,
          totalAmbulances: ambCount || 0,
          totalHospitals: hospCount || 0,
          databaseRowsCount: (emgCount || 0) + (ambCount || 0) + (hospCount || 0) + (docCount || 0),
          realtimeConnected: true,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Log audit events
   */
  async logAuditEvent(action: string, component: string, severity: 'INFO' | 'WARN' | 'CRITICAL' | 'A_STAR' | 'AI_TRIAGE' | 'WEBSOCKET' = 'INFO', metadata?: any): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      await client.from('audit_logs').insert({
        action,
        component,
        severity,
        metadata: metadata || null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Silent catch for audit logging
    }
  }
};

import { getSupabaseClient } from '../lib/supabaseClient';
import { askAIAssistant, requestAiTriageRecommendation, TriageResult } from './geminiService';
import { Emergency, Hospital, Ambulance, RoadSegment } from '../types';

export const aiService = {
  /**
   * Request Clinical AI triage recommendation with routing considerations
   */
  async requestTriageRecommendation(
    emergency: Emergency,
    hospitals: Hospital[],
    ambulances: Ambulance[],
    roadSegments: RoadSegment[]
  ): Promise<TriageResult> {
    const result = await requestAiTriageRecommendation(emergency, hospitals, ambulances, roadSegments);

    // Persist to Supabase ai_recommendations table if connected
    const client = getSupabaseClient();
    if (client && result) {
      try {
        await client.from('ai_recommendations').insert({
          emergency_id: emergency.id,
          recommended_ambulance_id: result.recommendedAmbulanceId,
          recommended_hospital_id: result.recommendedHospitalId,
          triage_summary: result.clinicalProtocol,
          risk_score: result.triageSeverity === 'Critical' ? 9.2 : 6.5,
          confidence_score: result.confidence || 0.94,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[aiService] Failed to persist AI recommendation:', err);
      }
    }

    return result;
  },

  /**
   * Conversational query with Gemini Clinical Assistant
   */
  async askCoPilot(message: string, context?: any) {
    return await askAIAssistant(message, context);
  }
};

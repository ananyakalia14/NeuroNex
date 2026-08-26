import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys
const STORAGE_KEY_URL = 'rural_health_supabase_url';
const STORAGE_KEY_KEY = 'rural_health_supabase_key';

let cachedClient: SupabaseClient | null = null;
let lastConfigUrl = '';
let lastConfigKey = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isCustom: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const customUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) : null;

  const url = (customUrl || envUrl || '').trim();
  const anonKey = (customKey || envKey || '').trim();

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 10
  );

  return {
    url,
    anonKey,
    isConfigured,
    isCustom: Boolean(customUrl || customKey),
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  setCustomSupabaseConfig(url, anonKey);
}

export function setCustomSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_KEY);
    }
    // Clean up all existing channels before invalidating cached client
    if (cachedClient) {
      try {
        cachedClient.removeAllChannels();
      } catch (err) {
        console.warn('[SupabaseClient] Error cleaning channels:', err);
      }
    }
    // Invalidate cached client
    cachedClient = null;
    lastConfigUrl = '';
    lastConfigKey = '';
  }
}

export function clearSupabaseConfig(): void {
  setCustomSupabaseConfig('', '');
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  // Reuse instance if config hasn't changed
  if (cachedClient && lastConfigUrl === config.url && lastConfigKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });

    lastConfigUrl = config.url;
    lastConfigKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('[SupabaseClient] Initialization error:', err);
    return null;
  }
}

/**
 * Health check to verify credentials and connectivity
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      message: 'Supabase URL or Anon key is not set. Using resilient local cache.',
      latencyMs: 0,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Failed to construct Supabase client instance.',
      latencyMs: 0,
    };
  }

  const start = performance.now();
  try {
    // Ping with a lightweight query
    const { error } = await client.from('emergencies').select('id').limit(1);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      // Table might not exist yet if schema hasn't been executed
      if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return {
          success: true,
          message: `Connected to Supabase (${latencyMs}ms), but tables need to be created. Use "Seed Supabase Tables" or run SQL schema.`,
          latencyMs,
        };
      }
      return {
        success: false,
        message: error.message || 'Supabase query error',
        latencyMs,
      };
    }

    return {
      success: true,
      message: `Supabase Realtime PostgreSQL active (${latencyMs}ms)`,
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      message: err?.message || 'Network timeout or invalid host.',
      latencyMs,
    };
  }
}

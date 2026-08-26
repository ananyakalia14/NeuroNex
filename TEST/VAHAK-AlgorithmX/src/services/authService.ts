import { getSupabaseClient } from '../lib/supabaseClient';
import { User, UserRole } from '../types';

export const authService = {
  /**
   * Get current Supabase Auth session & user profile
   */
  async getCurrentUser(): Promise<User | null> {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      const { data: { session }, error } = await client.auth.getSession();
      if (error || !session?.user) return null;

      // Try fetching profile from users table
      const { data: profile } = await client
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        return {
          id: profile.id,
          name: profile.name || session.user.email?.split('@')[0] || 'Operator',
          email: profile.email || session.user.email || '',
          role: profile.role as UserRole,
          badgeNumber: profile.badge_number || 'CMD-9941',
          department: profile.department || 'Central Emergency Directorate',
          avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
        };
      }

      return {
        id: session.user.id,
        name: session.user.email?.split('@')[0] || 'Command Officer',
        email: session.user.email || '',
        role: 'dispatcher',
        badgeNumber: 'DSP-4410',
        department: 'Fleet & Medivac Operations',
        avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80',
      };
    } catch {
      return null;
    }
  },

  /**
   * Sign in with Supabase Auth
   */
  async signIn(email: string, password?: string): Promise<{ user: User | null; error: any }> {
    const client = getSupabaseClient();
    if (!client) {
      return { user: null, error: new Error('Supabase client offline') };
    }

    try {
      if (password) {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const user = await this.getCurrentUser();
        return { user, error: null };
      } else {
        // Sign in anonymously / OTP
        const { data, error } = await client.auth.signInWithOtp({ email });
        return { user: null, error };
      }
    } catch (error) {
      return { user: null, error };
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  }
};

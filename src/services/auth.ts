import { supabase } from './supabase';

// Helper function to ensure supabase is initialized
const getSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase client is not initialized.');
  }
  return supabase;
};

export const authService = {
  async signUp(email: string, password: string, name: string, role: 'user' | 'admin' = 'user') {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await getSupabase().auth.getUser();
    return user;
  },

  onAuthStateChange(callback: (user: any) => void) {
    return getSupabase().auth.onAuthStateChange((_event: string, session: { user: any } | null) => {
      callback(session?.user || null);
    });
  }
};

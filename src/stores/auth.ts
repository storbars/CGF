import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Incorrect email or password.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // Add a small delay to allow the user record to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try multiple times to get the user data
      let attempts = 0;
      let userData = null;
      let userError = null;

      while (attempts < 3 && !userData) {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        userData = result.data;
        userError = result.error;

        if (!userData && !userError) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (userError) {
        await supabase.auth.signOut();
        throw new Error('Failed to retrieve user data');
      }

      if (!userData) {
        await supabase.auth.signOut();
        throw new Error('User account not found. Please try again in a few moments.');
      }

      set({ user: userData as User });
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  },
  signUp: async (email: string, password: string) => {
    try {
      // First check if this will be the first user
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error('Failed to check if first user');
      }

      const isFirstUser = count === 0;

      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('password')) {
          throw new Error('Password must be at least 6 characters long.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Registration failed. Please try again.');
      }

      // Add a small delay to ensure the auth user is fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then create the user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          role: isFirstUser ? 'admin' : 'user',
        });

      if (userError) {
        // Clean up the auth user if creating the user record fails
        await supabase.auth.signOut();
        throw new Error('Failed to create user account. Please try again.');
      }

      // Sign out after registration so user can sign in
      await supabase.auth.signOut();
    } catch (error) {
      throw error;
    }
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ user: null });
  },
  checkUser: async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw authError;
      
      if (!session?.user) {
        set({ user: null, loading: false });
        return;
      }

      // Try multiple times to get the user data
      let attempts = 0;
      let userData = null;
      let userError = null;

      while (attempts < 3 && !userData) {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        userData = result.data;
        userError = result.error;

        if (!userData && !userError) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      if (userError) {
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }

      if (!userData) {
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }

      set({
        user: userData as User,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking user:', error);
      set({ user: null, loading: false });
    }
  },
}));
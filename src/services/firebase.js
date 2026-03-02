import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let cachedUser = null;

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const auth = null;
export const googleProvider = null;
export const analytics = null;

const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function toCompatUser(user) {
  if (!user) return null;

  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email ||
    '';

  return {
    ...user,
    uid: user.id,
    displayName,
    photoURL: user.user_metadata?.avatar_url || null,
    emailVerified: Boolean(user.email_confirmed_at),
    async getIdToken(forceRefresh = false) {
      if (!supabase) return null;
      if (forceRefresh) {
        await supabase.auth.refreshSession();
      }
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    },
  };
}

function getSupabaseErrorMessage(error) {
  const message = error?.message || '';
  if (/invalid login credentials/i.test(message)) {
    return 'Invalid email or password. Please check your credentials.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email before signing in.';
  }
  if (/user already registered/i.test(message)) {
    return 'This email is already registered. Please sign in instead.';
  }
  if (/password should be at least/i.test(message)) {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  return message || 'An error occurred. Please try again.';
}

export const firebaseAuthService = {
  signUpWithEmail: async (email, password, displayName) => {
    if (!supabase) {
      return { success: false, error: 'Supabase auth is not configured' };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || '',
          full_name: displayName || '',
        },
      },
    });

    if (error) {
      return { success: false, error: getSupabaseErrorMessage(error) };
    }

    cachedUser = data?.user ? toCompatUser(data.user) : null;
    return { success: true, user: cachedUser };
  },

  signInWithEmail: async (email, password) => {
    if (!supabase) {
      return { success: false, error: 'Supabase auth is not configured' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: getSupabaseErrorMessage(error) };
    }

    cachedUser = data?.user ? toCompatUser(data.user) : null;
    return { success: true, user: cachedUser };
  },

  signInWithGoogle: async () => {
    if (!supabase) {
      return { success: false, error: 'Supabase auth is not configured' };
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      return { success: false, error: getSupabaseErrorMessage(error) };
    }

    // Supabase may redirect automatically depending on environment.
    if (data?.url && typeof window !== 'undefined') {
      window.location.assign(data.url);
    }

    return { success: true, user: null };
  },

  signOut: async () => {
    if (!supabase) return { success: true };
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: getSupabaseErrorMessage(error) };
    }
    cachedUser = null;
    return { success: true };
  },

  resetPassword: async (email) => {
    if (!supabase) {
      return { success: false, error: 'Supabase auth is not configured' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
    });

    if (error) {
      return { success: false, error: getSupabaseErrorMessage(error) };
    }
    return { success: true };
  },

  updateUserProfile: async (updates) => {
    if (!supabase) {
      return { success: false, error: 'Supabase auth is not configured' };
    }

    const metadata = {};
    if (updates.displayName !== undefined) metadata.display_name = updates.displayName;
    if (updates.photoURL !== undefined) metadata.avatar_url = updates.photoURL;

    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    if (error) {
      return { success: false, error: getSupabaseErrorMessage(error) };
    }

    cachedUser = data?.user ? toCompatUser(data.user) : cachedUser;
    return { success: true };
  },

  getCurrentUser: () => cachedUser,

  onAuthStateChange: (callback) => {
    if (!supabase) {
      callback(null);
      return () => {};
    }

    supabase.auth.getSession().then(({ data }) => {
      cachedUser = data?.session?.user ? toCompatUser(data.session.user) : null;
      callback(cachedUser);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      cachedUser = session?.user ? toCompatUser(session.user) : null;
      callback(cachedUser);
    });

    return () => subscription.unsubscribe();
  },

  getUserToken: async (forceRefresh = false) => {
    if (!supabase) return null;
    if (forceRefresh) {
      await supabase.auth.refreshSession();
    }
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || null;
  },
};

export { supabase };

export default supabase;

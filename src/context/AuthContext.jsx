import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { authApi } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const syncMe = async () => {
      try {
        const me = await authApi.me();
        if (!alive) return;
        setProfile(me.profile || null);
      } catch {
        if (!alive) return;
        setProfile(null);
      }
    };

    const SESSION_INIT_MS = 12_000;
    const withTimeout = (promise, ms, label) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} timed out`)), ms)
        ),
      ]);

    // Get initial session — never block the UI on /auth/me or a hung client
    withTimeout(supabase.auth.getSession(), SESSION_INIT_MS, "getSession")
      .then(async ({ data, error }) => {
        if (!alive) return;
        if (error) {
          console.warn("[Auth] getSession:", error.message);
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setSession(data.session);
        setUser(data.session?.user || null);
        // Show the app immediately; profile sync can lag or fail if API is down
        setLoading(false);
        if (data.session) void syncMe();
      })
      .catch((err) => {
        console.warn("[Auth] session init failed:", err?.message || err);
        if (!alive) return;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        if (!session) setProfile(null);
        if (session) void syncMe();
      }
    );

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const register = async (email, password, full_name) => {
    const data = await authApi.register({ email, password, full_name });
    setUser(data.user);
    setSession(data.session);
    setProfile(data.profile);
    // Sync supabase client session
    if (data.session?.access_token && data.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }
    return data;
  };

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    setSession(data.session);
    setProfile(data.profile);
    if (data.session?.access_token && data.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }
    return data;
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = (updates) => {
    setProfile(p => ({ ...p, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, session, loading,
      register, login, logout, updateProfile,
      isAdmin: profile?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

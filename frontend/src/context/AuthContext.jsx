import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as data from '../lib/data.js';
import { ApiError } from '../lib/api.js';

// Holds the signed-in user for the whole app. In demo mode this uses the local demo
// session; otherwise it talks to the backend. The token lives in localStorage (the
// httpOnly cookie set by the server is used automatically by the browser).
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on first load.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await data.userApi.profile();
        if (mounted) setUser(res.user);
      } catch (err) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await data.authApi.login({ email, password });
    if (res.token) data.tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (payload) => {
    const res = await data.authApi.register(payload);
    if (res.token) data.tokenStore.set(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await data.authApi.logout();
    } finally {
      data.tokenStore.clear();
      setUser(null);
    }
  };

  const refresh = async () => {
    const res = await data.userApi.profile();
    setUser(res.user);
    return res.user;
  };

  const value = useMemo(
    () => ({ user, loading, isAuthed: Boolean(user), login, register, logout, refresh, setUser }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}

export { ApiError };
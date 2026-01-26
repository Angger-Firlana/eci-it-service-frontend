import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiRequest, parseApiError, AUTH_LOGOUT_EVENT } from '../lib/api';
import {
  clearAuthStorage,
  readAuthStorage,
  writeAuthStorage,
} from '../lib/authStorage';

const AuthContext = createContext({
  user: null,
  token: null,
  loading: false,
  error: '',
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

const getStoredAuth = () => {
  const stored = readAuthStorage();
  if (!stored?.token) return null;
  return stored;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const persist = useCallback((nextUser, nextToken) => {
    if (!nextToken) {
      clearAuthStorage();
      return;
    }
    writeAuthStorage({ user: nextUser, token: nextToken });
  }, []);

  const hydrate = useCallback(async () => {
    const stored = getStoredAuth();
    if (!stored) {
      setLoading(false);
      return;
    }

    setUser(stored.user || null);
    setToken(stored.token || null);

    try {
      const res = await apiRequest('/auth/me', {
        method: 'GET',
        token: stored.token,
      });
      if (res.ok && res.data?.success !== false) {
        const payload = res.data?.data || res.data;
        if (payload?.id) {
          setUser(payload);
          persist(payload, stored.token);
        }
      } else {
        clearAuthStorage();
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      clearAuthStorage();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
      setError('');
      clearAuthStorage();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogoutEvent);
      }
    };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError('');
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (!res.ok || res.data?.success === false) {
      throw new Error(parseApiError(res.data, 'Login gagal.'));
    }

    const payload = res.data?.data || res.data;
    if (!payload?.token || !payload?.user) {
      throw new Error('Response login tidak lengkap.');
    }

    setUser(payload.user);
    setToken(payload.token);
    persist(payload.user, payload.token);
    return payload.user;
  }, [persist]);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token,
        });
      }
    } catch (err) {
      // Ignore logout errors.
    } finally {
      setUser(null);
      setToken(null);
      setError('');
      clearAuthStorage();
    }
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) return null;
    const res = await apiRequest('/auth/me', { method: 'GET', token });
    if (!res.ok || res.data?.success === false) {
      throw new Error(parseApiError(res.data, 'Gagal memuat profil.'));
    }
    const payload = res.data?.data || res.data;
    if (payload?.id) {
      setUser(payload);
      persist(payload, token);
    }
    return payload;
  }, [persist, token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      error,
      login,
      logout,
      refresh,
    }),
    [user, token, loading, error, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

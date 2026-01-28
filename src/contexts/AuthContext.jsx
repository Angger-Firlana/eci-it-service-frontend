import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * @typedef {Object} AuthContextValue
 * @property {string | null} token
 * @property {any} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoading
 * @property {(value: boolean) => void} setIsLoading
 * @property {(authToken: string, userData: any) => void} login
 * @property {() => void} logout
 */

/** @type {import('react').Context<AuthContextValue | null>} */
const AuthContext = createContext(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback((authToken, userData) => {
    localStorage.setItem(TOKEN_KEY, authToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  const value = {
    token,
    user,
    isAuthenticated,
    isLoading,
    setIsLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** @returns {AuthContextValue} */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

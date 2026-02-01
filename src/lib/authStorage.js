const STORAGE_KEY = 'eci-it-service-auth';

export const readAuthStorage = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    return null;
  }
};

export const writeAuthStorage = (payload) => {
  if (typeof window === 'undefined') return;
  if (!payload) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getStoredToken = () => {
  const stored = readAuthStorage();
  return stored?.token || null;
};

export const getStoredUser = () => {
  const stored = readAuthStorage();
  return stored?.user || null;
};

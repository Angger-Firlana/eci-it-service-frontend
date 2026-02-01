const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }

  if (user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

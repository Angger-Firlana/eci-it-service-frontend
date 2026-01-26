import { clearAuthStorage, getStoredToken } from './authStorage';

export const AUTH_LOGOUT_EVENT = 'eci-auth-logout';
const REQUEST_CACHE = new Map();

const getCachedResponse = (key, staleTimeMs) => {
  if (!key) return null;
  const entry = REQUEST_CACHE.get(key);
  if (!entry) return null;
  if (typeof staleTimeMs === 'number' && staleTimeMs >= 0) {
    if (Date.now() - entry.ts > staleTimeMs) {
      REQUEST_CACHE.delete(key);
      return null;
    }
  }
  return entry.value;
};

export const clearRequestCache = (keyPrefix = '') => {
  if (!keyPrefix) {
    REQUEST_CACHE.clear();
    return;
  }
  Array.from(REQUEST_CACHE.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      REQUEST_CACHE.delete(key);
    }
  });
};

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, '');

const resolveBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const { origin, port } = window.location;
    if (origin && port && port !== '5173') {
      return `${origin}/api`;
    }
  }

  return 'http://localhost:8000/api';
};

export const API_BASE_URL = normalizeBaseUrl(resolveBaseUrl());

export const buildApiUrl = (path = '') => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const unwrapApiData = (payload) => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

export const apiRequest = async (path, options = {}) => {
  const {
    method = 'GET',
    body,
    token,
    headers,
    cacheKey,
    staleTime,
    skipCache,
  } = options;

  if (method === 'GET' && cacheKey && !skipCache) {
    const cached = getCachedResponse(cacheKey, staleTime);
    if (cached) {
      return cached;
    }
  }

  const requestHeaders = { ...(headers || {}) };
  const requestOptions = { method, headers: requestHeaders };

  const resolvedToken = token || getStoredToken();
  if (resolvedToken) {
    requestHeaders.Authorization = `Bearer ${resolvedToken}`;
  }

  if (body instanceof FormData) {
    requestOptions.body = body;
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    requestOptions.body = JSON.stringify(body);
  }

  requestHeaders.Accept = 'application/json';

  const response = await fetch(buildApiUrl(path), requestOptions);
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  const result = { ok: response.ok, status: response.status, data };

  if (response.status === 401) {
    clearAuthStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
    }
  }

  if (method === 'GET' && cacheKey && response.ok) {
    REQUEST_CACHE.set(cacheKey, { ts: Date.now(), value: result });
  }

  return result;
};

export const parseApiError = (payload, fallback = 'Request gagal.') => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;
  if (payload.message) return payload.message;
  if (payload.errors) {
    try {
      return JSON.stringify(payload.errors);
    } catch (error) {
      return fallback;
    }
  }
  return fallback;
};

export const unwrapApiMeta = (payload) => {
  if (!payload || typeof payload !== 'object') return null;
  if (payload.meta && typeof payload.meta === 'object') {
    return payload.meta;
  }
  const hasPaginationKeys =
    'current_page' in payload &&
    'last_page' in payload &&
    'per_page' in payload &&
    'total' in payload;
  if (hasPaginationKeys) {
    return {
      current_page: payload.current_page,
      last_page: payload.last_page,
      per_page: payload.per_page,
      total: payload.total,
      from: payload.from,
      to: payload.to,
    };
  }
  return null;
};

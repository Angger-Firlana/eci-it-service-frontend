import { getStoredToken } from './authStorage';

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
  const { method = 'GET', body, token, headers, signal } = options;
  const requestHeaders = { ...(headers || {}) };
  const requestOptions = { method, headers: requestHeaders };

  if (signal) {
    requestOptions.signal = signal;
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (body instanceof FormData) {
    requestOptions.body = body;
  } else if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(buildApiUrl(path), requestOptions);
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { ok: response.ok, status: response.status, data };
};

let onUnauthorizedCallback = null;

export const setUnauthorizedHandler = (callback) => {
  onUnauthorizedCallback = callback;
};

export const authenticatedRequest = async (path, options = {}) => {
  const token = getStoredToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await apiRequest(path, { ...options, token });

  if (response.status === 401) {
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new Error('Unauthorized');
  }

  return response;
};

export const parseApiError = (payload, fallback = 'Terjadi kesalahan pada server.') => {
  if (!payload) return fallback;
  if (typeof payload === 'string') return payload;

  if (payload.errors && typeof payload.errors === 'object') {
    const messages = Object.values(payload.errors).flat();
    if (messages.length > 0) return messages.join(' ');
  }

  return payload.message || payload.error || fallback;
};

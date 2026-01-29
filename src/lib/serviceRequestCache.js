import { authenticatedRequest } from './api';

const safeParseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getCacheOwnerId = () => {
  if (typeof window === 'undefined') return 'server';
  const stored = safeParseJson(window.localStorage.getItem('auth_user'));
  return stored?.id ?? 'anonymous';
};

const DETAIL_TTL_MS = 30_000;
const LOCATIONS_TTL_MS = 30_000;
const COSTS_TOTAL_TTL_MS = 30_000;

const buildKey = (namespace, id) => `${getCacheOwnerId()}:${namespace}:${String(id)}`;

const getValidCache = (cache, key, ttlMs) => {
  const cached = cache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.ts > ttlMs) {
    cache.delete(key);
    return null;
  }
  return cached.data;
};

const setCache = (cache, key, data) => {
  cache.set(key, { ts: Date.now(), data });
};

const detailCache = new Map();
const locationsCache = new Map();
const costsTotalCache = new Map();

const normalizeArrayPayload = (payload) => {
  const data = payload?.data || payload;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};

export const getServiceRequestDetailCached = async (id, options = {}) => {
  if (!id) return null;
  const { signal, ttlMs = DETAIL_TTL_MS } = options;
  const key = buildKey('service-request:detail', id);

  const cached = getValidCache(detailCache, key, ttlMs);
  if (cached) return cached;

  const res = await authenticatedRequest(`/service-requests/${id}`, { signal });
  if (!res.ok) {
    const message = res.data?.message || 'Failed to fetch service request detail';
    throw new Error(message);
  }

  const detail = res.data?.data || res.data;
  setCache(detailCache, key, detail);
  return detail;
};

export const getServiceRequestLocationsCached = async (id, options = {}) => {
  if (!id) return [];
  const { signal, ttlMs = LOCATIONS_TTL_MS } = options;
  const key = buildKey('service-request:locations', id);

  const cached = getValidCache(locationsCache, key, ttlMs);
  if (cached) return cached;

  const res = await authenticatedRequest(`/service-requests/${id}/locations`, { signal });
  const list = res.ok ? normalizeArrayPayload(res.data) : [];
  setCache(locationsCache, key, list);
  return list;
};

export const getServiceRequestCostsTotalCached = async (id, options = {}) => {
  if (!id) return 0;
  const { signal, ttlMs = COSTS_TOTAL_TTL_MS } = options;
  const key = buildKey('service-request:costs-total', id);

  const cached = getValidCache(costsTotalCache, key, ttlMs);
  if (cached !== null && cached !== undefined) return cached;

  const res = await authenticatedRequest(`/service-requests/${id}/costs`, { signal });
  const list = res.ok ? normalizeArrayPayload(res.data) : [];
  const total = list.reduce((sum, item) => sum + Number(item?.amount || 0), 0);
  setCache(costsTotalCache, key, total);
  return total;
};

export const invalidateServiceRequestCache = (id) => {
  if (!id) return;
  const owner = getCacheOwnerId();
  detailCache.delete(`${owner}:service-request:detail:${String(id)}`);
  locationsCache.delete(`${owner}:service-request:locations:${String(id)}`);
  costsTotalCache.delete(`${owner}:service-request:costs-total:${String(id)}`);
};

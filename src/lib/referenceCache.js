import { authenticatedRequest, unwrapApiData } from './api';

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

const TTL_MS = 60_000;

const cache = new Map();

const buildKey = (key) => `${getCacheOwnerId()}:${key}`;

const getValid = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setValid = (key, data) => {
  cache.set(key, { ts: Date.now(), data });
};

const normalizePaginated = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
};

export const getStatusesCached = async (options = {}) => {
  const { entityTypeId } = options;
  const params = new URLSearchParams();
  if (entityTypeId) params.set('entity_type_id', String(entityTypeId));

  const key = buildKey(`statuses:${params.toString() || 'all'}`);
  const cached = getValid(key);
  if (cached) return cached;

  const res = await authenticatedRequest(
    `/references/statuses${params.toString() ? `?${params.toString()}` : ''}`
  );
  if (!res.ok) {
    throw new Error(res.data?.message || 'Failed to fetch statuses');
  }

  const list = Array.isArray(unwrapApiData(res.data)) ? unwrapApiData(res.data) : [];
  setValid(key, list);
  return list;
};

export const getStatusMapsCached = async (options = {}) => {
  const statuses = await getStatusesCached(options);

  const byId = new Map();
  const byCode = new Map();

  for (const status of statuses) {
    if (!status?.id) continue;
    byId.set(Number(status.id), status);
    if (status.code) byCode.set(String(status.code), status);
  }

  return { byId, byCode, list: statuses };
};

export const getCostTypesCached = async () => {
  const key = buildKey('cost-types');
  const cached = getValid(key);
  if (cached) return cached;

  const res = await authenticatedRequest('/cost-types');
  if (!res.ok) {
    throw new Error(res.data?.message || 'Failed to fetch cost types');
  }

  const list = Array.isArray(unwrapApiData(res.data)) ? unwrapApiData(res.data) : [];
  setValid(key, list);
  return list;
};

export const getVendorsCached = async () => {
  const key = buildKey('vendors');
  const cached = getValid(key);
  if (cached) return cached;

  const res = await authenticatedRequest('/vendors?per_page=200');
  if (!res.ok) {
    throw new Error(res.data?.message || 'Failed to fetch vendors');
  }

  const list = normalizePaginated(res.data);
  setValid(key, list);
  return list;
};

import { authenticatedRequest, unwrapApiData, parseApiError } from './api';

const CACHE_TTL_MS = 5 * 60 * 1000;

const readCache = (key) => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch (error) {
    return null;
  }
};

const writeCache = (key, data) => {
  if (typeof window === 'undefined') return;
  const safeData = Array.isArray(data) ? data : [];
  window.localStorage.setItem(
    key,
    JSON.stringify({
      ts: Date.now(),
      data: safeData,
    })
  );
};

const fetchList = async (path, cacheKey) => {
  const cached = cacheKey ? readCache(cacheKey) : null;
  if (cached?.length) return cached;

  const res = await authenticatedRequest(path);
  if (!res.ok || res.data?.success === false) {
    throw new Error(parseApiError(res.data, 'Gagal mengambil data.'));
  }

  const payload = unwrapApiData(res.data);
  const list = Array.isArray(payload) ? payload : [];
  if (cacheKey) {
    writeCache(cacheKey, list);
  }
  return list;
};

export const fetchServiceTypes = () =>
  fetchList('/references/service-types', 'eci-ref-service-types');

export const fetchRoles = () =>
  fetchList('/references/roles', 'eci-ref-roles');

export const fetchDepartments = () =>
  fetchList('/references/departments', 'eci-ref-departments');

export const fetchVendors = () =>
  fetchList('/references/vendors', 'eci-ref-vendors');

export const fetchStatuses = () =>
  fetchList('/references/statuses', 'eci-ref-statuses');

export const fetchDeviceTypes = () =>
  fetchList('/device-type', 'eci-ref-device-types');

export const fetchDeviceModels = () =>
  fetchList('/device-model', 'eci-ref-device-models');

export const fetchDevices = async () =>
  fetchList('/devices?per_page=200', 'eci-ref-devices');

export const fetchUsers = async (query = '') => {
  const cacheKey = query ? `eci-ref-users:${query}` : 'eci-ref-users';
  return fetchList(`/users${query ? `?${query}` : ''}`, cacheKey);
};

export const clearReferenceCache = (keyPrefix = 'eci-ref-') => {
  if (typeof window === 'undefined') return;
  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(keyPrefix))
    .forEach((key) => window.localStorage.removeItem(key));
};

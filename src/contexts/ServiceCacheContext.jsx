import { createContext, useContext, useState, useCallback } from 'react';

const ServiceCacheContext = createContext(null);

const safeParseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const getCurrentCacheOwnerId = () => {
  if (typeof window === 'undefined') return null;
  const stored = safeParseJson(localStorage.getItem('auth_user'));
  return stored?.id ?? null;
};

export const ServiceCacheProvider = ({ children }) => {
  const [serviceListCache, setServiceListCache] = useState(null);
  const [serviceListMeta, setServiceListMeta] = useState(null);
  const [masterDataCache, setMasterDataCache] = useState(null);
  const [calendarCache, setCalendarCache] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [masterDataLastFetch, setMasterDataLastFetch] = useState(null);
  const [calendarLastFetch, setCalendarLastFetch] = useState(null);
  const [serviceListOwnerId, setServiceListOwnerId] = useState(null);
  const [masterDataOwnerId, setMasterDataOwnerId] = useState(null);
  const [calendarOwnerId, setCalendarOwnerId] = useState(null);

  const updateCache = useCallback((services, meta) => {
    setServiceListCache(services);
    if (meta) {
      setServiceListMeta(meta);
    }
    setLastFetch(Date.now());
    setServiceListOwnerId(getCurrentCacheOwnerId());
  }, []);

  const clearCache = useCallback(() => {
    setServiceListCache(null);
    setServiceListMeta(null);
    setLastFetch(null);
    setServiceListOwnerId(null);
  }, []);

  const updateCalendarCache = useCallback((services) => {
    setCalendarCache(services);
    setCalendarLastFetch(Date.now());
    setCalendarOwnerId(getCurrentCacheOwnerId());
  }, []);

  const isCalendarCacheValid = useCallback((maxAge = 5 * 60 * 1000) => {
    if (!calendarLastFetch) return false;
    const ownerId = getCurrentCacheOwnerId();
    if (!ownerId || ownerId !== calendarOwnerId) return false;
    return Date.now() - calendarLastFetch < maxAge;
  }, [calendarLastFetch, calendarOwnerId]);

  const updateMasterDataCache = useCallback((payload) => {
    setMasterDataCache(payload);
    setMasterDataLastFetch(Date.now());
    setMasterDataOwnerId(getCurrentCacheOwnerId());
  }, []);

  const isMasterDataCacheValid = useCallback((maxAge = 60 * 60 * 1000) => {
    if (!masterDataLastFetch) return false;
    const ownerId = getCurrentCacheOwnerId();
    if (!ownerId || ownerId !== masterDataOwnerId) return false;
    return Date.now() - masterDataLastFetch < maxAge;
  }, [masterDataLastFetch, masterDataOwnerId]);

  const isCacheValid = useCallback((maxAge = 5 * 60 * 1000) => {
    if (!lastFetch) return false;
    const ownerId = getCurrentCacheOwnerId();
    if (!ownerId || ownerId !== serviceListOwnerId) return false;
    return Date.now() - lastFetch < maxAge;
  }, [lastFetch, serviceListOwnerId]);

  const value = {
    serviceListCache,
    serviceListMeta,
    masterDataCache,
    calendarCache,
    updateCache,
    clearCache,
    updateMasterDataCache,
    updateCalendarCache,
    isCacheValid,
    isMasterDataCacheValid,
    isCalendarCacheValid,
  };

  return (
    <ServiceCacheContext.Provider value={value}>
      {children}
    </ServiceCacheContext.Provider>
  );
};

export const useServiceCache = () => {
  const context = useContext(ServiceCacheContext);
  if (!context) {
    throw new Error('useServiceCache must be used within ServiceCacheProvider');
  }
  return context;
};

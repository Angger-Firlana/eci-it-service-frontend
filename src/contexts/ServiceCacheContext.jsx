import { createContext, useContext, useState, useCallback } from 'react';

const ServiceCacheContext = createContext(null);

export const ServiceCacheProvider = ({ children }) => {
  const [serviceListCache, setServiceListCache] = useState(null);
  const [serviceListMeta, setServiceListMeta] = useState(null);
  const [masterDataCache, setMasterDataCache] = useState(null);
  const [calendarCache, setCalendarCache] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [masterDataLastFetch, setMasterDataLastFetch] = useState(null);
  const [calendarLastFetch, setCalendarLastFetch] = useState(null);

  const updateCache = useCallback((services, meta) => {
    setServiceListCache(services);
    if (meta) {
      setServiceListMeta(meta);
    }
    setLastFetch(Date.now());
  }, []);

  const clearCache = useCallback(() => {
    setServiceListCache(null);
    setServiceListMeta(null);
    setLastFetch(null);
  }, []);

  const updateCalendarCache = useCallback((services) => {
    setCalendarCache(services);
    setCalendarLastFetch(Date.now());
  }, []);

  const isCalendarCacheValid = useCallback((maxAge = 5 * 60 * 1000) => {
    if (!calendarLastFetch) return false;
    return Date.now() - calendarLastFetch < maxAge;
  }, [calendarLastFetch]);

  const updateMasterDataCache = useCallback((payload) => {
    setMasterDataCache(payload);
    setMasterDataLastFetch(Date.now());
  }, []);

  const isMasterDataCacheValid = useCallback((maxAge = 60 * 60 * 1000) => {
    if (!masterDataLastFetch) return false;
    return Date.now() - masterDataLastFetch < maxAge;
  }, [masterDataLastFetch]);

  const isCacheValid = useCallback((maxAge = 5 * 60 * 1000) => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < maxAge;
  }, [lastFetch]);

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

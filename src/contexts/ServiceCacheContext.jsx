import { createContext, useContext, useState, useCallback } from 'react';

const ServiceCacheContext = createContext(null);

export const ServiceCacheProvider = ({ children }) => {
  const [serviceListCache, setServiceListCache] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const updateCache = useCallback((services) => {
    setServiceListCache(services);
    setLastFetch(Date.now());
  }, []);

  const clearCache = useCallback(() => {
    setServiceListCache(null);
    setLastFetch(null);
  }, []);

  const isCacheValid = useCallback((maxAge = 5 * 60 * 1000) => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch < maxAge;
  }, [lastFetch]);

  const value = {
    serviceListCache,
    updateCache,
    clearCache,
    isCacheValid,
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

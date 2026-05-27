import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { activitiesService } from '../services/activities.service';

const ActivitiesContext = createContext(null);

export const ActivitiesProvider = ({ children }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [lastFetchParams, setLastFetchParams] = useState({ page: 1, limit: 20 });
  const [cache, setCache] = useState(new Map());

  const fetchActivities = useCallback(async (page = 1, limit = 20, forceRefresh = false) => {
    const cacheKey = `${page}-${limit}`;
    
    // Si no es forzado y tenemos datos en cache, usarlos
    if (!forceRefresh && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      setActivities(cached.activities);
      setPagination(cached.pagination);
      setLoading(false);
      return cached;
    }

    try {
      setLoading(true);
      const data = await activitiesService.getActivities(page, limit);
      const activitiesData = Array.isArray(data.activities) ? data.activities : [];
      
      setActivities(activitiesData);
      setPagination(data.pagination || null);
      setLastFetchParams({ page, limit });
      setError(null);
      
      // Guardar en cache
      setCache(prev => new Map(prev).set(cacheKey, { activities: activitiesData, pagination: data.pagination }));
      
      return { activities: activitiesData, pagination: data.pagination };
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const refetch = useCallback(() => {
    // Limpiar cache y volver a fetch
    setCache(new Map());
    return fetchActivities(lastFetchParams.page, lastFetchParams.limit, true);
  }, [fetchActivities, lastFetchParams]);

  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);

  const value = {
    activities,
    loading,
    error,
    pagination,
    fetchActivities,
    refetch,
    clearCache,
    lastFetchParams
  };

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
};

export const useActivitiesContext = () => {
  const context = useContext(ActivitiesContext);
  if (!context) {
    throw new Error('useActivitiesContext must be used within ActivitiesProvider');
  }
  return context;
};

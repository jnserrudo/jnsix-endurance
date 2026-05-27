import { useState, useEffect } from 'react';
import { activitiesService } from '../services/activities.service';

export const useActivities = (page = 1, limit = 20) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await activitiesService.getActivities(page, limit);
      setActivities(Array.isArray(data.activities) ? data.activities : []);
      setPagination(data.pagination || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, limit]);

  return { activities, loading, error, pagination, refetch: fetchActivities };
};

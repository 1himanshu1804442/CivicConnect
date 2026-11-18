import { useState, useEffect, useCallback } from 'react';
import { fetchComplaints, upvoteComplaint } from '../services/api';

/**
 * Custom React Hook to manage complaint data lifecycle
 * 
 * Why this is extracted:
 * - Separates data fetching and state synchronization from UI rendering.
 * - Makes testing and component re-use straightforward.
 * - Provides consistent error logging and toast-ready notification states.
 */
export const useComplaints = (initialFilters = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchComplaints(filters);
      setComplaints(data);
    } catch (err) {
      console.error('[useComplaints] Failed to fetch complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpvote = async (id) => {
    try {
      const updated = await upvoteComplaint(id);
      setComplaints(prev => prev.map(c => c.id === id ? updated : c));
    } catch (err) {
      console.error(`[useComplaints] Error upvoting complaint ${id}:`, err);
    }
  };

  return {
    complaints,
    loading,
    error,
    filters,
    setFilters,
    reload: loadData,
    handleUpvote
  };
};

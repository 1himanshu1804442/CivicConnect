import { useState, useEffect, useCallback } from 'react';
import { fetchComplaints, upvoteComplaint } from '../services/api';

/**
 * Custom React Hook to manage complaint data lifecycle
 * 
 * Why this is extracted:
 * - Separates data fetching and state synchronization from UI rendering.
 * - Makes testing and component re-use straightforward.
 * - Provides consistent error logging and toast-ready notification states.
 * - Tracks which complaints a user has already upvoted (via localStorage)
 *   to prevent unlimited duplicate votes.
 */

// Helper to read the set of already-upvoted complaint IDs from localStorage
const getUpvotedIds = () => {
  try {
    const raw = localStorage.getItem('civicconnect_upvoted_ids');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

// Helper to persist the set of upvoted IDs to localStorage
const saveUpvotedIds = (idSet) => {
  try {
    localStorage.setItem('civicconnect_upvoted_ids', JSON.stringify([...idSet]));
  } catch (err) {
    console.warn('[useComplaints] Could not persist upvoted IDs:', err);
  }
};

export const useComplaints = (initialFilters = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track which complaint IDs this user has already voted on
  const [upvotedIds, setUpvotedIds] = useState(() => getUpvotedIds());

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

  /**
   * Upvote a complaint — but only once per user session.
   * 
   * Why: Without this guard, clicking the upvote button repeatedly
   * would increment the count every time, which is unfair and unrealistic.
   * We track upvoted IDs in localStorage so the restriction persists
   * across page refreshes.
   * 
   * @param {string|number} id - The complaint ID to upvote
   * @returns {boolean} Whether the upvote succeeded (false if already voted)
   */
  const handleUpvote = async (id) => {
    // Prevent duplicate votes: check if this complaint was already upvoted
    if (upvotedIds.has(id) || upvotedIds.has(String(id))) {
      console.info(`[useComplaints] User already upvoted complaint ${id}. Ignoring duplicate vote.`);
      return false;
    }

    try {
      const updated = await upvoteComplaint(id);
      setComplaints(prev => prev.map(c => c.id === id ? updated : c));

      // Record this complaint as upvoted so the user can't vote again
      const newUpvotedIds = new Set(upvotedIds);
      newUpvotedIds.add(id);
      newUpvotedIds.add(String(id)); // Store both forms for safety
      setUpvotedIds(newUpvotedIds);
      saveUpvotedIds(newUpvotedIds);

      return true;
    } catch (err) {
      console.error(`[useComplaints] Error upvoting complaint ${id}:`, err);
      return false;
    }
  };

  /**
   * Check whether a specific complaint has already been upvoted by this user.
   * Used by the UI to disable or visually mark the upvote button.
   */
  const hasUpvoted = (id) => {
    return upvotedIds.has(id) || upvotedIds.has(String(id));
  };

  return {
    complaints,
    loading,
    error,
    filters,
    setFilters,
    reload: loadData,
    handleUpvote,
    hasUpvoted
  };
};

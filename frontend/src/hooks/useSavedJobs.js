/**
 * Custom React Hook for managing saved jobs
 * Provides real-time state management with localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getSavedJobs,
  saveJob,
  removeJob,
  isJobSaved,
  toggleSaveJob,
  getSavedJobsCount
} from '../utils/savedJobsStorage';

/**
 * Hook to manage saved jobs state
 * @returns {Object} Saved jobs state and methods
 */
export const useSavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load saved jobs on mount
  useEffect(() => {
    const jobs = getSavedJobs();
    setSavedJobs(jobs);
    setLoading(false);
  }, []);

  // Handle saving a job
  const handleSaveJob = useCallback((job) => {
    const success = saveJob(job);
    if (success) {
      setSavedJobs(prev => [...prev, job]);
      return true;
    }
    return false;
  }, []);

  // Handle removing a job
  const handleRemoveJob = useCallback((jobId) => {
    const success = removeJob(jobId);
    if (success) {
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
      return true;
    }
    return false;
  }, []);

  // Handle toggling save status
  const handleToggleSaveJob = useCallback((job) => {
    if (isJobSaved(job._id)) {
      return handleRemoveJob(job._id);
    } else {
      return handleSaveJob(job);
    }
  }, [handleSaveJob, handleRemoveJob]);

  // Check if a specific job is saved
  const isSaved = useCallback((jobId) => {
    return isJobSaved(jobId);
  }, []);

  // Get saved jobs count
  const getSavedCount = useCallback(() => {
    return getSavedJobsCount();
  }, []);

  return {
    savedJobs,
    loading,
    handleSaveJob,
    handleRemoveJob,
    handleToggleSaveJob,
    isSaved,
    getSavedCount
  };
};

/**
 * Saved Jobs / Wishlist utility functions
 * Manages saved jobs in localStorage with helper functions
 */

const STORAGE_KEY = 'jobPortal_savedJobs';

/**
 * Get all saved jobs from localStorage
 * @returns {Array} Array of saved job objects
 */
export const getSavedJobs = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading saved jobs from localStorage:', error);
    return [];
  }
};

/**
 * Save a job to the wishlist
 * @param {Object} job - Job object to save
 * @returns {boolean} Success status
 */
export const saveJob = (job) => {
  try {
    if (!job || !job._id) {
      console.error('Invalid job object. Must have _id property.');
      return false;
    }

    const savedJobs = getSavedJobs();
    
    // Prevent duplicates
    if (savedJobs.some(j => j._id === job._id)) {
      console.warn(`Job ${job._id} is already saved.`);
      return false;
    }

    savedJobs.push(job);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
    return true;
  } catch (error) {
    console.error('Error saving job to localStorage:', error);
    return false;
  }
};

/**
 * Remove a job from the wishlist
 * @param {string} jobId - ID of the job to remove
 * @returns {boolean} Success status
 */
export const removeJob = (jobId) => {
  try {
    if (!jobId) {
      console.error('Job ID is required to remove a job.');
      return false;
    }

    const savedJobs = getSavedJobs();
    const filteredJobs = savedJobs.filter(job => job._id !== jobId);

    if (filteredJobs.length === savedJobs.length) {
      console.warn(`Job ${jobId} not found in saved jobs.`);
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredJobs));
    return true;
  } catch (error) {
    console.error('Error removing job from localStorage:', error);
    return false;
  }
};

/**
 * Check if a job is saved
 * @param {string} jobId - ID of the job to check
 * @returns {boolean} Whether the job is saved
 */
export const isJobSaved = (jobId) => {
  try {
    const savedJobs = getSavedJobs();
    return savedJobs.some(job => job._id === jobId);
  } catch (error) {
    console.error('Error checking if job is saved:', error);
    return false;
  }
};

/**
 * Toggle save status of a job
 * @param {Object} job - Job object
 * @returns {boolean} New saved state
 */
export const toggleSaveJob = (job) => {
  if (isJobSaved(job._id)) {
    removeJob(job._id);
    return false;
  } else {
    saveJob(job);
    return true;
  }
};

/**
 * Clear all saved jobs
 * @returns {boolean} Success status
 */
export const clearAllSavedJobs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing saved jobs:', error);
    return false;
  }
};

/**
 * Get count of saved jobs
 * @returns {number} Number of saved jobs
 */
export const getSavedJobsCount = () => {
  return getSavedJobs().length;
};

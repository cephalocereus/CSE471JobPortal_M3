/**
 * LocalStorage SavedJobs / Wishlist Page
 * Displays all jobs saved in localStorage with filtering and management options
 */

import React, { useState, useEffect } from 'react';
import { getSavedJobs, removeJob, clearAllSavedJobs } from '../utils/savedJobsStorage';
import '../styles/LocalStorageSavedJobs.css';

const LocalStorageSavedJobs = ({ onApplyClick }) => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJobType, setFilterJobType] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);

  // Load saved jobs from localStorage
  useEffect(() => {
    const jobs = getSavedJobs();
    setSavedJobs(jobs);
    setLoading(false);
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...savedJobs];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.location?.toLowerCase().includes(term) ||
        job.description?.toLowerCase().includes(term)
      );
    }

    // Job type filter
    if (filterJobType) {
      filtered = filtered.filter(job => job.jobType === filterJobType);
    }

    // Sorting
    if (sortBy === 'salary-high') {
      filtered.sort((a, b) => {
        const salaryA = parseInt(a.salary?.replace(/\D/g, '') || 0);
        const salaryB = parseInt(b.salary?.replace(/\D/g, '') || 0);
        return salaryB - salaryA;
      });
    } else if (sortBy === 'salary-low') {
      filtered.sort((a, b) => {
        const salaryA = parseInt(a.salary?.replace(/\D/g, '') || 0);
        const salaryB = parseInt(b.salary?.replace(/\D/g, '') || 0);
        return salaryA - salaryB;
      });
    } else if (sortBy === 'recent') {
      // Already in most recent order (last saved is at the end)
      filtered.reverse();
    }

    setFilteredJobs(filtered);
  }, [savedJobs, searchTerm, filterJobType, sortBy]);

  /**
   * Handle removing a job from saved
   */
  const handleRemoveJob = (jobId) => {
    const success = removeJob(jobId);
    if (success) {
      setSavedJobs(prev => prev.filter(job => job._id !== jobId));
    }
  };

  /**
   * Handle clearing all saved jobs
   */
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all saved jobs?')) {
      clearAllSavedJobs();
      setSavedJobs([]);
    }
  };

  if (loading) {
    return (
      <div className="saved-jobs-container">
        <div className="loading">Loading saved jobs...</div>
      </div>
    );
  }

  return (
    <div className="saved-jobs-container">
      <div className="saved-jobs-header">
        <h1>💾 My Saved Jobs</h1>
        <p className="saved-count">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Controls */}
      <div className="saved-jobs-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search saved jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterJobType}
            onChange={(e) => setFilterJobType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="salary-high">Salary: High to Low</option>
            <option value="salary-low">Salary: Low to High</option>
          </select>

          {savedJobs.length > 0 && (
            <button
              className="btn-clear-all"
              onClick={handleClearAll}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="empty-state">
          <h2>No saved jobs yet</h2>
          <p>
            {savedJobs.length === 0
              ? 'Start saving jobs to build your wishlist!'
              : 'No jobs match your filters.'}
          </p>
        </div>
      ) : (
        <div className="saved-jobs-list">
          {filteredJobs.map((job) => (
            <div key={job._id} className="saved-job-item">
              <div className="job-item-content">
                <h3 className="job-item-title">{job.title}</h3>
                <p className="job-item-company">{job.company}</p>

                <div className="job-item-meta">
                  {job.location && (
                    <span className="meta-tag">📍 {job.location}</span>
                  )}
                  {job.jobType && (
                    <span className="meta-tag">{job.jobType}</span>
                  )}
                  {job.salary && (
                    <span className="meta-tag">💰 {job.salary}</span>
                  )}
                </div>

                {job.description && (
                  <p className="job-item-description">
                    {job.description.substring(0, 200)}...
                  </p>
                )}

                {job.skills && job.skills.length > 0 && (
                  <div className="job-item-skills">
                    {job.skills.slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="skill-badge">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="skill-badge">
                        +{job.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="job-item-actions">
                <button
                  className="btn-apply-small"
                  onClick={() => onApplyClick && onApplyClick(job._id)}
                >
                  Apply
                </button>
                <button
                  className="btn-remove"
                  onClick={() => handleRemoveJob(job._id)}
                  title="Remove from saved"
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocalStorageSavedJobs;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI } from '../api';
import '../styles/SavedJobs.css';

const SavedJobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [filterJobType, setFilterJobType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getSavedJobs();
      setSavedJobs(response.data.jobs || []);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
      setMessage('Failed to load saved jobs');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJob = async (jobId) => {
    try {
      await jobAPI.unsaveJob(jobId);
      setSavedJobs(savedJobs.filter(job => job._id !== jobId));
      setMessage('Job removed from saved list');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error removing saved job:', err);
      setMessage('Failed to remove job');
      setMessageType('error');
    }
  };

  const handleApplyJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const getFilteredAndSortedJobs = () => {
    let filtered = savedJobs;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        job.description.toLowerCase().includes(term)
      );
    }

    if (filterJobType) {
      filtered = filtered.filter(job => job.jobType === filterJobType);
    }

    if (filterLocation) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }

    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'salary-high') {
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
    }

    return filtered;
  };

  const filteredJobs = getFilteredAndSortedJobs();

  if (loading) {
    return (
      <div className="saved-jobs-container">
        <div className="loading-spinner">Loading saved jobs...</div>
      </div>
    );
  }

  return (
    <div className="saved-jobs-container">
      <div className="saved-jobs-header">
        <h1>💾 Saved Jobs</h1>
        <p className="saved-jobs-count">
          {filteredJobs.length} saved {filteredJobs.length === 1 ? 'job' : 'jobs'}
        </p>
      </div>

      {message && (
        <div className={`message-banner ${messageType}`}>
          {message}
        </div>
      )}

      <div className="saved-jobs-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search saved jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
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

          <input
            type="text"
            placeholder="Filter by location..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="filter-input"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="salary-high">Salary: High to Low</option>
            <option value="salary-low">Salary: Low to High</option>
          </select>
        </div>
      </div>

      <div className="saved-jobs-list">
        {filteredJobs.length === 0 ? (
          <div className="empty-state">
            <h3>No saved jobs found</h3>
            <p>
              {savedJobs.length === 0
                ? "You haven't saved any jobs yet. Start saving jobs to create your wishlist!"
                : "No jobs match your filters. Try adjusting your search criteria."}
            </p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <div key={job._id} className="saved-job-card">
              <div className="job-card-header">
                <div className="job-title-section">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                </div>
                <button
                  onClick={() => handleRemoveJob(job._id)}
                  className="btn-remove-job"
                  title="Remove from saved jobs"
                >
                  ✕
                </button>
              </div>

              <div className="job-card-details">
                <div className="detail-item">
                  <span className="detail-label">📍 Location:</span>
                  <span className="detail-value">{job.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">💼 Type:</span>
                  <span className="detail-value">{job.jobType}</span>
                </div>
                {job.salary && (
                  <div className="detail-item">
                    <span className="detail-label">💰 Salary:</span>
                    <span className="detail-value">{job.salary}</span>
                  </div>
                )}
                {job.experience && (
                  <div className="detail-item">
                    <span className="detail-label">📊 Experience:</span>
                    <span className="detail-value">{job.experience}</span>
                  </div>
                )}
              </div>

              {job.skills && job.skills.length > 0 && (
                <div className="job-skills">
                  <p className="skills-label">Required Skills:</p>
                  <div className="skills-list">
                    {job.skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="job-description">
                {job.description.substring(0, 200)}
                {job.description.length > 200 ? '...' : ''}
              </p>

              <div className="job-card-actions">
                <button
                  onClick={() => handleApplyJob(job._id)}
                  className="btn-apply"
                >
                  View & Apply
                </button>
                <button
                  onClick={() => handleRemoveJob(job._id)}
                  className="btn-unsave"
                >
                  Remove from Wishlist
                </button>
              </div>

              <p className="job-date">
                Saved: {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SavedJobs;

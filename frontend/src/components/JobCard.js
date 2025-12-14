/**
 * Enhanced JobCard Component with Save/Wishlist functionality
 * Works with localStorage-based saved jobs
 */

import React, { useState, useEffect } from 'react';
import { isJobSaved, saveJob, removeJob } from '../utils/savedJobsStorage';
import '../styles/JobCard.css';

const JobCard = ({ job, onApply }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState('');

  // Check if job is saved on component mount
  useEffect(() => {
    setIsSaved(isJobSaved(job._id));
  }, [job._id]);

  /**
   * Handle save/unsave button click
   */
  const handleSaveClick = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers

    setIsLoading(true);

    try {
      if (isSaved) {
        // Remove from saved
        const success = removeJob(job._id);
        if (success) {
          setIsSaved(false);
          setShowMessage('Removed from wishlist');
          setTimeout(() => setShowMessage(''), 2000);
        }
      } else {
        // Save to wishlist
        const success = saveJob(job);
        if (success) {
          setIsSaved(true);
          setShowMessage('✓ Added to wishlist!');
          setTimeout(() => setShowMessage(''), 2000);
        }
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      setShowMessage('Error. Please try again.');
      setTimeout(() => setShowMessage(''), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="job-card">
      {/* Message Notification */}
      {showMessage && (
        <div className={`job-card-message ${isSaved ? 'success' : 'info'}`}>
          {showMessage}
        </div>
      )}

      {/* Job Details */}
      <div className="job-card-header">
        <h3 className="job-title">{job.title}</h3>
        <p className="job-company">{job.company}</p>
      </div>

      <div className="job-card-info">
        {job.location && (
          <span className="job-location">📍 {job.location}</span>
        )}
        {job.jobType && (
          <span className="job-type">{job.jobType}</span>
        )}
        {job.salary && (
          <span className="job-salary">💰 {job.salary}</span>
        )}
      </div>

      {job.description && (
        <p className="job-description">
          {job.description.substring(0, 150)}...
        </p>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="job-skills">
          {job.skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="skill-tag">
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="skill-tag">+{job.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="job-card-actions">
        <button
          className="btn-apply"
          onClick={() => onApply && onApply(job._id)}
        >
          Apply Now
        </button>

        <button
          className={`btn-save ${isSaved ? 'saved' : ''}`}
          onClick={handleSaveClick}
          disabled={isLoading}
          title={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className="heart-icon">
            {isSaved ? '❤️' : '🤍'}
          </span>
          <span className="save-text">
            {isSaved ? 'Saved' : 'Save'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default JobCard;

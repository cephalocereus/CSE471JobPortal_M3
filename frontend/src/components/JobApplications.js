import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/Applications.css';

const FILE_BASE_URL = 'http://localhost:5000';

const JobApplications = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getJobApplications(jobId);
      setJob(response.data.job);
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      alert('Error loading applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    if (!newStatus || newStatus === 'default') return;
    
    try {
      await jobAPI.updateApplicationStatus(appId, newStatus);
      // Refresh applications
      await fetchApplications();
      alert('Application status updated successfully');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error updating status');
    }
  };

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'All') return true;
    return app.status === filter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Accepted': return 'status-badge status-accepted';
      case 'Rejected': return 'status-badge status-rejected';
      case 'Reviewed': return 'status-badge status-reviewed';
      default: return 'status-badge status-applied';
    }
  };

  const statusCounts = {
    All: applications.length,
    Applied: applications.filter(app => app.status === 'Applied').length,
    Reviewed: applications.filter(app => app.status === 'Reviewed').length,
    Accepted: applications.filter(app => app.status === 'Accepted').length,
    Rejected: applications.filter(app => app.status === 'Rejected').length
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="applications-container">
      <button onClick={() => navigate('/recruiter/dashboard')} className="btn-back">
        ← Back to Dashboard
      </button>

      <div className="applications-content">
        <div className="applications-header">
          <div>
            <h2>Applications for: {job?.title}</h2>
            <p className="job-company">{job?.company} • {job?.location}</p>
          </div>
        </div>

        <div className="applications-stats">
          <div className="stat-card">
            <div className="stat-number">{statusCounts.All}</div>
            <div className="stat-label">Total Applications</div>
          </div>
          <div className="stat-card stat-accepted">
            <div className="stat-number">{statusCounts.Accepted}</div>
            <div className="stat-label">Accepted</div>
          </div>
          <div className="stat-card stat-rejected">
            <div className="stat-number">{statusCounts.Rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card stat-reviewed">
            <div className="stat-number">{statusCounts.Reviewed}</div>
            <div className="stat-label">Reviewed</div>
          </div>
          <div className="stat-card stat-applied">
            <div className="stat-number">{statusCounts.Applied}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>

        <div className="applications-filters">
          {['All', 'Applied', 'Reviewed', 'Accepted', 'Rejected'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status} ({statusCounts[status]})
            </button>
          ))}
        </div>

        {filteredApplications.length === 0 ? (
          <p className="no-applications">No applications found for this filter</p>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((application) => (
              <div key={application._id} className="application-card">
                <div className="application-main">
                  <div className="applicant-details">
                    <div className="applicant-header">
                      <h3>{application.applicantId?.name || 'Unknown'}</h3>
                      <span className={getStatusBadgeClass(application.status)}>
                        {application.status}
                      </span>
                    </div>
                    <p className="applicant-email">📧 {application.applicantId?.email}</p>
                    {application.applicantId?.phone && (
                      <p className="applicant-phone">📱 {application.applicantId.phone}</p>
                    )}
                    <p className="application-date">
                      Applied on: {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="application-info">
                    {application.experience && (
                      <div className="info-item">
                        <strong>Experience:</strong> {application.experience}
                      </div>
                    )}
                    {application.skills && application.skills.length > 0 && (
                      <div className="info-item">
                        <strong>Skills:</strong>
                        <div className="skills-tags">
                          {application.skills.map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {application.coverLetter && (
                      <div className="info-item">
                        <strong>Cover Letter:</strong>
                        <p className="cover-letter">{application.coverLetter}</p>
                      </div>
                    )}
                    {application.resume && (
                      <div className="info-item">
                        <strong>Resume:</strong>
                        <a 
                          href={getFileUrl(application.resume)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="resume-link"
                        >
                          📄 View Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="application-actions">
                  <select 
                    className="status-select"
                    value={application.status}
                    onChange={(e) => handleStatusChange(application._id, e.target.value)}
                  >
                    <option value="default">Change Status</option>
                    <option value="Applied">Applied</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Accepted">Accept</option>
                    <option value="Rejected">Reject</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;

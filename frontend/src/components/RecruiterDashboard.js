import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI, authAPI } from '../api';
import '../styles/Dashboard.css';

const RecruiterDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('company-jobs'); // Default to company jobs
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchJobs();
  }, [activeTab]); // Refetch when tab changes

  const fetchUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUserProfile(response.data.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'my-jobs') {
        // Fetch only recruiter's own jobs
        response = await jobAPI.getMyJobs();
      } else {
        // Fetch company jobs (default)
        response = await jobAPI.getRecruiterJobs();
      }
      setJobs(response.data.jobs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleResetPassword = async () => {
    const currentPassword = window.prompt('Enter current password');
    if (!currentPassword) return;
    const newPassword = window.prompt('Enter new password');
    if (!newPassword) return;
    try {
      await authAPI.updatePassword(currentPassword, newPassword);
      alert('Password updated. Please log in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not update password');
    }
  };

  const handleCreateJob = () => {
    navigate('/post-job');
  };

  const handleCloseJob = async (jobId) => {
    if (window.confirm('Are you sure you want to close this job? It will remain in your list but marked as closed.')) {
      try {
        await jobAPI.closeJob(jobId);
        alert('Job closed successfully');
        fetchJobs();
      } catch (err) {
        alert('Error closing job');
      }
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to DELETE this job? This action cannot be undone and will permanently remove the job and all associated applications.')) {
      try {
        await jobAPI.deleteJob(jobId);
        alert('Job deleted successfully');
        fetchJobs();
      } catch (err) {
        alert('Error deleting job');
      }
    }
  };

  const handleViewApplications = (jobId) => {
    navigate(`/job/${jobId}/applications`);
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Job Portal - Recruiter</h1>
        </div>
        <div className="navbar-info">
          <span>Welcome, {user?.name}</span>
          {userProfile?.companyId && (
            <span style={{ fontSize: '14px', opacity: 0.9 }}>
              🏢 {userProfile.companyId.name || 'Company'}
            </span>
          )}
          <button onClick={handleResetPassword} className="btn-secondary">Reset Password</button>
          <button onClick={() => navigate('/recruiter/companies')} className="btn-secondary">My Profile</button>
          <button onClick={() => navigate('/login-history')} className="btn-secondary">Login History</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="sidebar">
          <button
            className={`nav-btn ${activeTab === 'company-jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('company-jobs')}
          >
            Company Jobs
          </button>
          <button
            className={`nav-btn ${activeTab === 'my-jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-jobs')}
          >
            My Job Postings
          </button>
          <button onClick={handleCreateJob} className="nav-btn btn-new">
            ➕ Post New Job
          </button>
          <button
            className="nav-btn btn-new"
            onClick={() => navigate('/recruiter/companies')}
          >
            My Companies
          </button>
        </div>

        <div className="main-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="jobs-section">
              <h2>
                {activeTab === 'my-jobs' 
                  ? 'My Job Postings' 
                  : (userProfile?.companyId 
                      ? `Company Jobs - ${userProfile.companyId.name}` 
                      : 'Company Jobs')}
              </h2>
              {jobs.length === 0 ? (
                <p>No jobs found</p>
              ) : (
                <div className="jobs-list">
                  {jobs.map(job => {
                    // In "my-jobs" tab, show all buttons. In "company-jobs" tab, show only Interview Questions
                    const showAllButtons = activeTab === 'my-jobs';
                    
                    return (
                      <div key={job._id} className="job-card-recruiter">
                        <div className="job-header">
                          <h3>{job.title}</h3>
                          <span className={`job-status ${job.isActive ? 'active' : 'inactive'}`}>
                            {job.isActive ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {job.companyId ? (
                            <>
                              <p style={{ color: '#667eea', fontWeight: 600, margin: 0 }}>
                                🏢 {job.companyId.name}
                              </p>
                              <p style={{ color: '#6b7280', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                                Posted by: <span style={{ fontWeight: 500, color: '#4b5563' }}>{job.recruiterId?.name || 'Unknown'}</span>
                              </p>
                            </>
                          ) : (
                            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                              Posted by: {job.recruiterId?.name || 'Unknown'}
                            </p>
                          )}
                        </div>
                        <p className="location">📍 {job.location}</p>
                        <p className="description">{job.description.substring(0, 150)}...</p>
                        
                        <div className="job-stats">
                          <span>👥 {job.applicants.length} applicants</span>
                          <span>📅 {job.jobType}</span>
                          {job.salary && <span>💰 {job.salary}</span>}
                        </div>

                        <div className="job-actions">
                          {showAllButtons ? (
                            <>
                              <button 
                                className="btn-view-modern"
                                onClick={() => handleViewApplications(job._id)}
                              >
                                👥 View Applications
                              </button>
                              <button 
                                className="btn-questions-modern"
                                onClick={() => navigate(`/job/${job._id}/questions`)}
                              >
                                📝 Interview Questions
                              </button>
                              <button 
                                className="btn-close-modern"
                                onClick={() => handleCloseJob(job._id)}
                                disabled={!job.isActive}
                              >
                                ✕ Close Job
                              </button>
                              <button 
                                className="btn-delete-modern"
                                onClick={() => handleDeleteJob(job._id)}
                              >
                                🗑️ Delete Job
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                className="btn-view-modern"
                                onClick={() => handleViewApplications(job._id)}
                              >
                                👥 View Applications
                              </button>
                              <button 
                                className="btn-questions-modern"
                                onClick={() => navigate(`/job/${job._id}/questions`)}
                              >
                                📝 Interview Questions
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;

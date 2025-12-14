import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../api';
import '../styles/Applications.css';

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await jobAPI.getApplications();
      setApplications(response.data.applications);
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    setWithdrawingId(applicationId);
    try {
      await jobAPI.withdrawApplication(applicationId);
      // Remove from local state
      setApplications(applications.filter(app => app._id !== applicationId));
      alert('Application withdrawn successfully!');
    } catch (err) {
      console.error('Error withdrawing application:', err);
      alert('Failed to withdraw application');
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleBack = () => {
    navigate('/applicant/dashboard');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      case 'reviewed':
        return 'status-reviewed';
      default:
        return 'status-applied';
    }
  };

  if (loading) {
    return (
      <div className="my-applications-container">
        <div className="loading-spinner">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="my-applications-container">
      {/* Back Button */}
      <div className="back-button-wrapper">
        <button onClick={handleBack} className="btn-back-apply">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to Jobs
        </button>
      </div>

      <div className="applications-content">
        <div className="applications-header">
          <h1 className="applications-title">My Applications</h1>
          <p className="applications-subtitle">
            Track all your job applications in one place
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="no-applications">
            <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16">
              <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
            </svg>
            <h3>No Applications Yet</h3>
            <p>You haven't applied to any jobs yet. Start browsing to find your dream job!</p>
            <button className="btn-browse-jobs" onClick={handleBack}>
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="applications-grid">
            {applications.map(application => (
              <div key={application._id} className="application-card-premium">
                <div className="application-card-header">
                  <div className="company-initial-badge">
                    {application.jobId?.company?.substring(0, 2).toUpperCase() || 'CO'}
                  </div>
                  <div className="application-card-info">
                    <h3 className="job-title-app">{application.jobId?.title || 'Job Title'}</h3>
                    <p className="company-name-app">{application.jobId?.company || 'Company'}</p>
                  </div>
                </div>

                <div className="application-details">
                  <div className="detail-row">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    <span>{application.jobId?.location || 'Location'}</span>
                  </div>

                  <div className="detail-row">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z"/>
                      <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
                    </svg>
                    <span>Applied on {formatDate(application.createdAt)}</span>
                  </div>

                  {application.jobId?.salary && (
                    <div className="detail-row salary-row">
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
                      </svg>
                      <span className="salary-text">{application.jobId.salary}</span>
                    </div>
                  )}
                </div>

                <div className="application-footer">
                  <span className={`status-badge ${getStatusColor(application.status)}`}>
                    {application.status}
                  </span>
                  <button
                    className="btn-withdraw"
                    onClick={() => handleWithdraw(application._id)}
                    disabled={withdrawingId === application._id}
                  >
                    {withdrawingId === application._id ? (
                      'Withdrawing...'
                    ) : (
                      <>
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"/>
                        </svg>
                        Withdraw
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;

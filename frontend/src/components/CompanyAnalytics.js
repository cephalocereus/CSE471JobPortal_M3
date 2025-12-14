import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Bar } from 'react-chartjs-2';
import { jobAPI } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/CompanyAnalytics.css';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartDataLabels);

const CompanyAnalytics = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobAPI.getCompanyAnalytics(companyId);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/recruiter/companies')} className="btn-primary">
            Back to Companies
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { company, summary, jobsWithApplications, jobs } = analytics;

  // Pie chart data for application status distribution with soothing colors
  const statusChartData = {
    labels: ['Accepted', 'Rejected', 'Reviewed', 'Applied'],
    datasets: [
      {
        label: 'Applications',
        data: [
          summary.acceptedCount,
          summary.rejectedCount,
          summary.reviewedCount,
          summary.appliedCount
        ],
        backgroundColor: [
          'rgba(134, 239, 172, 0.85)',  // Soft green
          'rgba(252, 165, 165, 0.85)',  // Soft red
          'rgba(147, 197, 253, 0.85)',  // Soft blue
          'rgba(253, 224, 71, 0.85)'    // Soft yellow
        ],
        borderColor: [
          'rgba(74, 222, 128, 1)',
          'rgba(248, 113, 113, 1)',
          'rgba(96, 165, 250, 1)',
          'rgba(250, 204, 21, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Bar chart data for applications per job (regular bar, not stacked)
  const topJobs = jobsWithApplications
    .sort((a, b) => b.totalApplicants - a.totalApplicants)
    .slice(0, 10);

  const jobsChartData = {
    labels: topJobs.map(job => 
      job.jobTitle.length > 20 ? job.jobTitle.substring(0, 20) + '...' : job.jobTitle
    ),
    datasets: [
      {
        label: 'Accepted',
        data: topJobs.map(job => job.accepted),
        backgroundColor: 'rgba(134, 239, 172, 0.85)',
        borderColor: 'rgba(74, 222, 128, 1)',
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Rejected',
        data: topJobs.map(job => job.rejected),
        backgroundColor: 'rgba(252, 165, 165, 0.85)',
        borderColor: 'rgba(248, 113, 113, 1)',
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Reviewed',
        data: topJobs.map(job => job.reviewed),
        backgroundColor: 'rgba(147, 197, 253, 0.85)',
        borderColor: 'rgba(96, 165, 250, 1)',
        borderWidth: 2,
        borderRadius: 6
      },
      {
        label: 'Applied',
        data: topJobs.map(job => job.applied),
        backgroundColor: 'rgba(253, 224, 71, 0.85)',
        borderColor: 'rgba(250, 204, 21, 1)',
        borderWidth: 2,
        borderRadius: 6
      }
    ]
  };

  const jobsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 13
          }
        }
      },
      title: {
        display: true,
        text: 'Applications per Job (Top 10)',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const jobIndex = context.dataIndex;
            const total = topJobs[jobIndex].totalApplicants;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#1f2937',
        font: {
          weight: 'bold',
          size: 11
        },
        formatter: function(value, context) {
          if (value === 0) return '';
          const jobIndex = context.dataIndex;
          const total = topJobs[jobIndex].totalApplicants;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          return value > 0 ? `${percentage}%` : '';
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false
        }
      },
      y: {
        stacked: false,
        beginAtZero: true,
        ticks: {
          stepSize: 1
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 13
          }
        }
      },
      title: {
        display: true,
        text: 'Application Status Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / summary.totalApplications) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#1f2937',
        font: {
          weight: 'bold',
          size: 14
        },
        formatter: function(value, context) {
          if (value === 0) return '';
          const percentage = ((value / summary.totalApplications) * 100).toFixed(1);
          return `${percentage}%`;
        }
      }
    }
  };

  const acceptanceRate = summary.totalApplications > 0
    ? ((summary.acceptedCount / summary.totalApplications) * 100).toFixed(1)
    : 0;

  const rejectionRate = summary.totalApplications > 0
    ? ((summary.rejectedCount / summary.totalApplications) * 100).toFixed(1)
    : 0;

  return (
    <div className="analytics-page">
      <nav className="analytics-nav">
        <div className="analytics-brand">
          <h1>Job Portal - Analytics</h1>
        </div>
        <div className="analytics-actions">
          <button className="btn-secondary" onClick={() => navigate('/recruiter/dashboard')}>
            Dashboard
          </button>
          <button className="btn-secondary" onClick={() => navigate('/recruiter/companies')}>
            My Companies
          </button>
          <button className="btn-logout" onClick={async () => { await logout(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="analytics-container">
        <div className="analytics-header">
          <button onClick={() => navigate('/recruiter/companies')} className="btn-back">
            ← Back to Companies
          </button>
          <h2>Analytics Dashboard - {company.name}</h2>
          <p className="analytics-subtitle">Comprehensive overview of applications and job postings</p>
        </div>

        <div className="analytics-summary">
          <div className="summary-card summary-primary">
            <div className="summary-content">
              <div className="summary-value">{summary.totalApplications}</div>
              <div className="summary-label">Total Applications</div>
            </div>
          </div>

          <div className="summary-card summary-success">
            <div className="summary-content">
              <div className="summary-value">{summary.acceptedCount}</div>
              <div className="summary-label">Accepted</div>
              <div className="summary-percentage">{acceptanceRate}%</div>
            </div>
          </div>

          <div className="summary-card summary-danger">
            <div className="summary-content">
              <div className="summary-value">{summary.rejectedCount}</div>
              <div className="summary-label">Rejected</div>
              <div className="summary-percentage">{rejectionRate}%</div>
            </div>
          </div>

          <div className="summary-card summary-info">
            <div className="summary-content">
              <div className="summary-value">{summary.reviewedCount}</div>
              <div className="summary-label">Reviewed</div>
            </div>
          </div>

          <div className="summary-card summary-warning">
            <div className="summary-content">
              <div className="summary-value">{summary.appliedCount}</div>
              <div className="summary-label">Pending</div>
            </div>
          </div>

          <div className="summary-card summary-active">
            <div className="summary-content">
              <div className="summary-value">{summary.activeJobsCount}</div>
              <div className="summary-label">Active Jobs</div>
            </div>
          </div>

          <div className="summary-card summary-closed">
            <div className="summary-content">
              <div className="summary-value">{summary.closedJobsCount}</div>
              <div className="summary-label">Closed Jobs</div>
            </div>
          </div>

          <div className="summary-card summary-total">
            <div className="summary-content">
              <div className="summary-value">{summary.totalJobsCount}</div>
              <div className="summary-label">Total Jobs</div>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-wrapper" style={{ height: '400px' }}>
              <Pie data={statusChartData} options={pieChartOptions} />
            </div>
          </div>

          <div className="chart-card chart-card-wide">
            <div className="chart-wrapper" style={{ height: '400px' }}>
              <Bar data={jobsChartData} options={jobsChartOptions} />
            </div>
          </div>
        </div>

        <div className="jobs-details-section">
          <h3>Application Statistics Overview</h3>
          <div className="jobs-table">
            <div className="jobs-table-header">
              <div>Job Title</div>
              <div>Status</div>
              <div>Total</div>
              <div>Accepted</div>
              <div>Rejected</div>
              <div>Reviewed</div>
              <div>Pending</div>
            </div>
            {jobsWithApplications.length === 0 ? (
              <div className="no-jobs">No jobs found for this company</div>
            ) : (
              jobsWithApplications.map((job, index) => (
                <div key={index} className="jobs-table-row">
                  <div className="job-title-cell">{job.jobTitle}</div>
                  <div>
                    <span className={`job-status-badge ${job.isActive ? 'active' : 'closed'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <div className="total-cell">{job.totalApplicants}</div>
                  <div className="accepted-cell">{job.accepted}</div>
                  <div className="rejected-cell">{job.rejected}</div>
                  <div className="reviewed-cell">{job.reviewed}</div>
                  <div className="applied-cell">{job.applied}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Job Listings Section - Recruiter View */}
        <div className="company-jobs-section">
          <div className="company-jobs-header">
            <h3>Jobs Posted by {company.name}</h3>
            <p className="company-jobs-subtitle">All job postings with applicant counts</p>
          </div>

          {!jobs || jobs.length === 0 ? (
            <div className="no-jobs-message">
              <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" style={{ color: '#9ca3af', marginBottom: '16px' }}>
                <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
              </svg>
              <p>No jobs posted by this company yet</p>
            </div>
          ) : (
            <div className="recruiter-jobs-grid">
              {jobs.map(job => (
                <div key={job._id} className="recruiter-job-card">
                  <div className="job-card-header-recruiter">
                    <h3>{job.title}</h3>
                    <span className={`job-status-badge ${job.isActive ? 'active' : 'closed'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  
                  <p className="company-name">{job.company}</p>
                  
                  <div className="job-location-row">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    <span className="location">{job.location}</span>
                  </div>
                  
                  <p className="description">
                    {(job.description || '').substring(0, 150)}...
                  </p>
                  
                  {job.skills && job.skills.length > 0 && (
                    <div className="skills-row">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-pill">{skill}</span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="skill-pill">+{job.skills.length - 3}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="job-meta">
                    <span className="badge">{job.jobType}</span>
                    {job.salary && (
                      <span className="salary">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
                        </svg>
                        {job.salary}
                      </span>
                    )}
                  </div>
                  
                  <div className="job-applicants-info">
                    <div className="applicants-badge">
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1h8zm-7.978-1A.261.261 0 0 1 7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002a.274.274 0 0 1-.014.002H7.022zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM6.936 9.28a5.88 5.88 0 0 0-1.23-.247A7.35 7.35 0 0 0 5 9c-4 0-5 3-5 4 0 .667.333 1 1 1h4.216A2.238 2.238 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816zM4.92 10A5.493 5.493 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275zM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0zm3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                      </svg>
                      <strong>{job.applicants ? job.applicants.length : 0}</strong> 
                      <span>Applicant{job.applicants && job.applicants.length !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <button 
                      className="btn-view-applications"
                      onClick={() => navigate(`/job/${job._id}/applications`)}
                    >
                      View Applications
                    </button>
                  </div>
                  
                  <div className="job-posted-info">
                    <small>Posted by: {job.recruiterId?.name || 'Unknown'}</small>
                    <small>Created: {new Date(job.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyAnalytics;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI, authAPI } from '../api';
import '../styles/Dashboard.css';
import '../styles/PersonalizedJobs.css';

const PersonalizedJobsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    keywords: [],
    personalized: [],
    collaborative: [],
    trends: [],
    trendJobs: []
  });
  const [loading, setLoading] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Format date helper (simple version since date-fns not installed)
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      }
      
      // Format as "Dec 8" for older dates
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    } catch (e) {
      return 'Recently';
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      console.log('Fetching recommendations...');
      const response = await jobAPI.getRecommendations();
      console.log('Recommendations response:', response);
      console.log('Recommendations data:', response.data);
      
      // Check if response has data
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // Ensure we have the expected structure
      const recommendationsData = {
        keywords: response.data.keywords || [],
        personalized: response.data.personalized || [],
        collaborative: response.data.collaborative || [],
        trends: response.data.trends || [],
        trendJobs: response.data.trendJobs || []
      };
      
      console.log('Setting recommendations data:', recommendationsData);
      setData(recommendationsData);
      
      // Pre-fill keywords input with profile keywords (what user has explicitly saved)
      // Load from profile separately to show what user has saved
      try {
        const profileResponse = await authAPI.getProfile();
        const profileKeywords = profileResponse.data?.user?.profileKeywords || profileResponse.data?.profileKeywords || [];
        console.log('Loaded profile keywords for input:', profileKeywords);
        if (profileKeywords.length > 0) {
          setKeywordInput(profileKeywords.join(', '));
        }
      } catch (profileErr) {
        console.error('Error loading profile keywords (non-critical):', profileErr);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: err.config
      });
      
      // Show more detailed error message
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load recommendations. Please try again.';
      
      // Don't show alert, just log and set empty data
      console.error('Recommendations error:', errorMessage);
      
      // Set empty data structure to prevent crashes
      setData({
        keywords: [],
        personalized: [],
        collaborative: [],
        trends: [],
        trendJobs: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Load user keywords on mount and fetch recommendations
  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle keyword save
  const handleSaveKeywords = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Split by comma, trim, filter empty, and convert to lowercase
      const keywords = keywordInput
        .split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k.length > 0);
      
      if (keywords.length === 0) {
        alert('Please enter at least one keyword');
        setIsSaving(false);
        return;
      }
      
      console.log('Saving keywords:', keywords);
      const saveResponse = await authAPI.updateProfileKeywords(keywords);
      console.log('Keywords save response:', saveResponse);
      
      // Verify keywords were saved
      const savedKeywords = saveResponse.data?.user?.profileKeywords || saveResponse.data?.profileKeywords || [];
      console.log('Verified saved keywords:', savedKeywords);
      
      if (savedKeywords.length === 0) {
        console.warn('Warning: Keywords may not have been saved correctly');
      }
      
      // Update the input field to show the saved keywords (in case backend added/removed duplicates)
      if (savedKeywords.length > 0) {
        setKeywordInput(savedKeywords.join(', '));
      }
      
      // Show success message
      alert(`Keywords saved successfully! Found ${savedKeywords.length} keywords: ${savedKeywords.join(', ')}. Loading recommendations...`);
      
      // Immediately refetch recommendations - no delay needed as backend should have updated
      console.log('Refetching recommendations after keyword save...');
      await fetchRecommendations();
      
      console.log('Recommendations refreshed after keyword save');
    } catch (err) {
      console.error('Error saving keywords:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const message = err.response?.data?.message || 
                     err.response?.data?.error || 
                     err.message || 
                     'Failed to save keywords';
      alert(`Error saving keywords: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle apply
  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`);
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Check if job is in both personalized and trendJobs
  const isPerfectMatch = (jobId) => {
    const inPersonalized = data.personalized.some(j => j._id === jobId);
    const inTrendJobs = data.trendJobs.some(j => j._id === jobId);
    return inPersonalized && inTrendJobs;
  };

  // JobCard component
  const JobCard = ({ job, showHotBadge = false, showPerfectMatch = false }) => (
    <div className="job-card">
      <div style={{ position: 'relative' }}>
        {showPerfectMatch && (
          <span className="badge-perfect-match">Perfect Match</span>
        )}
        {showHotBadge && !showPerfectMatch && (
          <span className="badge-hot-market">🔥 Hot in Market</span>
        )}
      </div>
      <h3>{job.title}</h3>
      <p className="company">{job.company}</p>
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
        <span className="badge">{job.jobType || 'Full-time'}</span>
        {job.salary && (
          <span className="salary">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
            </svg>
            {job.salary}
          </span>
        )}
      </div>
      <button
        className="btn-apply-gradient"
        onClick={() => handleApply(job._id)}
      >
        Apply Now
      </button>
    </div>
  );

  // Loading skeleton
  const SkeletonCard = () => (
    <div className="job-card skeleton-card">
      <div className="skeleton-line" style={{ width: '60%', height: '24px', marginBottom: '12px' }}></div>
      <div className="skeleton-line" style={{ width: '40%', height: '18px', marginBottom: '16px' }}></div>
      <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
      <div className="skeleton-line" style={{ width: '90%', height: '14px', marginBottom: '8px' }}></div>
      <div className="skeleton-line" style={{ width: '80%', height: '14px', marginBottom: '20px' }}></div>
      <div className="skeleton-line" style={{ width: '100%', height: '44px', borderRadius: '12px' }}></div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="navbar-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="sidebar">
          <button
            className="nav-btn active"
            onClick={() => navigate('/jobs')}
          >
            Browse Jobs
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate('/my-applications')}
          >
            My Applications
          </button>
        </div>

        <div className="main-content">
          <div className="personalized-jobs-container">
            <div className="personalized-jobs-header">
              <h1 className="personalized-jobs-title">Personalized Jobs</h1>
              <button
                className="btn-back-to-jobs"
                onClick={() => navigate('/jobs')}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                </svg>
                Back to all jobs
              </button>
            </div>

            <div className="personalized-jobs-grid">
              {/* Left Column - Recommendations */}
              <div className="personalized-jobs-left">
                {/* Card 1: Personalized suggestions */}
                <div className="glass-card">
                  <div className="glass-card-header">
                    <h2>Personalized suggestions</h2>
                    <p className="glass-card-subtitle">
                      {data.keywords && data.keywords.length > 0 ? (
                        <>Using keywords: <strong>{data.keywords.join(', ')}</strong></>
                      ) : (
                        <>No keywords yet. <strong>Search for jobs or add keywords below</strong> to get personalized recommendations.</>
                      )}
                    </p>
                  </div>
                  {data.keywords && data.keywords.length > 0 && (
                    <div className="badge-purple">Best match</div>
                  )}
                  <p className="glass-card-hint">
                    {data.keywords && data.keywords.length > 0 
                      ? 'These jobs match your search history, saved keywords, and current market trends from news articles.'
                      : '💡 Tip: Go to Browse Jobs, search for jobs you like, or add keywords in the form below to get personalized recommendations.'}
                  </p>
                  
                  {loading ? (
                    <div className="jobs-grid-small">
                      <SkeletonCard />
                      <SkeletonCard />
                    </div>
                  ) : data.personalized && data.personalized.length > 0 ? (
                    <div className="jobs-grid-small">
                      {data.personalized.map(job => (
                        <JobCard key={job._id} job={job} />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No personalized matches yet.</p>
                      <p style={{ fontSize: '13px', marginTop: '8px', color: '#9ca3af' }}>
                        {data.keywords && data.keywords.length > 0 
                          ? `We searched for jobs matching: ${data.keywords.join(', ')}. Try adding more keywords or check back later.`
                          : 'Try adding keywords below or search for jobs in Browse Jobs page.'}
                      </p>
                      {loading === false && data.personalized && data.personalized.length === 0 && (
                        <p style={{ fontSize: '12px', marginTop: '12px', color: '#ef4444', fontStyle: 'italic' }}>
                          💡 Make sure you have searched for jobs in Browse Jobs page or added keywords below.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card 2: People like you applied for */}
                <div className="glass-card">
                  <div className="glass-card-header">
                    <h2>People like you applied for</h2>
                  </div>
                  
                  {loading ? (
                    <div className="jobs-grid-small">
                      <SkeletonCard />
                      <SkeletonCard />
                    </div>
                  ) : data.collaborative && data.collaborative.length > 0 ? (
                    <div className="jobs-grid-small">
                      {data.collaborative.map(job => (
                        <JobCard key={job._id} job={job} />
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No peer signals yet.</p>
                  )}
                </div>

                {/* Card 3: Trending in the market right now */}
                {data.trendJobs && data.trendJobs.length > 0 && (
                  <div className="glass-card trending-card">
                    <div className="glass-card-header">
                      <h2>🔥 Trending in the market right now</h2>
                    </div>
                    
                    {loading ? (
                      <div className="jobs-grid-small">
                        <SkeletonCard />
                        <SkeletonCard />
                      </div>
                    ) : (
                      <div className="jobs-grid-small">
                        {data.trendJobs.map(job => (
                          <JobCard
                            key={job._id}
                            job={job}
                            showHotBadge={true}
                            showPerfectMatch={isPerfectMatch(job._id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Sticky Sidebar */}
              <div className="personalized-jobs-sidebar">
                <div className="glass-card sidebar-card">
                  <h2>Job market trends</h2>
                  
                  {loading ? (
                    <div className="trends-loading">
                      <p className="muted">Fetching the latest pulse...</p>
                    </div>
                  ) : data.trends && data.trends.length > 0 ? (
                    <div className="trends-list">
                      {data.trends.slice(0, 5).map((trend, idx) => (
                        <div key={idx} className="trend-item">
                          <h4 className="trend-headline">{trend.headline}</h4>
                          <p className="trend-meta">
                            {trend.source} • {formatDate(trend.publishedAt)}
                          </p>
                          <p className="trend-summary">
                            {trend.summary || 'No summary available'}
                          </p>
                          <a
                            href={trend.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="trend-link"
                          >
                            Read more →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No trends available at the moment.</p>
                  )}

                  <form className="keywords-form" onSubmit={handleSaveKeywords}>
                    <label htmlFor="keywords-input">
                      Add keywords so we can tailor matches:
                    </label>
                    <input
                      id="keywords-input"
                      type="text"
                      placeholder="react, remote, python, ai"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      disabled={isSaving}
                    />
                    <button
                      type="submit"
                      className="btn-save-keywords"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : '💾 Save keywords'}
                    </button>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px', marginBottom: '0' }}>
                      💡 Separate keywords with commas. These will be used to find matching jobs.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedJobsPage;

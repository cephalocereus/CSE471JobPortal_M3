import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI, authAPI } from '../api';
import '../styles/Dashboard.css';

const ApplicantDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('jobs');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState({
    personalized: [],
    collaborative: [],
    trends: [],
    keywords: []
  });
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [recommendationJobs, setRecommendationJobs] = useState([]);
  const [profileKeywordsInput, setProfileKeywordsInput] = useState('');
  const [keywordStatus, setKeywordStatus] = useState(null);
  
  // New state for advanced filtering
  const [filterTitle, setFilterTitle] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSkills, setFilterSkills] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [savedJobs, setSavedJobs] = useState(new Set());
  const [savingJobId, setSavingJobId] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const jobsPerPage = 6;

  const loadJobs = async (term = '') => {
    setLoading(true);
    try {
      const params = term ? { q: term } : {};
      const response = await jobAPI.getAllJobs(params);
      setJobs(response.data.jobs);
      setCurrentPage(1); // Reset to first page when loading new jobs
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Track search terms for recommendations (debounced)
  const trackSearchTerms = async (explicitCall = false) => {
    const allTerms = [
      searchTerm,
      filterTitle,
      filterLocation,
      filterSkills
    ].filter(term => term && term.trim());
    
    if (allTerms.length === 0) return;
    
    // Combine all terms and track them
    const combinedTerm = allTerms.join(' ');
    
    try {
      console.log('Tracking search terms:', combinedTerm);
      // Track via recommendations API (it will track the search term)
      await jobAPI.getRecommendations({ q: combinedTerm });
      console.log('Search terms tracked successfully');
    } catch (err) {
      console.error('Error tracking search terms:', err);
    }
  };

  const buildRecommendationList = (payload = {}) => {
    const seen = new Set();
    const combined = [
      ...(payload.personalized || []),
      ...(payload.collaborative || [])
    ].filter(job => {
      if (!job?._id) return false;
      if (seen.has(job._id)) return false;
      seen.add(job._id);
      return true;
    });
    return combined;
  };

  const loadRecommendations = async () => {
    setRecommendationLoading(true);
    try {
      // Combine ALL filter inputs into a single search query for recommendations
      const filterTerms = [
        searchTerm,
        filterTitle,
        filterLocation,
        filterSkills
      ].filter(term => term && term.trim()).join(' ');
      
      const params = filterTerms ? { q: filterTerms } : {};
      const response = await jobAPI.getRecommendations(params);
      setRecommendations(response.data);
      setRecommendationJobs(buildRecommendationList(response.data));
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    loadJobs(appliedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Track search terms when filter inputs change (debounced)
  // Only track if user has typed something meaningful (at least 2 chars)
  useEffect(() => {
    const hasValidInput = [
      searchTerm,
      filterTitle,
      filterLocation,
      filterSkills
    ].some(term => term && term.trim().length >= 2);
    
    if (!hasValidInput) return;
    
    const timer = setTimeout(() => {
      trackSearchTerms();
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterTitle, filterLocation, filterSkills]);

  // Load saved jobs on component mount
  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await jobAPI.getSavedJobs();
        const savedJobIds = new Set(response.data.jobs.map(job => job._id));
        setSavedJobs(savedJobIds);
      } catch (err) {
        console.error('Error loading saved jobs:', err);
      }
    };
    loadSavedJobs();
  }, []);

  const hydrateKeywords = async () => {
    try {
      const response = await authAPI.getProfile();
      const keywords = response.data.user?.profileKeywords || [];
      setProfileKeywordsInput(keywords.join(', '));
    } catch (err) {
      console.error('Error loading profile keywords:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleApply = (jobId) => {
    navigate(`/apply/${jobId}`);
  };

  const handleSaveJob = async (jobId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[Save Button] Clicked for job:', jobId);
    console.log('[Save Button] Currently saved jobs:', savedJobs);
    console.log('[Save Button] Is currently saved:', savedJobs.has(jobId));
    
    setSavingJobId(jobId);
    try {
      if (savedJobs.has(jobId)) {
        // Unsave job
        console.log('[Save Button] Unsaving job:', jobId);
        await jobAPI.unsaveJob(jobId);
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        setMessage('Removed from your wishlist');
        setMessageType('info');
        console.log('[Save Button] Job unsaved successfully');
      } else {
        // Save job
        console.log('[Save Button] Saving job:', jobId);
        await jobAPI.saveJob(jobId);
        setSavedJobs(prev => new Set(prev).add(jobId));
        setMessage('✓ Added to your wishlist!');
        setMessageType('success');
        console.log('[Save Button] Job saved successfully');
      }
      // Auto-dismiss message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (err) {
      console.error('[Save Button] Error saving/unsaving job:', err);
      console.error('[Save Button] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setMessage('Failed to save job. Please try again.');
      setMessageType('error');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } finally {
      setSavingJobId(null);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    setFilterTitle('');
    setFilterLocation('');
    setFilterSkills('');
    loadJobs('');
  };

  // Filter jobs based on all search inputs with partial/sequential matching
  const getFilteredJobs = () => {
    let filtered = [...jobs];

    // Helper function for partial/sequential matching
    const partialMatch = (text, searchTerm) => {
      if (!text || !searchTerm) return false;
      const textLower = text.toLowerCase();
      const termLower = searchTerm.toLowerCase();
      
      // Support partial matching: "tin" matches "Austin", "rity" matches "Security"
      return textLower.includes(termLower);
    };

    // Apply general search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        partialMatch(job.title, term) ||
        partialMatch(job.company, term) ||
        partialMatch(job.description, term) ||
        partialMatch(job.location, term) ||
        job.skills?.some(skill => partialMatch(skill, term))
      );
    }

    // Apply title filter
    if (filterTitle.trim()) {
      filtered = filtered.filter(job => 
        partialMatch(job.title, filterTitle)
      );
    }

    // Apply location filter
    if (filterLocation.trim()) {
      filtered = filtered.filter(job => 
        partialMatch(job.location, filterLocation)
      );
    }

    // Apply skills filter
    if (filterSkills.trim()) {
      filtered = filtered.filter(job => 
        job.skills?.some(skill => partialMatch(skill, filterSkills)) ||
        partialMatch(job.title, filterSkills) ||
        partialMatch(job.description, filterSkills)
      );
    }

    return filtered;
  };

  // Sort jobs
  const getSortedJobs = (jobsToSort) => {
    let sorted = [...jobsToSort];

    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'salaryHigh') {
      sorted.sort((a, b) => {
        const salaryA = extractSalaryAvg(a.salary);
        const salaryB = extractSalaryAvg(b.salary);
        return salaryB - salaryA;
      });
    } else if (sortBy === 'salaryLow') {
      sorted.sort((a, b) => {
        const salaryA = extractSalaryAvg(a.salary);
        const salaryB = extractSalaryAvg(b.salary);
        return salaryA - salaryB;
      });
    }

    return sorted;
  };

  // Extract average salary for sorting
  const extractSalaryAvg = (salaryStr) => {
    if (!salaryStr) return 0; // Jobs without salary go to bottom
    
    // Remove currency symbols and commas
    const cleaned = salaryStr.replace(/[^0-9-]/g, '');
    
    // Check for range (e.g., "50000-70000")
    if (cleaned.includes('-')) {
      const parts = cleaned.split('-').map(p => parseInt(p) || 0);
      return (parts[0] + parts[1]) / 2;
    }
    
    // Single number
    return parseInt(cleaned) || 0;
  };

  // Get paginated jobs
  const getPaginatedJobs = () => {
    const filtered = getFilteredJobs();
    const sorted = getSortedJobs(filtered);
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const getTotalPages = () => {
    const filtered = getFilteredJobs();
    return Math.ceil(filtered.length / jobsPerPage);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const totalPages = getTotalPages();
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleShowRecommendations = async () => {
    setShowRecommendations(true);
    await hydrateKeywords();
    await loadRecommendations();
  };

  const handleShowAllJobs = () => {
    setShowRecommendations(false);
  };

  const handleKeywordSave = async (event) => {
    event.preventDefault();
    setKeywordStatus(null);
    const keywords = profileKeywordsInput
      .split(',')
      .map(keyword => keyword.trim().toLowerCase())
      .filter(Boolean);

    try {
      await authAPI.updateProfileKeywords(keywords);
      setKeywordStatus({ type: 'success', message: 'Keywords synced!' });
      await loadRecommendations();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to save keywords';
      setKeywordStatus({ type: 'error', message });
    }
  };

  const renderCompactJobCard = (job) => (
    <div key={job._id} className="recommendation-card">
      <div>
        <h4>{job.title}</h4>
        <p className="company">{job.company}</p>
        <p className="location">📍 {job.location}</p>
        <p className="description">
          {(job.description || '').substring(0, 120)}...
        </p>
      </div>
      <div className="recommendation-card-actions">
        <button className="btn-apply" onClick={() => handleApply(job._id)}>
          View role
        </button>
        <button
          className={`btn-save-compact ${savedJobs.has(job._id) ? 'saved' : ''}`}
          onClick={(e) => handleSaveJob(job._id, e)}
          disabled={savingJobId === job._id}
          title={savedJobs.has(job._id) ? 'Remove from saved jobs' : 'Save this job'}
        >
          {savedJobs.has(job._id) ? '❤️' : '🤍'}
        </button>
      </div>
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
          <button onClick={() => navigate('/profile')} className="btn-secondary">My Profile</button>
          <button onClick={() => navigate('/login-history')} className="btn-secondary">Login History</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      {message && (
        <div className={`notification notification-${messageType}`}>
          {message}
        </div>
      )}

      <div className="dashboard-content">
        <div className="sidebar">
          <button
            className={`nav-btn ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            Browse Jobs
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate('/companies')}
          >
            🏢 Companies
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate('/saved-jobs')}
          >
            💾 Saved Jobs
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate('/my-applications')}
          >
            My Applications
          </button>
        </div>

        <div className="main-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <>
              {activeTab === 'jobs' && (
                  <div className="jobs-section">
                    {/* Hero Gradient Section */}
                    {!showRecommendations && (
                      <div className="hero-gradient">
                        <h1 className="hero-title">Find Your Dream Job</h1>
                        <p className="hero-subtitle">Explore opportunities from top companies around the world</p>
                        <p className="hero-count">~{jobs.length}+ active job listings</p>
                      </div>
                    )}

                    {/* Jobs Header with Personalized Button */}
                    <div className="jobs-header">
                      {showRecommendations ? (
                        <>
                          <h2>Personalized Jobs</h2>
                          <button
                            type="button"
                            className="btn-clear btn-back"
                            onClick={handleShowAllJobs}
                          >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                            </svg>
                            Back to all jobs
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn-personalized-cta"
                          onClick={() => navigate('/jobs/personalized')}
                        >
                          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                            <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319z"/>
                          </svg>
                          Personalized Job Recommendations
                        </button>
                      )}
                    </div>

                    {/* Glassmorphism Filter Card - Only show when not in recommendations view */}
                    {!showRecommendations && (
                      <div className="filter-card-glass">
                        <div className="filter-inputs">
                          {/* Search Input */}
                          <div className="filter-input-wrapper">
                            <svg className="input-icon" width="22" height="22" fill="currentColor" viewBox="0 0 16 16" strokeWidth="0.5">
                              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                            </svg>
                            <input
                              type="text"
                              placeholder="Search jobs, companies, or keywords..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  const combined = [
                                    searchTerm,
                                    filterTitle,
                                    filterLocation,
                                    filterSkills
                                  ].filter(t => t && t.trim()).join(' ');
                                  setAppliedSearch(combined);
                                  loadJobs(combined);
                                  trackSearchTerms();
                                }
                              }}
                              className="filter-input"
                            />
                          </div>

                          {/* Job Title Input */}
                          <div className="filter-input-wrapper">
                            <svg className="input-icon" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                              <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
                            </svg>
                            <input
                              type="text"
                              placeholder="Job title (e.g., Frontend Developer)"
                              value={filterTitle}
                              onChange={(e) => setFilterTitle(e.target.value)}
                              className="filter-input"
                            />
                          </div>

                          {/* Location Input */}
                          <div className="filter-input-wrapper">
                            <svg className="input-icon" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                            </svg>
                            <input
                              type="text"
                              placeholder="Location (e.g., New York, Remote)"
                              value={filterLocation}
                              onChange={(e) => setFilterLocation(e.target.value)}
                              className="filter-input"
                            />
                          </div>

                          {/* Skills Input */}
                          <div className="filter-input-wrapper">
                            <svg className="input-icon" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.854 4.854a.5.5 0 1 0-.708-.708l-3.5 3.5a.5.5 0 0 0 0 .708l3.5 3.5a.5.5 0 0 0 .708-.708L2.707 8l3.147-3.146zm4.292 0a.5.5 0 0 1 .708-.708l3.5 3.5a.5.5 0 0 1 0 .708l-3.5 3.5a.5.5 0 0 1-.708-.708L13.293 8l-3.147-3.146z"/>
                            </svg>
                            <input
                              type="text"
                              placeholder="Skills (e.g., React, Node.js, Python)"
                              value={filterSkills}
                              onChange={(e) => setFilterSkills(e.target.value)}
                              className="filter-input"
                            />
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-apply"
                            onClick={async () => {
                              const combined = [
                                searchTerm,
                                filterTitle,
                                filterLocation,
                                filterSkills
                              ].filter(t => t && t.trim()).join(' ');
                              setAppliedSearch(combined);
                              await loadJobs(combined);
                              // Explicitly track search terms when user clicks search
                              await trackSearchTerms(true);
                            }}
                            style={{ marginTop: '0', width: 'auto', padding: '12px 24px' }}
                          >
                            🔍 Search & Track
                          </button>
                          {(searchTerm || filterTitle || filterLocation || filterSkills) && (
                            <button className="btn-clear-filters" onClick={handleClearSearch}>
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sort and Results Count */}
                    {!showRecommendations && (
                      <div className="sort-bar">
                        <div className="results-count">
                          Showing {getPaginatedJobs().length} of {getFilteredJobs().length} jobs
                        </div>
                        <div className="sort-wrapper">
                          <label htmlFor="sort-select">Sort by:</label>
                          <select 
                            id="sort-select"
                            value={sortBy} 
                            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                            className="sort-select"
                          >
                            <option value="recent">Most Recent</option>
                            <option value="salaryHigh">Salary: High to Low</option>
                            <option value="salaryLow">Salary: Low to High</option>
                          </select>
                        </div>
                      </div>
                    )}

                  {showRecommendations && (
                    <div className="recommendation-panels">
                      <div className="recommendation-panel">
                        <div className="panel-heading">
                          <h3>Personalized suggestions</h3>
                          <span>
                            Using: {recommendations.keywords?.join(', ') || 'recent searches'}
                          </span>
                        </div>
                        {recommendationLoading ? (
                          <p className="muted">Crunching signals...</p>
                        ) : (
                          <>
                            <div className="panel-subsection">
                              <h4>Best match</h4>
                              {recommendations.personalized?.length ? (
                                recommendations.personalized.slice(0, 3).map(renderCompactJobCard)
                              ) : (
                                <p className="muted">Search or add keywords to get stronger recommendations.</p>
                              )}
                            </div>
                            <div className="panel-subsection">
                              <h4>People like you applied for</h4>
                              {recommendations.collaborative?.length ? (
                                recommendations.collaborative.slice(0, 3).map(renderCompactJobCard)
                              ) : (
                                <p className="muted">No peer signals yet.</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="recommendation-panel secondary">
                        <h3>Job market trends</h3>
                        {recommendationLoading ? (
                          <p className="muted">Fetching the latest pulse...</p>
                        ) : (
                          <div className="trend-list">
                            {recommendations.trends?.map((trend) => (
                              <a
                                key={trend.url || trend.headline}
                                href={trend.url || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="trend-card"
                              >
                                <h4>{trend.headline}</h4>
                                <p className="muted">{trend.source}</p>
                                <p>{trend.summary}</p>
                              </a>
                            ))}
                          </div>
                        )}

                        <form className="keywords-form" onSubmit={handleKeywordSave}>
                          <label htmlFor="keywords-input">
                            Add keywords so we can tailor matches:
                          </label>
                          <input
                            id="keywords-input"
                            type="text"
                            placeholder="e.g. react, fintech, remote"
                            value={profileKeywordsInput}
                            onChange={(e) => setProfileKeywordsInput(e.target.value)}
                          />
                          <button type="submit" className="btn-apply">
                            Save keywords
                          </button>
                          {keywordStatus && (
                            <p className={`keywords-status ${keywordStatus.type}`}>
                              {keywordStatus.message}
                            </p>
                          )}
                        </form>
                      </div>
                    </div>
                  )}

                  {(!showRecommendations ? getPaginatedJobs() : recommendationJobs).length === 0 ? (
                    <p className="no-jobs-msg">
                      {showRecommendations
                        ? 'No personalized matches yet. Try adding keywords or running a search.'
                        : 'No jobs available'}
                    </p>
                  ) : (
                    <>
                      {/* Section Title for Recommendations */}
                      {showRecommendations && (
                        <div className="recommended-jobs-header">
                          <h2 className="recommended-jobs-title">Jobs Recommended For You</h2>
                          <p className="recommended-jobs-subtitle">
                            Based on your searches, profile keywords, and trending job market insights
                          </p>
                        </div>
                      )}
                      
                      <div className="jobs-grid">
                        {(showRecommendations ? recommendationJobs : getPaginatedJobs()).map(job => (
                          <div key={job._id} className="job-card">
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
                            <div className="job-card-actions">
                              <button
                                type="button"
                                className="btn-apply-gradient"
                                onClick={() => handleApply(job._id)}
                              >
                                Apply Now
                              </button>
                              <button
                                type="button"
                                className={`btn-save-job-card ${savedJobs.has(job._id) ? 'saved' : ''}`}
                                onClick={(e) => {
                                  console.log('Save button clicked!');
                                  handleSaveJob(job._id, e);
                                }}
                                disabled={savingJobId === job._id}
                                title={savedJobs.has(job._id) ? 'Remove from saved jobs' : 'Save this job'}
                                onMouseDown={(e) => e.preventDefault()}
                                onTouchStart={(e) => e.preventDefault()}
                              >
                                <span style={{ fontSize: '16px' }}>
                                  {savedJobs.has(job._id) ? '❤️' : '🤍'}
                                </span>
                                <span>{savedJobs.has(job._id) ? 'Saved' : 'Save'}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination - Only show for browse jobs, not recommendations */}
                      {!showRecommendations && getTotalPages() > 1 && (
                        <div className="pagination">
                          <button 
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path fillRule="evenodd" d="M12 8a.5.5 0 0 1-.5.5H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5a.5.5 0 0 1 .5.5z"/>
                            </svg>
                            Previous
                          </button>
                          <span className="pagination-info">
                            Page {currentPage} of {getTotalPages()}
                          </span>
                          <button 
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === getTotalPages()}
                          >
                            Next
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path fillRule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8z"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;

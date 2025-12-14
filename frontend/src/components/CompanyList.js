import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { companyAPI } from '../api';
import '../styles/CompanyList.css';

const FILE_BASE_URL = 'http://localhost:5000';

const CompanyList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await companyAPI.getAllCompanies();
      setCompanies(response.data.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  // Filter companies based on search and location
  const getFilteredCompanies = () => {
    let filtered = [...companies];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.name?.toLowerCase().includes(term) ||
        company.description?.toLowerCase().includes(term) ||
        company.bio?.toLowerCase().includes(term)
      );
    }

    if (filterLocation.trim()) {
      const location = filterLocation.toLowerCase();
      filtered = filtered.filter(company =>
        company.location?.toLowerCase().includes(location)
      );
    }

    return filtered;
  };

  const filteredCompanies = getFilteredCompanies();

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="navbar-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={() => navigate('/applicant/dashboard')} className="btn-secondary">Dashboard</button>
          <button onClick={() => navigate('/profile')} className="btn-secondary">My Profile</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="sidebar">
          <button
            className="nav-btn"
            onClick={() => navigate('/applicant/dashboard')}
          >
            Browse Jobs
          </button>
          <button
            className="nav-btn active"
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
            <div className="loading">Loading companies...</div>
          ) : (
            <div className="companies-section">
              <div className="companies-header">
                <h2>Explore Companies</h2>
                <p className="companies-subtitle">Discover companies and view their analytics</p>
              </div>

              <div className="companies-filter-card">
                <div className="filter-inputs">
                  <div className="filter-input-wrapper">
                    <svg className="input-icon" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Search companies by name, description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="filter-input"
                    />
                  </div>

                  <div className="filter-input-wrapper">
                    <svg className="input-icon" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    <input
                      type="text"
                      placeholder="Filter by location..."
                      value={filterLocation}
                      onChange={(e) => setFilterLocation(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </div>

                {(searchTerm || filterLocation) && (
                  <button 
                    className="btn-clear-filters" 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterLocation('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              <div className="companies-count">
                Showing {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
              </div>

              {filteredCompanies.length === 0 ? (
                <p className="no-companies-msg">No companies found</p>
              ) : (
                <div className="companies-grid">
                  {filteredCompanies.map(company => (
                    <div 
                      key={company._id} 
                      className="company-card"
                      onClick={() => navigate(`/companies/${company._id}/analytics`)}
                    >
                      <div className="company-card-header">
                        {company.logoUrl ? (
                          <img 
                            src={getFileUrl(company.logoUrl)} 
                            alt={company.name} 
                            className="company-card-logo"
                          />
                        ) : (
                          <div className="company-card-logo-placeholder">
                            🏢
                          </div>
                        )}
                        <div className="company-card-info">
                          <h3>{company.name}</h3>
                          {company.location && (
                            <p className="company-location">
                              <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                              </svg>
                              {company.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {company.bio && (
                        <div className="company-bio">
                          <p>{company.bio.length > 150 ? `${company.bio.substring(0, 150)}...` : company.bio}</p>
                        </div>
                      )}

                      {company.description && (
                        <div className="company-description">
                          <p>{company.description.length > 120 ? `${company.description.substring(0, 120)}...` : company.description}</p>
                        </div>
                      )}

                      {company.website && (
                        <div className="company-website">
                          <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
                          </svg>
                          <a href={company.website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            Visit Website
                          </a>
                        </div>
                      )}

                      <div className="company-card-footer">
                        <button className="btn-view-analytics">
                          📊 View Analytics
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyList;


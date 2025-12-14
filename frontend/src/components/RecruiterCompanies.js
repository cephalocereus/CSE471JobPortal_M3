import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { companyAPI } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/Profile.css';

const FILE_BASE_URL = 'http://localhost:5000';

const RecruiterCompanies = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCompanies = async () => {
    try {
      const response = await companyAPI.getCompanies();
      setCompanies(response.data.companies || []);
    } catch (err) {
      console.error('Error loading companies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (!filter.trim()) return companies;
    const term = filter.toLowerCase();
    return companies.filter(c => c.name?.toLowerCase().includes(term));
  }, [companies, filter]);

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <div className="profile-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="profile-actions">
          <button className="btn-secondary" onClick={() => navigate('/recruiter/dashboard')}>Dashboard</button>
          <button className="btn-primary" onClick={() => navigate('/recruiter/company/new')}>Set New Company</button>
          <button className="btn-logout" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
        </div>
      </nav>

      <div className="profile-hero">
        <button className="btn-link" onClick={() => navigate('/recruiter/dashboard')}>← Go Back</button>
        <div className="company-list-card">
          <div className="company-list-header">
            <input
              className="company-filter"
              placeholder="Filter by name"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <button className="btn-primary" onClick={() => navigate('/recruiter/company/new')}>Set New Company</button>
          </div>

          <div className="company-table">
            <div className="company-row head">
              <div>Logo</div>
              <div>Name</div>
              <div>Date</div>
              <div>Action</div>
            </div>
            {loading ? (
              <div className="company-row"><div>Loading...</div></div>
            ) : filteredCompanies.length === 0 ? (
              <div className="company-row"><div>No companies found</div></div>
            ) : (
              filteredCompanies.map(company => (
                <div key={company._id} className="company-row">
                  <div>
                    {company.logoUrl ? (
                      <img src={getFileUrl(company.logoUrl)} alt={company.name} className="company-logo" />
                    ) : (
                      <div className="company-logo placeholder">🏢</div>
                    )}
                  </div>
                  <div>{company.name}</div>
                  <div>{new Date(company.createdAt).toISOString().split('T')[0]}</div>
                  <div className="company-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/recruiter/company/${company._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-analytics"
                      onClick={() => navigate(`/recruiter/company/${company._id}/analytics`)}
                    >
                      📊 Analytics
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCompanies;


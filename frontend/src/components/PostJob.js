import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI, companyAPI, authAPI } from '../api';
import '../styles/PostJob.css';

const PostJob = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: '',
    jobType: 'Full-time',
    experience: '',
    skills: '',
    positions: 1,
    companyId: ''
  });
  const [returnFromCompanySetup, setReturnFromCompanySetup] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadUserProfile();
    
    // Check if returning from company setup
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'company-setup') {
      setReturnFromCompanySetup(true);
      // Reload companies after returning
      setTimeout(() => {
        loadCompanies();
        loadUserProfile();
      }, 500);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      const userData = response.data.user;
      // If user belongs to a company, set it as default
      if (userData.companyId) {
        setFormData(prev => ({ ...prev, companyId: userData.companyId._id || userData.companyId }));
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      // Get companies the recruiter created
      const createdResponse = await companyAPI.getCompanies();
      const createdCompanies = createdResponse.data.companies || [];

      // Get user profile to check if they belong to a company
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data.user;
      
      let availableCompanies = [...createdCompanies];
      
      // If user belongs to a company, add it to the list if not already there
      if (userData.companyId) {
        const companyId = userData.companyId._id || userData.companyId;
        const belongsToCompany = createdCompanies.find(c => c._id === companyId);
        if (!belongsToCompany && userData.companyId.name) {
          // Add the company they belong to
          availableCompanies.push({
            _id: companyId,
            name: userData.companyId.name,
            ...userData.companyId
          });
        }
      }

      setCompanies(availableCompanies);
    } catch (err) {
      console.error('Error loading companies:', err);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-fill company name when company is selected
      if (name === 'companyId' && value) {
        const selectedCompany = companies.find(c => c._id === value);
        if (selectedCompany) {
          updated.company = selectedCompany.name;
        }
      }
      return updated;
    });
  };

  const handleSetNewCompany = () => {
    // Navigate to company setup with return URL
    navigate('/recruiter/company/new?returnTo=post-job');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate company selection - recruiter must select a company if they have one
      // If they don't have any companies, they can still post (independent recruiter)
      if (companies.length > 0 && !formData.companyId) {
        setError('Please select a company to post this job');
        setLoading(false);
        return;
      }

      // Get company name from selected company
      const selectedCompany = companies.find(c => c._id === formData.companyId);
      const companyName = selectedCompany ? selectedCompany.name : formData.company;

      const data = {
        ...formData,
        company: companyName, // Use company name from selected company
        companyId: formData.companyId || null,
        skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
        positions: Number(formData.positions) || 1
      };
      await jobAPI.createJob(data);
      alert('Job posted successfully!');
      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-container">
      <div className="post-job-card">
        <h2>Post a New Job</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="jobTitle">Job Title *</label>
            <input
              type="text"
              id="jobTitle"
              name="title"
              placeholder="e.g., Senior React Developer"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyId">Select Company *</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                {companies.length > 0 ? (
                  <select
                    id="companyId"
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                    required
                    disabled={loadingCompanies}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                  >
                    <option value="">Select a company...</option>
                    {companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p style={{ color: '#666', fontStyle: 'italic' }}>No companies available. Please set up a company first.</p>
                )}
                {loadingCompanies && <small>Loading companies...</small>}
              </div>
              <button
                type="button"
                onClick={handleSetNewCompany}
                className="btn-secondary"
                style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
              >
                ➕ Set New Company
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description *</label>
            <textarea
              id="description"
              name="description"
              placeholder="Detailed job description..."
              rows="6"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="jobType">Job Type *</label>
              <select id="jobType" name="jobType" value={formData.jobType} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="salary">Salary</label>
              <input
                type="text"
                id="salary"
                name="salary"
                placeholder="e.g., $80k - $120k"
                value={formData.salary}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="positions">Vacant Positions</label>
              <input
                type="number"
                id="positions"
                name="positions"
                min="1"
                value={formData.positions}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="experience">Experience Required</label>
            <input
              type="text"
              id="experience"
              name="experience"
              placeholder="e.g., 2-3 years"
              value={formData.experience}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="skills">Required Skills (comma-separated)</label>
            <input
              type="text"
              id="skills"
              name="skills"
              placeholder="React, Node.js, MongoDB, etc."
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJob;

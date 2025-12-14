import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { companyAPI } from '../api';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'applicant',
    companyId: ''
  });
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load companies when role is set to recruiter
    if (formData.role === 'recruiter') {
      loadCompanies();
    }
  }, [formData.role]);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await companyAPI.getCompaniesPublic();
      setCompanies(response.data.companies || []);
    } catch (err) {
      console.error('Error loading companies:', err);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // For recruiters, send companyId (null if "Not Applicable" is selected)
      const companyId = formData.role === 'recruiter' 
        ? (formData.companyId === 'null' || formData.companyId === '' ? null : formData.companyId)
        : null;
      
      await register(formData.name, formData.email, formData.password, formData.role, companyId);
      navigate(formData.role === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="registerName">Full Name</label>
            <input
              type="text"
              id="registerName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="registerEmail">Email</label>
            <input
              type="email"
              id="registerEmail"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="registerPassword">Password</label>
            <input
              type="password"
              id="registerPassword"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="registerRole">Role</label>
            <select id="registerRole" name="role" value={formData.role} onChange={handleChange}>
              <option value="applicant">Job Applicant</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          {formData.role === 'recruiter' && (
            <div className="form-group">
              <label htmlFor="registerCompany">Company You Belong To</label>
              <select
                id="registerCompany"
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                disabled={loadingCompanies}
              >
                <option value="">Select a company...</option>
                <option value="null">Not Applicable / Independent Recruiter</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {loadingCompanies && <small>Loading companies...</small>}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

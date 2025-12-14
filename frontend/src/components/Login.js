import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/Auth.css';

const Login = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [suspiciousWarning, setSuspiciousWarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTestMode, setShowTestMode] = useState(false);
  const [testModeData, setTestModeData] = useState({
    simulatedCountry: '',
    simulatedIP: '',
    simulatedDevice: ''
  });
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Check for success message from password reset
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuspiciousWarning(null);
    setLoading(true);

    try {
      // Include test mode data if enabled
      const loginData = { 
        email: formData.email, 
        password: formData.password
      };
      
      if (showTestMode) {
        loginData.testMode = true;
        if (testModeData.simulatedCountry) loginData.simulatedCountry = testModeData.simulatedCountry;
        if (testModeData.simulatedIP) loginData.simulatedIP = testModeData.simulatedIP;
        if (testModeData.simulatedDevice) loginData.simulatedDevice = testModeData.simulatedDevice;
      }
      
      const response = await login(loginData.email, loginData.password, loginData);
      
      // Check for suspicious login warning
      if (response.suspiciousLogin) {
        setSuspiciousWarning(response.suspiciousLogin);
        // Still navigate but show warning
        setTimeout(() => {
          const role = response.user.role;
          navigate(role === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
        }, 3000);
      } else {
        const role = response.user.role;
        navigate(role === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {successMessage && <div className="success-message">{successMessage}</div>}
        {error && <div className="error-message">{error}</div>}
        {suspiciousWarning && (
          <div className="suspicious-warning">
            <strong>⚠️ Security Alert:</strong> {suspiciousWarning.message}
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              Reasons: {suspiciousWarning.reasons.join(', ')}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input
              type="email"
              id="loginEmail"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input
              type="password"
              id="loginPassword"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="forgot-password-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Test Mode Toggle (for demonstration) */}
        <div className="test-mode-section">
          <button 
            type="button"
            className="test-mode-toggle"
            onClick={() => setShowTestMode(!showTestMode)}
          >
            🧪 {showTestMode ? 'Hide' : 'Show'} Test Mode (For Demo)
          </button>
          
          {showTestMode && (
            <div className="test-mode-fields">
              <p className="test-mode-note">
                <strong>Test Mode:</strong> Simulate suspicious login conditions for demonstration
              </p>
              <div className="form-group">
                <label htmlFor="simulatedCountry">Simulated Country (e.g., US, UK, BD)</label>
                <input
                  type="text"
                  id="simulatedCountry"
                  placeholder="e.g., US"
                  value={testModeData.simulatedCountry}
                  onChange={(e) => setTestModeData({...testModeData, simulatedCountry: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="simulatedIP">Simulated IP Address</label>
                <input
                  type="text"
                  id="simulatedIP"
                  placeholder="e.g., 8.8.8.8"
                  value={testModeData.simulatedIP}
                  onChange={(e) => setTestModeData({...testModeData, simulatedIP: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label htmlFor="simulatedDevice">Simulated Device</label>
                <input
                  type="text"
                  id="simulatedDevice"
                  placeholder="e.g., Firefox on Linux"
                  value={testModeData.simulatedDevice}
                  onChange={(e) => setTestModeData({...testModeData, simulatedDevice: e.target.value})}
                />
              </div>
            </div>
          )}
        </div>

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

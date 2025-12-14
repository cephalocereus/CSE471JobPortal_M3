import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../api';
import '../styles/Auth.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState(location.state?.email || '');
  const [token, setToken] = useState(location.state?.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(token ? 2 : 1); // Step 1: Enter code, Step 2: Reset password

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await authAPI.verifyResetToken(email, token);
      setMessage('Code verified successfully!');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword(email, token, newPassword);
      setMessage(response.data.message);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Password reset successful! Please login with your new password.' } });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>
            {step === 1 
              ? 'Enter the reset code sent to your email' 
              : 'Create a new password for your account'}
          </p>
        </div>

        {message && (
          <div className="alert alert-success">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerifyToken} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="token">Reset Code</label>
              <input
                type="text"
                id="token"
                placeholder="Enter 6-character code"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                maxLength={6}
                required
                disabled={loading}
                style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600' }}
              />
              <small className="form-hint">Enter the 6-character code you received</small>
            </div>

            <button 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
              <small className="form-hint">Must be at least 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="btn-auth" 
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <button 
            className="link-button"
            onClick={() => navigate('/login')}
          >
            ← Back to Login
          </button>
          
          {step === 1 && (
            <button 
              className="link-button"
              onClick={() => navigate('/forgot-password')}
            >
              Resend Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


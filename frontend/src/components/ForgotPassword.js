import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetToken('');

    try {
      const response = await authAPI.forgotPassword(email);
      setMessage(response.data.message);
      
      // In development mode, the backend sends the token
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
      }
      
      // Auto-redirect to reset page after 2 seconds if we have the token
      if (response.data.resetToken) {
        setTimeout(() => {
          navigate('/reset-password', { state: { email, token: response.data.resetToken } });
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email address and we'll send you a code to reset your password</p>
        </div>

        {message && (
          <div className="alert alert-success">
            {message}
            {resetToken && (
              <div className="reset-token-display">
                <strong>Your Reset Code:</strong>
                <div className="token-code">{resetToken}</div>
                <small>This code expires in 15 minutes</small>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !!resetToken}
            />
          </div>

          <button 
            type="submit" 
            className="btn-auth" 
            disabled={loading || !!resetToken}
          >
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="auth-footer">
          <button 
            className="link-button"
            onClick={() => navigate('/login')}
          >
            ← Back to Login
          </button>
          
          {resetToken && (
            <button 
              className="link-button link-button-primary"
              onClick={() => navigate('/reset-password', { state: { email, token: resetToken } })}
            >
              Continue to Reset Password →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


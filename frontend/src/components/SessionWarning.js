import React, { useState, useEffect } from 'react';
import '../styles/SessionWarning.css';

/**
 * Session Timeout Warning Modal
 * Shows when user has 1 minute remaining before auto-logout
 */
const SessionWarning = ({ isVisible, onContinue, onLogout, timeRemaining = 60 }) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    if (!isVisible) return;

    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, onLogout]);

  // Reset countdown when visibility changes
  useEffect(() => {
    if (isVisible) {
      setCountdown(timeRemaining);
    }
  }, [isVisible, timeRemaining]);

  if (!isVisible) return null;

  return (
    <div className="session-warning-overlay">
      <div className="session-warning-modal">
        <div className="session-warning-header">
          <div className="warning-icon">⚠️</div>
          <h2>Session Expiring Soon</h2>
        </div>

        <div className="session-warning-content">
          <p className="warning-message">
            Your session will expire in <strong>{countdown} second{countdown !== 1 ? 's' : ''}</strong> due to inactivity.
          </p>
          <p className="warning-note">
            Would you like to continue browsing?
          </p>
        </div>

        <div className="countdown-bar">
          <div
            className="countdown-progress"
            style={{
              width: `${(countdown / timeRemaining) * 100}%`
            }}
          />
        </div>

        <div className="session-warning-actions">
          <button
            className="btn-continue-session"
            onClick={onContinue}
            autoFocus
          >
            Continue Session
          </button>
          <button
            className="btn-logout-now"
            onClick={onLogout}
          >
            Logout Now
          </button>
        </div>

        <div className="session-warning-footer">
          <p className="info-text">
            💡 Your work will be automatically saved before logout.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionWarning;

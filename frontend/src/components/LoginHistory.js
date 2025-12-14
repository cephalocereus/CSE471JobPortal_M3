import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginActivityAPI } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/LoginHistory.css';

const LoginHistory = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, suspicious, normal
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        loginActivityAPI.getLoginHistory(100),
        loginActivityAPI.getLoginStats()
      ]);
      
      setLoginHistory(historyResponse.data.loginHistory);
      setStats(statsResponse.data.stats);
    } catch (err) {
      console.error('Error fetching login history:', err);
      setError(err.response?.data?.message || 'Failed to load login history');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (loginId) => {
    try {
      await loginActivityAPI.acknowledgeLogin(loginId);
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error('Error acknowledging login:', err);
      alert('Failed to acknowledge login');
    }
  };

  const filteredHistory = loginHistory.filter(login => {
    if (filter === 'suspicious') return login.isSuspicious;
    if (filter === 'normal') return !login.isSuspicious;
    return true;
  });

  const getStatusBadge = (login) => {
    if (login.isSuspicious) {
      return <span className="badge badge-suspicious">Suspicious</span>;
    }
    if (login.isTestMode) {
      return <span className="badge badge-test">Test Mode</span>;
    }
    return <span className="badge badge-normal">Normal</span>;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReasonText = (reason) => {
    const reasons = {
      'new_ip': 'New IP Address',
      'new_country': 'New Country',
      'new_device': 'New Device',
      'new_browser': 'New Browser',
      'new_os': 'New Operating System',
      'unusual_time': 'Unusual Login Time',
      'multiple_failed_attempts': 'Multiple Failed Attempts',
      'test_mode_simulation': 'Test Mode'
    };
    return reasons[reason] || reason;
  };

  if (loading) {
    return (
      <div className="login-history-page">
        <div className="loading">Loading login history...</div>
      </div>
    );
  }

  return (
    <div className="login-history-page">
      <nav className="login-history-nav">
        <div className="nav-brand">
          <h1>Login Activity</h1>
        </div>
        <div className="nav-actions">
          <button className="btn-secondary" onClick={() => navigate(user?.role === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard')}>
            Dashboard
          </button>
          <button className="btn-logout" onClick={async () => { await logout(); navigate('/login'); }}>
            Logout
          </button>
        </div>
      </nav>

      <div className="login-history-container">
        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalLogins}</div>
              <div className="stat-label">Total Logins</div>
            </div>
            <div className="stat-card stat-suspicious">
              <div className="stat-value">{stats.suspiciousCount}</div>
              <div className="stat-label">Suspicious Logins</div>
              <div className="stat-percentage">{stats.suspiciousRate}%</div>
            </div>
            <div className="stat-card stat-failed">
              <div className="stat-value">{stats.failedAttempts}</div>
              <div className="stat-label">Failed Attempts</div>
            </div>
            <div className="stat-card stat-devices">
              <div className="stat-value">{stats.uniqueDevicesCount}</div>
              <div className="stat-label">Unique Devices</div>
            </div>
            <div className="stat-card stat-ips">
              <div className="stat-value">{stats.uniqueIPsCount}</div>
              <div className="stat-label">Unique IPs</div>
            </div>
            <div className="stat-card stat-countries">
              <div className="stat-value">{stats.uniqueCountriesCount}</div>
              <div className="stat-label">Countries</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({loginHistory.length})
            </button>
            <button
              className={`filter-btn ${filter === 'suspicious' ? 'active' : ''}`}
              onClick={() => setFilter('suspicious')}
            >
              Suspicious ({loginHistory.filter(l => l.isSuspicious).length})
            </button>
            <button
              className={`filter-btn ${filter === 'normal' ? 'active' : ''}`}
              onClick={() => setFilter('normal')}
            >
              Normal ({loginHistory.filter(l => !l.isSuspicious).length})
            </button>
          </div>
        </div>

        {/* Login History List */}
        <div className="history-list">
          <h3>Login History</h3>
          {filteredHistory.length === 0 ? (
            <div className="no-data">No login history found</div>
          ) : (
            filteredHistory.map(login => (
              <div key={login._id} className={`login-card ${login.isSuspicious ? 'suspicious' : ''}`}>
                <div className="login-header">
                  <div className="login-time">
                    <span className="time-icon">🕒</span>
                    {formatDate(login.loginTime)}
                  </div>
                  {getStatusBadge(login)}
                </div>

                <div className="login-details">
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">
                      {login.ipInfo?.city || 'Unknown'}, {login.ipInfo?.countryName || login.ipInfo?.country || 'Unknown'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">🌐</span>
                    <span className="detail-label">IP Address:</span>
                    <span className="detail-value">{login.ipAddress || 'N/A'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">💻</span>
                    <span className="detail-label">Device:</span>
                    <span className="detail-value">
                      {login.device?.browser || 'Unknown'} on {login.device?.os || 'Unknown'}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">🏢</span>
                    <span className="detail-label">ISP:</span>
                    <span className="detail-value">{login.ipInfo?.org || 'Unknown'}</span>
                  </div>

                  {login.isSuspicious && login.suspiciousReasons && login.suspiciousReasons.length > 0 && (
                    <div className="suspicious-reasons">
                      <strong>Suspicious Indicators:</strong>
                      <div className="reasons-list">
                        {login.suspiciousReasons.map((reason, idx) => (
                          <span key={idx} className="reason-tag">
                            {getReasonText(reason)}
                          </span>
                        ))}
                      </div>
                      {login.alertSent && (
                        <div className="alert-sent">
                          Alert email sent on {formatDate(login.alertSentAt)}
                        </div>
                      )}
                      <button
                        className="btn-acknowledge"
                        onClick={() => handleAcknowledge(login._id)}
                      >
                        Mark as Reviewed
                      </button>
                    </div>
                  )}

                  {login.isTestMode && login.testModeData && (
                    <div className="test-mode-info">
                      <strong>Test Mode Simulation:</strong>
                      {login.testModeData.simulatedCountry && (
                        <div>Simulated Country: {login.testModeData.simulatedCountry}</div>
                      )}
                      {login.testModeData.simulatedIP && (
                        <div>Simulated IP: {login.testModeData.simulatedIP}</div>
                      )}
                      {login.testModeData.simulatedDevice && (
                        <div>Simulated Device: {login.testModeData.simulatedDevice}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;


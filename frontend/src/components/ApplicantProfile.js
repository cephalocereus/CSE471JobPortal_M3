import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, jobAPI } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/Profile.css';

const FILE_BASE_URL = 'http://localhost:5000';

const ApplicantProfile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const resumeInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data.user);
    } catch (err) {
      console.error('Error loading profile', err);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await jobAPI.getApplications();
      setApplications(response.data.applications || []);
    } catch (err) {
      console.error('Error loading applications', err);
    }
  };

  const getFileUrl = (relativePath) => {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    return `${FILE_BASE_URL}${relativePath}`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/applicant/dashboard');
  };

  const handleAddSkills = async () => {
    const initial = (profile?.skills || []).join(', ');
    const value = window.prompt('Add skills separated by commas', initial);
    if (value === null) return;
    const skills = value
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      const formData = new FormData();
      skills.forEach(skill => formData.append('skills', skill));
      const response = await authAPI.updateProfile(formData);
      setProfile(response.data.user);
      alert('Skills updated');
    } catch (err) {
      alert('Could not update skills');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('resume', file);
      const response = await authAPI.updateProfile(formData);
      setProfile(response.data.user);
      alert('Resume uploaded');
    } catch (err) {
      alert('Could not upload resume');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleNotifications = () => {
    alert('No new notifications');
  };

  const handleResetPassword = async () => {
    const currentPassword = window.prompt('Enter current password');
    if (!currentPassword) return;
    const newPassword = window.prompt('Enter new password');
    if (!newPassword) return;
    try {
      await authAPI.updatePassword(currentPassword, newPassword);
      alert('Password updated. Please log in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not update password');
    }
  };

  const formatStatus = (status) => {
    if (status === 'Applied' || status === 'Reviewed') return 'Pending';
    return status;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <div className="profile-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="profile-actions">
          <span className="welcome-text">Welcome, {profile?.name}</span>
          <button className="btn-secondary" onClick={handleBack}>My Dashboard</button>
          <button className="btn-primary" onClick={handleEditProfile}>My Profile</button>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="profile-hero">
        <button className="btn-link" onClick={handleBack}>← Go Back</button>
        <div className="profile-card">
          <div className="profile-top">
            <div className="avatar-wrapper">
              {profile?.avatarUrl ? (
                <img src={getFileUrl(profile.avatarUrl)} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">👤</div>
              )}
            </div>
            <div className="profile-info">
              <h2><span className="muted">Username:</span> {profile?.name}</h2>
              <p className="muted">Bio: <span className="value">{profile?.bio || 'No bio added'}</span></p>
              <p className="muted">📞 Phone: <span className="value">{profile?.phoneNumber || 'Not added'}</span></p>
              <p className="muted">✉️ Email: <span className="value">{profile?.email}</span></p>
              <p className="muted">
                Skills:&nbsp;
                <span className="value">
                  {(profile?.skills?.length ? profile.skills.join(', ') : 'No skills added')}
                </span>
              </p>
            </div>
            <div className="profile-quick-actions">
              <button className="btn-secondary" onClick={handleAddSkills} disabled={saving}>+ Add Skills</button>
              <div className="upload-row">
                <button className="btn-secondary" onClick={handleResumeClick} disabled={saving}>Resume</button>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  ref={resumeInputRef}
                  className="hidden-input"
                  onChange={handleResumeChange}
                />
                <button
                  className="btn-secondary"
                  onClick={() => profile?.resumeUrl && window.open(getFileUrl(profile.resumeUrl), '_blank')}
                  disabled={!profile?.resumeUrl}
                >
                  Show Resume
                </button>
              </div>
              <div className="icon-row">
                <button className="icon-btn" onClick={handleEditProfile} title="Edit profile">✏️</button>
                <button className="icon-btn" onClick={handleNotifications} title="Notifications">🔔</button>
                <button className="icon-btn" onClick={handleResetPassword} title="Reset password">🔑</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="applications-section">
        <h3>Applied Jobs</h3>
        <div className="applications-table">
          <div className="table-row table-head">
            <div>Date</div>
            <div>Job Role</div>
            <div>Company</div>
            <div>Status</div>
          </div>
          {applications.length === 0 ? (
            <div className="table-row empty-row">
              <div colSpan="4">No applications yet</div>
            </div>
          ) : (
            applications.map(app => (
              <div key={app._id} className="table-row">
                <div>{new Date(app.createdAt).toLocaleDateString()}</div>
                <div>{app.jobId?.title || '-'}</div>
                <div>{app.jobId?.company || '-'}</div>
                <div>
                  <span className={`status-pill ${formatStatus(app.status).toLowerCase()}`}>
                    {formatStatus(app.status)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfile;


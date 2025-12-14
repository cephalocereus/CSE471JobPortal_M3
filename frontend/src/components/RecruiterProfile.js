import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuth } from '../AuthContext';
import '../styles/Profile.css';

const FILE_BASE_URL = 'http://localhost:5000';

const RecruiterProfile = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    companyLocation: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const user = response.data.user;
        setProfile(user);
        setForm({
          companyName: user?.companyName || '',
          companyWebsite: user?.companyWebsite || '',
          companyDescription: user?.companyDescription || '',
          companyLocation: user?.companyLocation || ''
        });
        if (user?.companyLogoUrl) {
          setLogoPreview(user.companyLogoUrl.startsWith('http') ? user.companyLogoUrl : `${FILE_BASE_URL}${user.companyLogoUrl}`);
        }
      } catch (err) {
        console.error('Error loading profile', err);
      }
    };
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('companyName', form.companyName);
      formData.append('companyWebsite', form.companyWebsite);
      formData.append('companyDescription', form.companyDescription);
      formData.append('companyLocation', form.companyLocation);
      if (logoFile) formData.append('companyLogo', logoFile);

      const response = await authAPI.updateCompanyProfile(formData);
      setProfile(response.data.user);
      alert('Company profile updated');
    } catch (err) {
      alert('Could not update company profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <div className="profile-brand">
          <h1>Job Portal</h1>
        </div>
        <div className="profile-actions">
          <button className="btn-secondary" onClick={() => navigate('/recruiter/dashboard')}>Dashboard</button>
          <button className="btn-secondary" onClick={handleResetPassword}>Reset Password</button>
          <button className="btn-primary" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="profile-hero">
        <button className="btn-link" onClick={() => navigate('/recruiter/dashboard')}>← Go Back</button>

        <div className="edit-card">
          <h2>Company Profile</h2>
          <form className="edit-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Company Name</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} />
            </div>
            <div className="form-row">
              <label>Website</label>
              <input name="companyWebsite" value={form.companyWebsite} onChange={handleChange} placeholder="https://company.com" />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea name="companyDescription" value={form.companyDescription} onChange={handleChange} rows={3} />
            </div>
            <div className="form-row">
              <label>Location</label>
              <input name="companyLocation" value={form.companyLocation} onChange={handleChange} placeholder="City, Country" />
            </div>
            <div className="form-row">
              <label>Company Logo</label>
              <div className="upload-box">
                <input type="file" accept="image/*" onChange={handleLogo} />
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="avatar-preview" />
                ) : (
                  <span className="muted">Choose image (PNG, JPG, GIF - Max 5MB)</span>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>Save Changes</button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/recruiter/dashboard')}>Cancel</button>
            </div>
          </form>
        </div>

        {profile && (
          <div className="profile-card compact">
            <h3>Current Info</h3>
            <p className="muted">Company: <span className="value">{profile.companyName || 'Not set'}</span></p>
            <p className="muted">Website: <span className="value">{profile.companyWebsite || 'Not set'}</span></p>
            <p className="muted">Location: <span className="value">{profile.companyLocation || 'Not set'}</span></p>
            <p className="muted">Description: <span className="value">{profile.companyDescription || 'Not set'}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecruiterProfile;


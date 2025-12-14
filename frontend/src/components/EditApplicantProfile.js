import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import '../styles/Profile.css';

const FILE_BASE_URL = 'http://localhost:5000';

const EditApplicantProfile = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    bio: '',
    skills: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        const user = response.data.user;
        setForm({
          name: user?.name || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
          bio: user?.bio || '',
          skills: (user?.skills || []).join(', ')
        });
        if (user?.avatarUrl) {
          setAvatarPreview(user.avatarUrl.startsWith('http') ? user.avatarUrl : `${FILE_BASE_URL}${user.avatarUrl}`);
        }
        if (user?.resumeUrl) {
          const segments = user.resumeUrl.split('/');
          setResumeName(segments[segments.length - 1]);
        }
      } catch (err) {
        console.error('Error loading profile', err);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleResume = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeFile(file);
    setResumeName(file.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phoneNumber', form.phoneNumber);
      formData.append('bio', form.bio);
      form.skills.split(',').map(s => s.trim()).filter(Boolean).forEach(skill => formData.append('skills', skill));
      if (avatarFile) formData.append('avatar', avatarFile);
      if (resumeFile) formData.append('resume', resumeFile);

      await authAPI.updateProfile(formData);
      alert('Profile updated');
      navigate('/profile');
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <button className="btn-link" onClick={() => navigate('/profile')}>← Go Back</button>
        <div className="edit-card">
          <h2>Edit Profile</h2>
          <form className="edit-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Email *</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Phone Number *</label>
              <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
            </div>
            <div className="form-row">
              <label>Skills</label>
              <input
                name="skills"
                placeholder="e.g., JavaScript, React, Node.js"
                value={form.skills}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <label>Profile Picture</label>
              <div className="upload-box">
                <input type="file" accept="image/*" onChange={handleAvatar} />
                {avatarPreview ? (
                  <img src={avatarPreview} alt="preview" className="avatar-preview" />
                ) : (
                  <span className="muted">Choose image (PNG, JPG, GIF - Max 5MB)</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <label>Resume/CV</label>
              <div className="upload-box">
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleResume} />
                <span className="muted">{resumeName || 'Choose file (PDF or Word - Max 10MB)'}</span>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>Save Changes</button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/profile')}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditApplicantProfile;


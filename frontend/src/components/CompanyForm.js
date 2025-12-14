import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyAPI } from '../api';
import '../styles/Profile.css';

const CompanyForm = () => {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const isEdit = Boolean(companyId);
  
  // Check if we should return to post-job page
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo');

  const [form, setForm] = useState({
    name: '',
    website: '',
    description: '',
    location: '',
    bio: ''
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadCompany = async () => {
      if (!isEdit) return;
      try {
        const response = await companyAPI.getCompany(companyId);
        const company = response.data.company;
        setForm({
          name: company?.name || '',
          website: company?.website || '',
          description: company?.description || '',
          location: company?.location || '',
          bio: company?.bio || ''
        });
        if (company?.logoUrl) {
          setLogoPreview(company.logoUrl.startsWith('http') ? company.logoUrl : `http://localhost:5000${company.logoUrl}`);
        }
      } catch (err) {
        alert('Could not load company');
        navigate('/recruiter/companies');
      }
    };
    loadCompany();
  }, [companyId, isEdit, navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Company name is required');
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('website', form.website);
      formData.append('description', form.description);
      formData.append('location', form.location);
      formData.append('bio', form.bio);
      if (logoFile) formData.append('companyLogo', logoFile);

      if (isEdit) {
        await companyAPI.updateCompany(companyId, formData);
        alert('Company updated');
      } else {
        await companyAPI.createCompany(formData);
        alert('Company created');
      }
      
      // Navigate back to post-job if that's where we came from
      if (returnTo === 'post-job') {
        navigate('/post-job?from=company-setup');
      } else {
        navigate('/recruiter/companies');
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Could not save company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <button 
          className="btn-link" 
          onClick={() => {
            if (returnTo === 'post-job') {
              navigate('/post-job');
            } else {
              navigate('/recruiter/companies');
            }
          }}
        >
          ← Go Back
        </button>
        <div className="edit-card">
          <h2>{isEdit ? 'Edit Company' : 'Set New Company'}</h2>
          <form className="edit-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label>Company Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-row">
              <label>Website</label>
              <input name="website" value={form.website} onChange={handleChange} placeholder="https://yourcompany.com" />
            </div>
            <div className="form-row">
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>
            <div className="form-row">
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="City, Country" />
            </div>
            <div className="form-row">
              <label>Company Bio</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Tell us about your company's mission, culture, and values..." />
            </div>
            <div className="form-row">
              <label>Company Logo</label>
              <div className="upload-box">
                <input type="file" accept="image/*" onChange={handleLogo} />
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="avatar-preview" />
                ) : (
                  <span className="muted">Choose image (PNG, JPG, GIF - Max 10MB)</span>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/recruiter/companies')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyForm;


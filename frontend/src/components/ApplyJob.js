import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { jobAPI, draftAPI } from '../api';
import '../styles/ApplyJob.css';

const ApplyJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    linkedIn: '',
    portfolio: '',
    coverLetter: '',
    skills: '',
    experience: '',
    resume: null
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetterCount, setCoverLetterCount] = useState(0);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const autoSaveIntervalRef = useRef(null);
  const hasRestoredDraftRef = useRef(false);
  const maxCoverLetterLength = 300;

  // Helper function to get localStorage key for draft
  const getLocalStorageKey = () => `draft_${user?._id}_${jobId}`;

  // Save draft to backend and localStorage
  const saveDraft = async (dataToSave = formData) => {
    if (!user || !jobId) return;

    try {
      setIsSavingDraft(true);
      
      // Prepare draft data (exclude file, store filename only)
      const draftData = {
        ...dataToSave,
        resumeFileName: resumeFile?.name || ''
      };

      // Save to backend
      try {
        await draftAPI.saveDraft(jobId, draftData);
        setLastSaved(new Date());
      } catch (err) {
        console.error('Error saving draft to backend:', err);
        // Continue to save to localStorage even if backend fails
      }

      // Save to localStorage as backup
      try {
        const localStorageData = {
          ...draftData,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(getLocalStorageKey(), JSON.stringify(localStorageData));
      } catch (err) {
        console.error('Error saving draft to localStorage:', err);
      }
    } catch (err) {
      console.error('Error in saveDraft:', err);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Restore draft from backend or localStorage
  const restoreDraft = async () => {
    if (!user || !jobId || hasRestoredDraftRef.current) return;

    try {
      let draft = null;
      let fromLocalStorage = false;

      // Try to fetch from backend first
      try {
        const response = await draftAPI.getDraft(jobId);
        draft = response.data.draft;
        
        // Check if draft is older than 24 hours
        if (draft.isOldDraft) {
          const confirmRestore = window.confirm(
            `This draft was saved ${Math.round(draft.hoursOld)} hours ago. Do you want to restore it?`
          );
          if (!confirmRestore) {
            return;
          }
        }
      } catch (err) {
        // Backend draft not found, try localStorage
        console.log('No backend draft found, checking localStorage...');
        const localStorageKey = getLocalStorageKey();
        const savedDraft = localStorage.getItem(localStorageKey);
        
        if (savedDraft) {
          try {
            const parsedDraft = JSON.parse(savedDraft);
            const savedAt = new Date(parsedDraft.savedAt);
            const hoursOld = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
            
            if (hoursOld > 24) {
              const confirmRestore = window.confirm(
                `This draft was saved ${Math.round(hoursOld)} hours ago. Do you want to restore it?`
              );
              if (!confirmRestore) {
                return;
              }
            }
            
            draft = {
              formData: parsedDraft,
              lastSaved: savedAt,
              isOldDraft: hoursOld > 24
            };
            fromLocalStorage = true;
          } catch (parseErr) {
            console.error('Error parsing localStorage draft:', parseErr);
          }
        }
      }

      // Restore draft data if found
      if (draft && draft.formData) {
        setFormData(prev => ({
          ...prev,
          ...draft.formData,
          resume: null // Files can't be restored
        }));
        
        if (draft.formData.coverLetter) {
          setCoverLetterCount(draft.formData.coverLetter.length);
        }
        
        setDraftRestored(true);
        setLastSaved(new Date(draft.lastSaved));
        hasRestoredDraftRef.current = true;
        
        // Show notification
        setTimeout(() => {
          setDraftRestored(false);
        }, 5000);
      }
    } catch (err) {
      console.error('Error restoring draft:', err);
    }
  };

  // Load job details, prefill user data, and restore draft
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await jobAPI.getJobById(jobId);
        setJob(response.data.job);
        
        // Check if already applied
        const applicationsResponse = await jobAPI.getApplications();
        const hasApplied = applicationsResponse.data.applications.some(
          app => app.jobId._id === jobId
        );
        setAlreadyApplied(hasApplied);
        
        // Check if job is saved
        try {
          const savedResponse = await jobAPI.checkIfSaved(jobId);
          setIsSaved(savedResponse.data.isSaved);
        } catch (err) {
          console.error('Error checking if job is saved:', err);
        }
        
        // Pre-fill user data
        if (user) {
          setFormData(prev => ({
            ...prev,
            fullName: user.name || '',
            email: user.email || ''
          }));
          
          // Restore draft after user data is set
          await restoreDraft();
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, user]);

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!user || !jobId || alreadyApplied) return;

    // Set up auto-save interval
    autoSaveIntervalRef.current = setInterval(() => {
      // Only save if form has meaningful data
      const hasData = formData.phoneNumber || formData.coverLetter || 
                     formData.skills || formData.experience || 
                     formData.linkedIn || formData.portfolio;
      
      if (hasData) {
        saveDraft();
      }
    }, 10000); // 10 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [user, jobId, formData, alreadyApplied]);

  // Save draft on form change (debounced)
  useEffect(() => {
    if (!user || !jobId || alreadyApplied || !hasRestoredDraftRef.current) return;

    const timeoutId = setTimeout(() => {
      const hasData = formData.phoneNumber || formData.coverLetter || 
                     formData.skills || formData.experience || 
                     formData.linkedIn || formData.portfolio;
      
      if (hasData) {
        saveDraft();
      }
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [formData, user, jobId, alreadyApplied]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update character count for cover letter
    if (name === 'coverLetter') {
      setCoverLetterCount(value.length);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or DOC/DOCX file');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setResumeFile(file);
      setFormData(prev => ({ ...prev, resume: file }));
      setError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange({ target: { files: [file] } });
    }
  };

  const handleSaveJob = async () => {
    if (isSaved) {
      setSavingJob(true);
      try {
        await jobAPI.unsaveJob(jobId);
        setIsSaved(false);
      } catch (err) {
        console.error('Error unsaving job:', err);
        setError('Failed to remove job from saved list');
      } finally {
        setSavingJob(false);
      }
    } else {
      setSavingJob(true);
      try {
        await jobAPI.saveJob(jobId);
        setIsSaved(true);
      } catch (err) {
        console.error('Error saving job:', err);
        setError('Failed to save job');
      } finally {
        setSavingJob(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Prepare application data
      const applicationData = {
        resume: resumeFile ? URL.createObjectURL(resumeFile) : 'resume-placeholder.pdf',
        coverLetter: formData.coverLetter,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience: formData.experience
      };
      
      await jobAPI.applyForJob(jobId, applicationData);
      
      // Delete draft after successful submission
      try {
        await draftAPI.deleteDraft(jobId);
        localStorage.removeItem(getLocalStorageKey());
      } catch (draftErr) {
        console.error('Error deleting draft:', draftErr);
      }
      
      alert('Application submitted successfully!');
      navigate('/applicant/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit application';
      setError(errorMsg);
      if (errorMsg.includes('already applied')) {
        setAlreadyApplied(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Get company initials for badge
  const getCompanyInitials = (companyName) => {
    if (!companyName) return 'CO';
    const words = companyName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently posted';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="apply-container">
        <div className="loading-spinner">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="apply-container">
        <div className="error-message">Job not found</div>
      </div>
    );
  }

  return (
    <div className="apply-container">
      {/* Back Button */}
      <div className="back-button-wrapper">
        <button onClick={handleBack} className="btn-back-apply">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          Back to Jobs
        </button>
      </div>

      <div className="apply-split-layout">
        {/* Left Side - Job Summary */}
        <div className="job-summary-card">
          <div className="company-badge">
            {getCompanyInitials(job.company)}
          </div>
          
          <h2 className="job-summary-title">{job.title}</h2>
          <p className="job-summary-company">{job.company}</p>
          
          <div className="job-summary-meta">
            <span className="meta-badge">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
              </svg>
              {job.location}
            </span>
            <span className="meta-badge">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1h-3zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85v5.65z"/>
              </svg>
              {job.jobType}
            </span>
          </div>

          {job.salary && (
            <div className="job-summary-salary">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
              </svg>
              <span>{job.salary}</span>
            </div>
          )}

          <div className="job-summary-posted">
            Posted {formatDate(job.createdAt)}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="job-summary-skills">
              <h4>Required Skills</h4>
              <div className="skills-pills">
                {job.skills.map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div className="job-actions-buttons">
            <button className="btn-company-site" type="button">
              Apply on Company Site
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/>
                <path fillRule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/>
              </svg>
            </button>
            <button 
              className={`btn-save-job ${isSaved ? 'saved' : ''}`} 
              type="button"
              onClick={handleSaveJob}
              disabled={savingJob}
              title={isSaved ? 'Remove from saved jobs' : 'Save this job'}
            >
              {isSaved ? '❤️' : '🤍'} {isSaved ? 'Saved' : 'Save Job'}
            </button>
          </div>
        </div>

        {/* Right Side - Application Form */}
        <div className="application-form-card">
          <h2 className="form-title">Submit Your Application</h2>
          <p className="form-subtitle">Fill out the form below to apply for this position</p>
          
          {error && <div className="error-message">{error}</div>}
          
          {draftRestored && (
            <div className="draft-restored-notification" style={{
              padding: '12px 16px',
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#065f46',
              fontSize: '14px'
            }}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.203l1.47-6.843a.5.5 0 0 1 .08-.176c.021-.047.047-.1.08-.17l.001-.003a.5.5 0 0 1 .112-.163l.004-.004c.01-.01.018-.01.05-.01h.002c.138 0 .248.112.266.25l.73 4.842-1.242-4.842a.5.5 0 0 1 .112-.163l.004-.004c.01-.01.018-.01.05-.01h.002c.138 0 .248.112.266.25l.73 4.842z"/>
              </svg>
              <span><strong>Draft restored!</strong> Your previous form data has been loaded.</span>
            </div>
          )}
          
          {isSavingDraft && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#1e40af'
            }}>
              💾 Saving draft...
            </div>
          )}
          
          {lastSaved && !isSavingDraft && (
            <div style={{
              padding: '8px 12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #10b981',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#065f46'
            }}>
              ✓ Draft saved {new Date(lastSaved).toLocaleTimeString()}
            </div>
          )}
          
          {alreadyApplied && (
            <div className="already-applied-warning">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
              You have already applied for this job
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="application-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                  className="input-disabled"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkedIn">
                LinkedIn Profile <span className="optional">(Optional)</span>
              </label>
              <input
                type="url"
                id="linkedIn"
                name="linkedIn"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedIn}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="portfolio">
                Portfolio/Website <span className="optional">(Optional)</span>
              </label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                placeholder="https://yourportfolio.com"
                value={formData.portfolio}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="coverLetter">
                Cover Letter <span className="required">*</span>
              </label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                placeholder="Tell us why you're a great fit for this role..."
                rows="6"
                value={formData.coverLetter}
                onChange={handleChange}
                maxLength={maxCoverLetterLength}
                required
              />
              <div className="character-count">
                {coverLetterCount} / {maxCoverLetterLength}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="skills">
                Skills <span className="required">*</span>
              </label>
              <input
                type="text"
                id="skills"
                name="skills"
                placeholder="e.g., React, Node.js, Python, AWS (comma-separated)"
                value={formData.skills}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="experience">
                Experience <span className="required">*</span>
              </label>
              <input
                type="text"
                id="experience"
                name="experience"
                placeholder="e.g., 2 years, 5+ years, Entry Level"
                value={formData.experience}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resume">
                Resume <span className="required">*</span>
              </label>
              <div 
                className="file-upload-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  required
                  className="file-input-hidden"
                />
                <label htmlFor="resume" className="file-upload-label">
                  <svg width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                  </svg>
                  <div className="upload-text">
                    {resumeFile ? (
                      <>
                        <strong>{resumeFile.name}</strong>
                        <span>Click to change file</span>
                      </>
                    ) : (
                      <>
                        <strong>Click to upload</strong>
                        <span>or drag and drop</span>
                        <span className="file-info">PDF, DOC, DOCX (max 5MB)</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" disabled={submitting || alreadyApplied} className="btn-submit-gradient">
              {alreadyApplied ? 'Already Applied' : submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ApplyJob;

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Track API activity for idle detection
let lastApiCallTime = Date.now();

// Request interceptor to track API calls
api.interceptors.request.use(
  (config) => {
    lastApiCallTime = Date.now();
    // Dispatch custom event for idle detection
    window.dispatchEvent(new CustomEvent('api-activity'));
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    lastApiCallTime = Date.now();
    window.dispatchEvent(new CustomEvent('api-activity'));
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Export function to get last API call time
export const getLastApiCallTime = () => lastApiCallTime;

export const authAPI = {
  register: (name, email, password, role, companyId = null) =>
    api.post('/auth/register', { name, email, password, role, companyId }),
  login: (email, password, additionalData = {}) =>
    api.post('/auth/login', { email, password, ...additionalData }),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/profile'),
  updateProfileKeywords: (keywords) =>
    api.put('/profile/keywords', { keywords }),
  updateProfile: (formData) =>
    api.put('/profile', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  updateCompanyProfile: (formData) =>
    api.put('/profile/company', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  updatePassword: (currentPassword, newPassword) =>
    api.put('/profile/password', { currentPassword, newPassword }),
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),
  verifyResetToken: (email, token) =>
    api.post('/auth/verify-reset-token', { email, token }),
  resetPassword: (email, token, newPassword) =>
    api.post('/auth/reset-password', { email, token, newPassword })
};

export const jobAPI = {
  getAllJobs: (params = {}) => api.get('/jobs/all', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  createJob: (jobData) => api.post('/jobs/create', jobData),
  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),
  closeJob: (id) => api.put(`/jobs/${id}/close`),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getRecruiterJobs: () => api.get('/jobs/recruiter/jobs'),
  getMyJobs: () => api.get('/jobs/recruiter/my-jobs'),
  applyForJob: (jobId, applicationData) =>
    api.post(`/jobs/${jobId}/apply`, applicationData),
  getApplications: () => api.get('/jobs/applicant/applications'),
  withdrawApplication: (applicationId) => api.delete(`/jobs/application/${applicationId}`),
  getRecommendations: (params = {}) => api.get('/jobs/recommendations', { params }),
  getJobApplications: (jobId) => api.get(`/jobs/${jobId}/applications`),
  updateApplicationStatus: (appId, status) =>
    api.put(`/jobs/application/${appId}/status`, { status }),
  getCompanyAnalytics: (companyId) => api.get(`/jobs/company/${companyId}/analytics`),
  // Saved jobs endpoints
  saveJob: (jobId) => api.post(`/jobs/${jobId}/save`),
  unsaveJob: (jobId) => api.delete(`/jobs/${jobId}/unsave`),
  getSavedJobs: () => api.get('/jobs/applicant/saved'),
  checkIfSaved: (jobId) => api.get(`/jobs/${jobId}/is-saved`)
};

export const companyAPI = {
  getCompanies: () => api.get('/companies'),
  getCompaniesPublic: () => api.get('/companies/public'), // Public endpoint for signup dropdown
  getAllCompanies: () => api.get('/companies/all'), // For applicants to browse all companies
  getCompany: (id) => api.get(`/companies/${id}`),
  getCompanyDetails: (id) => api.get(`/companies/${id}/details`), // For applicants to view company details
  getCompanyAnalytics: (id) => api.get(`/companies/${id}/analytics`), // For applicants to view company analytics
  createCompany: (formData) =>
    api.post('/companies', formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    }),
  updateCompany: (id, formData) =>
    api.put(`/companies/${id}`, formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined
    })
};

export const draftAPI = {
  saveDraft: (jobId, formData) => api.post('/drafts', { jobId, formData }),
  getDraft: (jobId) => api.get(`/drafts/${jobId}`),
  deleteDraft: (jobId) => api.delete(`/drafts/${jobId}`),
  getAllDrafts: () => api.get('/drafts')
};

export const interviewQuestionAPI = {
  getQuestions: (jobId) => api.get(`/jobs/${jobId}/questions`),
  addQuestion: (jobId, question) => api.post(`/jobs/${jobId}/questions`, { question }),
  updateQuestion: (jobId, questionId, question) => api.put(`/jobs/${jobId}/questions/${questionId}`, { question }),
  deleteQuestion: (jobId, questionId) => api.delete(`/jobs/${jobId}/questions/${questionId}`)
};

export const loginActivityAPI = {
  getLoginHistory: (limit = 50) => api.get(`/login-activity/history`, { params: { limit } }),
  getSuspiciousLogins: () => api.get(`/login-activity/suspicious`),
  getLoginStats: () => api.get(`/login-activity/stats`),
  acknowledgeLogin: (loginId) => api.put(`/login-activity/${loginId}/acknowledge`)
};

export default api;

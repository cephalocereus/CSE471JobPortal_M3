import React from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import SessionWarning from './components/SessionWarning';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ApplicantDashboard from './components/ApplicantDashboard';
import ApplyJob from './components/ApplyJob';
import MyApplications from './components/MyApplications';
import PersonalizedJobsPage from './components/PersonalizedJobsPage';
import SavedJobs from './components/SavedJobs';
import RecruiterDashboard from './components/RecruiterDashboard';
import PostJob from './components/PostJob';
import JobApplications from './components/JobApplications';
import ApplicantProfile from './components/ApplicantProfile';
import EditApplicantProfile from './components/EditApplicantProfile';
import RecruiterProfile from './components/RecruiterProfile';
import RecruiterCompanies from './components/RecruiterCompanies';
import CompanyForm from './components/CompanyForm';
import CompanyAnalytics from './components/CompanyAnalytics';
import CompanyList from './components/CompanyList';
import ApplicantCompanyAnalytics from './components/ApplicantCompanyAnalytics';
import InterviewQuestionBank from './components/InterviewQuestionBank';
import LoginHistory from './components/LoginHistory';
import { jobAPI } from './api';
import './App.css';

/**
 * Interview Question Bank Page Component
 */
function InterviewQuestionBankPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [job, setJob] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobAPI.getJobById(params.jobId);
        setJob(response.data.job);
      } catch (err) {
        console.error('Error fetching job:', err);
        alert('Error loading job details');
        navigate('/recruiter/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [params.jobId, navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!job) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Interview Question Bank</h1>
        </div>
        <div className="navbar-info">
          <button 
            onClick={() => navigate('/recruiter/dashboard')} 
            className="btn-secondary"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>
      <div className="dashboard-content">
        <div className="main-content">
          <InterviewQuestionBank jobId={params.jobId} jobTitle={job.title} />
        </div>
      </div>
    </div>
  );
}

/**
 * AppContent component that includes session warning
 * Must be inside AuthProvider to use useAuth
 */
function AppContent() {
  const { showSessionWarning, setShowSessionWarning, handleContinueSession, handleSessionTimeout, user } = useAuth();

  // Use session timeout hook at component level
  const { extendSession } = useSessionTimeout(
    handleSessionTimeout,
    () => setShowSessionWarning(true)
  );

  // Handle continue session with extend
  const handleContinueClick = React.useCallback(() => {
    console.log('[AppContent] Continue Session clicked, extending timeout');
    handleContinueSession();
    setShowSessionWarning(false);
    if (extendSession) {
      extendSession();
    }
  }, [handleContinueSession, extendSession]);

  return (
    <>
      <SessionWarning
        isVisible={showSessionWarning}
        onContinue={handleContinueClick}
        onLogout={handleSessionTimeout}
        timeRemaining={60}
      />

      <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route 
            path="/applicant/dashboard" 
            element={
              <ProtectedRoute role="applicant">
                <ApplicantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute role="applicant">
                <ApplicantDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/apply/:jobId" 
            element={
              <ProtectedRoute role="applicant">
                <ApplyJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs/:jobId" 
            element={
              <ProtectedRoute role="applicant">
                <ApplyJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-applications" 
            element={
              <ProtectedRoute role="applicant">
                <MyApplications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/jobs/personalized" 
            element={
              <ProtectedRoute role="applicant">
                <PersonalizedJobsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/saved-jobs" 
            element={
              <ProtectedRoute role="applicant">
                <SavedJobs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/companies" 
            element={
              <ProtectedRoute role="applicant">
                <CompanyList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/companies/:companyId/analytics" 
            element={
              <ProtectedRoute role="applicant">
                <ApplicantCompanyAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute role="applicant">
                <ApplicantProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile/edit" 
            element={
              <ProtectedRoute role="applicant">
                <EditApplicantProfile />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/recruiter/dashboard" 
            element={
              <ProtectedRoute role="recruiter">
                <RecruiterDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/companies" 
            element={
              <ProtectedRoute role="recruiter">
                <RecruiterCompanies />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/profile" 
            element={
              <ProtectedRoute role="recruiter">
                <RecruiterProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/post-job" 
            element={
              <ProtectedRoute role="recruiter">
                <PostJob />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/company/new" 
            element={
              <ProtectedRoute role="recruiter">
                <CompanyForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/company/:companyId" 
            element={
              <ProtectedRoute role="recruiter">
                <CompanyForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiter/company/:companyId/analytics" 
            element={
              <ProtectedRoute role="recruiter">
                <CompanyAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/job/:jobId/applications" 
            element={
              <ProtectedRoute role="recruiter">
                <JobApplications />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/job/:jobId/questions" 
            element={
              <ProtectedRoute role="recruiter">
                <InterviewQuestionBankPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/login-history" 
            element={
              <ProtectedRoute>
                <LoginHistory />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </>
    );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

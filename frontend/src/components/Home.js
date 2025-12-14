import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate(user.role === 'applicant' ? '/applicant/dashboard' : '/recruiter/dashboard');
    return null;
  }

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to JobPortal</h1>
        <p>Find your dream job or hire the perfect candidate</p>
        
        <div className="role-selection">
          <button onClick={() => navigate('/register')} className="btn-role">
            <h3>🧑‍💼 Job Seeker</h3>
            <p>Browse jobs and apply</p>
          </button>
          <button onClick={() => navigate('/register')} className="btn-role">
            <h3>🏢 Recruiter</h3>
            <p>Post jobs and hire talent</p>
          </button>
        </div>

        <p className="home-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Home;

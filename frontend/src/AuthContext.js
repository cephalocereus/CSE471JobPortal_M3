import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authAPI } from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  /**
   * Auto-save user's current work/session state before logout
   */
  const saveUserSessionState = React.useCallback(async () => {
    try {
      if (!user) return;
      
      console.log('[Session Auto-Save] Saving user session state');
      
      // Save current form data if any (you can expand this based on your needs)
      const sessionData = {
        lastPageVisited: window.location.pathname,
        timestamp: new Date().toISOString(),
        savedJobs: localStorage.getItem('savedJobs') || null,
        // Add more session data as needed
      };
      
      // Store in browser storage for next login
      sessionStorage.setItem(`session_${user.id}`, JSON.stringify(sessionData));
      
      console.log('[Session Auto-Save] Session state saved successfully');
    } catch (err) {
      console.error('[Session Auto-Save] Error saving session state:', err);
    }
  }, [user]);

  /**
   * Handle session warning - show warning dialog
   */
  const handleSessionWarning = React.useCallback(async () => {
    console.log('[AuthContext] ⚠️ WARNING - Session expiring, showing dialog');
    setShowSessionWarning(true);
  }, []);

  /**
   * Handle session timeout - auto-logout with data save
   */
  const handleSessionTimeout = React.useCallback(async () => {
    console.log('[Session Timeout] Session expired, initiating auto-logout');
    try {
      // Auto-save work before logout
      await saveUserSessionState();
      
      // Clear user state
      setUser(null);
      setShowSessionWarning(false);
      
      // Attempt logout
      try {
        await authAPI.logout();
      } catch (logoutErr) {
        console.error('[Session Timeout] Error during logout API call:', logoutErr);
      }
      
      // Show alert before redirecting
      alert('Your session has expired due to inactivity. Your work has been saved. Please log in again.');
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (err) {
      console.error('[Session Timeout] Error during session timeout:', err);
      setUser(null);
      window.location.href = '/login';
    }
  }, [saveUserSessionState]);

  /**
   * Handle continue session button click
   */
  const handleContinueSession = React.useCallback(() => {
    console.log('[Session Warning] User clicked Continue Session');
    setShowSessionWarning(false);
  }, []);

  const register = async (name, email, password, role, companyId = null) => {
    const response = await authAPI.register(name, email, password, role, companyId);
    setUser(response.data.user);
    return response.data;
  };

  const login = async (email, password, additionalData = {}) => {
    const response = await authAPI.login(email, password, additionalData);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await saveUserSessionState();
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login, 
      logout,
      showSessionWarning,
      setShowSessionWarning,
      handleContinueSession,
      handleSessionTimeout,
      saveUserSessionState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

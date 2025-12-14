import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for session timeout with warning dialog
 * Shows warning 1 minute before logout (2 minute total timeout)
 */
export const useSessionTimeout = (onLogout, onWarning) => {
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const onLogoutRef = useRef(onLogout);
  const onWarningRef = useRef(onWarning);
  const isActiveRef = useRef(true);

  // Update refs when callbacks change
  useEffect(() => {
    onLogoutRef.current = onLogout;
    onWarningRef.current = onWarning;
  }, [onLogout, onWarning]);

  const sessionTimeoutMs = 3 * 60 * 1000; // 3 minutes total (180 seconds)
  const warningTimeMs = 1 * 60 * 1000; // 1 minute warning (60 seconds) - shows at 2 minute mark

  /**
   * Reset the session timeout timers
   */
  const resetSessionTimeout = useCallback(() => {
    console.log('[useSessionTimeout] 🔄 Resetting timers - warning in 2 min, logout in 3 min');

    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    // Reset activity time
    lastActivityRef.current = Date.now();

    // Set warning timeout (show warning after 2 minutes of inactivity)
    warningTimeoutRef.current = setTimeout(() => {
      console.log('[useSessionTimeout] ⚠️ WARNING TRIGGERED - 2 minutes of inactivity');
      if (onWarningRef.current) {
        console.log('[useSessionTimeout] Calling onWarning callback');
        onWarningRef.current();
      }
    }, sessionTimeoutMs - warningTimeMs);

    // Set logout timeout (logout after 3 minutes total)
    timeoutRef.current = setTimeout(() => {
      console.log('[useSessionTimeout] 🚪 LOGOUT TRIGGERED - 3 minutes total');
      if (onLogoutRef.current) {
        console.log('[useSessionTimeout] Calling onLogout callback');
        onLogoutRef.current();
      }
    }, sessionTimeoutMs);
  }, [sessionTimeoutMs, warningTimeMs]);

  /**
   * Track user activity and reset timeout
   */
  const trackActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    console.log(`[useSessionTimeout] 👆 Activity detected (${timeSinceLastActivity}ms since last)`);
    resetSessionTimeout();
  }, [resetSessionTimeout]);

  /**
   * Manually extend session
   */
  const extendSession = useCallback(() => {
    console.log('[useSessionTimeout] Session extended by user');
    trackActivity();
  }, [trackActivity]);

  useEffect(() => {
    console.log('[useSessionTimeout] ✅ Hook mounted and activating');
    isActiveRef.current = true;
    
    // Initial setup
    resetSessionTimeout();

    // Track various user activities
    const handleActivity = () => trackActivity();

    // Add mouse events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('mouseup', handleActivity);

    // Add keyboard events
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('keyup', handleActivity);

    // Add touch events
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('touchmove', handleActivity);
    window.addEventListener('touchend', handleActivity);

    // Add scroll event
    window.addEventListener('scroll', handleActivity);

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      console.log('[useSessionTimeout] Visibility changed, hidden:', document.hidden);
      if (!document.hidden) {
        trackActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle API activity
    const handleApiActivity = () => trackActivity();
    window.addEventListener('api-activity', handleApiActivity);

    console.log('[useSessionTimeout] Event listeners added successfully');

    // Cleanup function
    return () => {
      console.log('[useSessionTimeout] Cleaning up event listeners and timeouts');
      
      // Remove mouse events
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('mouseup', handleActivity);

      // Remove keyboard events
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('keyup', handleActivity);

      // Remove touch events
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
      window.removeEventListener('touchend', handleActivity);

      // Remove scroll event
      window.removeEventListener('scroll', handleActivity);

      // Remove other listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('api-activity', handleApiActivity);

      // Clear timeouts
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [resetSessionTimeout, trackActivity]);

  return {
    extendSession,
    resetTimeout: trackActivity,
    getLastActivity: () => lastActivityRef.current
  };
};

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to detect user inactivity and trigger logout after specified timeout
 * @param {number} timeoutMinutes - Minutes of inactivity before logout (default: 3)
 * @param {Function} onIdle - Callback function when user becomes idle
 * @param {boolean} enabled - Whether idle detection is enabled
 */
export const useIdleTimeout = (timeoutMinutes = 3, onIdle, enabled = true) => {
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset the timeout timer
  const resetTimeout = useCallback(() => {
    if (!enabled) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set new timeout
    const timeoutMs = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
    timeoutRef.current = setTimeout(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= timeoutMs) {
        console.log(`User idle for ${timeoutMinutes} minutes. Logging out...`);
        onIdle();
      }
    }, timeoutMs);
  }, [timeoutMinutes, onIdle, enabled]);

  // Track user activity
  const trackActivity = useCallback(() => {
    if (!enabled) return;
    lastActivityRef.current = Date.now();
    resetTimeout();
  }, [enabled, resetTimeout]);

  useEffect(() => {
    if (!enabled) {
      // Clear timeout if disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Reset activity time when enabled state changes
    lastActivityRef.current = Date.now();
    
    // Initial timeout setup
    resetTimeout();

    // Track mouse movements
    const handleMouseMove = () => trackActivity();
    const handleMouseClick = () => trackActivity();
    const handleMouseDown = () => trackActivity();
    const handleMouseUp = () => trackActivity();

    // Track keyboard activity
    const handleKeyDown = () => trackActivity();
    const handleKeyPress = () => trackActivity();
    const handleKeyUp = () => trackActivity();

    // Track scroll activity
    const handleScroll = () => trackActivity();

    // Track touch activity (mobile)
    const handleTouchStart = () => trackActivity();
    const handleTouchMove = () => trackActivity();
    const handleTouchEnd = () => trackActivity();

    // Track visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        trackActivity();
      }
    };

    // Track API calls (custom event dispatched by axios interceptor)
    const handleApiActivity = () => trackActivity();

    // Add event listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseClick);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('api-activity', handleApiActivity);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseClick);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('api-activity', handleApiActivity);
    };
  }, [enabled, trackActivity, resetTimeout]);

  // Expose method to manually reset timeout (useful for API calls)
  return {
    resetTimeout: trackActivity,
    getLastActivity: () => lastActivityRef.current
  };
};


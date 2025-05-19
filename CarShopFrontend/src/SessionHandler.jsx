import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import './SessionHandler.css';

/**
 * SessionHandler component to manage authentication session
 * and handle expiration gracefully with a 10-minute inactivity timeout
 */
const SessionHandler = () => {
  const { checkTokenValidity, logout } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [userActivity, setUserActivity] = useState(Date.now());
  
  // Track user activity
  useEffect(() => {
    // Reset user activity timestamp on any user interaction
    const resetUserActivity = () => setUserActivity(Date.now());
    
    // Add event listeners for user activity
    window.addEventListener('mousemove', resetUserActivity);
    window.addEventListener('keydown', resetUserActivity);
    window.addEventListener('click', resetUserActivity);
    window.addEventListener('scroll', resetUserActivity);
    
    return () => {
      window.removeEventListener('mousemove', resetUserActivity);
      window.removeEventListener('keydown', resetUserActivity);
      window.removeEventListener('click', resetUserActivity);
      window.removeEventListener('scroll', resetUserActivity);
    };
  }, []);
  
  // Check token validity periodically and monitor user inactivity
  useEffect(() => {
    // Don't run initial check immediately - wait for the first interval check
    
    // Schedule periodic checks - now set to 10 minutes (600,000 ms)
    const interval = setInterval(async () => {
      // Check inactivity time
      const inactiveTime = Date.now() - userActivity;
      const inactivityLimit = 10 * 60 * 1000; // 10 minutes
      
      // Only show warning if user has been inactive for the threshold time
      // AND the token is still valid
      if (inactiveTime >= inactivityLimit) {
        const isTokenValid = await checkTokenValidity();
        if (isTokenValid) {
          setShowWarning(true);
        }
      }
    }, 60 * 1000); // Check every minute
    
    return () => clearInterval(interval);
  }, [checkTokenValidity, userActivity]);
    // If session is about to expire, show warning
  useEffect(() => {
    if (showWarning) {
      // Reset countdown to 60 seconds when warning appears
      setTimeRemaining(60);
      
      const warningInterval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(warningInterval);
            setShowWarning(false);
            setSessionExpired(true);
            setTimeout(() => {
              logout();
              navigate('/login');
            }, 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(warningInterval);
    }
  }, [showWarning, logout, navigate]);
    // Renew session
  const renewSession = async () => {
    // Reset the user activity timestamp
    setUserActivity(Date.now());
    
    // Check if token is still valid
    const isValid = await checkTokenValidity();
    if (isValid) {
      // Hide warning and reset timer
      setShowWarning(false);
      setTimeRemaining(60);
    } else {
      // If token is no longer valid, show expired message
      setSessionExpired(true);
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    }
  };
  
  if (sessionExpired) {
    return (
      <div className="session-expired-overlay">
        <div className="session-expired-modal">
          <h2>Session Expired</h2>
          <p>Your session has expired. You will be redirected to the login page.</p>
        </div>
      </div>
    );
  }
  
  if (showWarning) {
    return (
      <div className="session-warning-overlay">
        <div className="session-warning-modal">
          <h2>Session About to Expire</h2>
          <p>Your session will expire in {timeRemaining} seconds.</p>
          <button onClick={renewSession}>Stay Logged In</button>
        </div>
      </div>
    );
  }
  
  return null;
};

export default SessionHandler;

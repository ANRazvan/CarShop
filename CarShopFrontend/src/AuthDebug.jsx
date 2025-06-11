import React, { useState, useEffect } from 'react';
import { getAuthToken, storeAuthToken, removeAuthToken } from './utils/authToken';
import * as jwt_decode from 'jwt-decode';

const AuthDebug = () => {
  const [authToken, setAuthToken] = useState(getAuthToken());
  const [isVisible, setIsVisible] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Check token every second to keep display updated
  useEffect(() => {
    const interval = setInterval(() => {      const token = getAuthToken();
      setAuthToken(token);
      
      // Parse token if available
      if (token) {
        try {
          const decoded = jwt_decode.jwtDecode(token);
          setTokenData(decoded);
          
          // Calculate expiry time
          if (decoded.exp) {
            const expiryDate = new Date(decoded.exp * 1000);
            setTokenExpiry(expiryDate);
            
            // Calculate time remaining
            const now = new Date();
            const remainingMs = expiryDate - now;
            setTimeRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
          setTokenData(null);
        }
      } else {
        setTokenData(null);
        setTokenExpiry(null);
        setTimeRemaining(null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  const handleRemoveToken = (e) => {
    e.stopPropagation();
    removeAuthToken();
  };
  
  const handleTestToken = (e) => {
    e.stopPropagation();
    // Create a test token (for dev purposes only)
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MjM5MDIyfQ.tYPwxPMVpbSCL0TARWDHIlN5pIJIDBiDIjuYfL1bfFg';
    storeAuthToken(testToken);
  };

  // Create a simple style for the debug panel
  const debugPanelStyle = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '0.8rem',
    zIndex: 9999,
    cursor: 'pointer',
    maxWidth: '300px'
  };
  
  const buttonStyle = {
    backgroundColor: '#555',
    border: 'none',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    marginRight: '5px'
  };

  return (
    <div style={debugPanelStyle} onClick={toggleVisibility}>
      {!isVisible ? (
        <div>🔑 Auth Debug</div>
      ) : (
        <div onClick={(e) => e.stopPropagation()}>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '5px' }}>
            <button style={{...buttonStyle, backgroundColor: '#F44336'}} onClick={handleRemoveToken}>
              Clear Token
            </button>
            <button style={{...buttonStyle, backgroundColor: '#2196F3'}} onClick={handleTestToken}>
              Test Token
            </button>
          </div>
          
          {authToken ? (
            <>
              <div style={{ wordBreak: 'break-all', marginBottom: '5px' }}>
                <strong>Token Status:</strong> 
                <span style={{ color: '#4CAF50', marginLeft: '5px' }}>Present</span>
              </div>
              
              <div style={{ wordBreak: 'break-all', marginBottom: '5px' }}>
                <strong>Token:</strong> <span style={{ fontSize: '0.7rem' }}>{authToken.substring(0, 20)}...</span>
              </div>
              
              {tokenData && (
                <>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>User ID:</strong> <span>{tokenData.id}</span>
                  </div>
                  
                  {tokenData.email && (
                    <div style={{ marginBottom: '5px' }}>
                      <strong>Email:</strong> <span>{tokenData.email}</span>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Role:</strong> 
                    <span style={{ color: tokenData.role === 'admin' ? '#FF9800' : '#4CAF50', marginLeft: '5px' }}>
                      {tokenData.role}
                    </span>
                  </div>
                  
                  {timeRemaining !== null && (
                    <div>
                      <strong>Expires in:</strong> 
                      <span style={{ 
                        color: timeRemaining < 300 ? '#F44336' : '#4CAF50', 
                        marginLeft: '5px' 
                      }}>
                        {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div>No authentication token found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthDebug;

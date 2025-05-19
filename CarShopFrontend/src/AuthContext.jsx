import React, { createContext, useState, useEffect } from 'react';
import config from './config';
import { setAuthToken } from './utils/authToken';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
    // Check for saved token on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        // Set the token for axios headers
        setAuthToken(savedToken);
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        setAuthToken(null);
      }
    }
    
    setLoading(false);
  }, []);
    // Register a new user
  const register = async (username, email, password) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      console.log('Registering user:', { username, email });
      console.log('API URL:', `${config.API_URL}/api/auth/register`);
      
      const response = await fetch(`${config.API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });
      
      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          throw new Error(data.message || 'Registration failed');
        } else {
          const text = await response.text();
          console.error('Non-JSON response:', text);
          throw new Error('Server returned an invalid response. Check console for details.');
        }
      }
      
      const data = await response.json();
      
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setAuthError(error.message);
      throw error;
    }
  };
  
  // Log in a user
  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const response = await fetch(`${config.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
        // Save token and user in local storage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update axios headers with the new token
      setAuthToken(data.token);
      
      setCurrentUser(data.user);
      setLoading(false);
      return data;
    } catch (error) {
      setLoading(false);
      setAuthError(error.message);
      throw error;
    }
  };
    // Log out a user
  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // Clear auth header
    setAuthToken(null);
    setCurrentUser(null);
  };
  
  // Get current user's profile
  const getProfile = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`${config.API_URL}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to get profile');
      }
      
      setCurrentUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setLoading(false);
      return data.user;
    } catch (error) {
      setLoading(false);
      setAuthError(error.message);
      
      // If token is invalid, log out the user
      if (error.message === 'Invalid or expired token') {
        logout();
      }
      
      throw error;
    }
  };
  
  // Check if the user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('authToken');
  };
  
  // Get the authentication token
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };
  
  // Check if the user is an admin
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };
  
  // Check if the token is valid or expired
  const checkTokenValidity = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }
    
    try {
      // Make a request to check token validity
      const response = await fetch(`${config.API_URL}/api/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.log('Token invalid or expired');
        // Token is invalid, clean up
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setCurrentUser(null);
        setAuthToken(null);
        return false;
      }
      
      // Token is valid
      return true;
    } catch (error) {
      console.error('Error checking token validity:', error);
      return false;
    }
  };
  
  // Refresh token if needed before an operation
  const ensureValidToken = async () => {
    const isValid = await checkTokenValidity();
    if (!isValid && currentUser) {
      // Token was invalid but we had a user, so we need to log out
      logout();
      return false;
    }
    return isValid;
  };
  
  const value = {
    currentUser,
    loading,
    authError,
    register,
    login,
    logout,
    getProfile,
    isAuthenticated,
    getAuthToken,
    isAdmin,
    checkTokenValidity,
    ensureValidToken
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

// This is a utility to ensure auth token is consistently used
import axios from 'axios';

// The single source of truth for the auth token key name
const AUTH_TOKEN_KEY = 'authToken';

// Set authorization header for all requests
export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('authToken.js: Set Authorization header with token');
  } else {
    delete axios.defaults.headers.common['Authorization'];
    console.log('authToken.js: Removed Authorization header');
  }
}

// Store the token in localStorage
export function storeAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthToken(token);
    console.log('authToken.js: Stored new token in localStorage');
    return true;
  }
  return false;
}

// Remove the token from localStorage
export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  setAuthToken(null);
  console.log('authToken.js: Removed token from localStorage');
}

// Get the current auth token
export function getAuthToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  console.log(`authToken.js: Retrieved token from localStorage (${token ? 'present' : 'missing'})`);
  return token;
}

// Check if the user is authenticated
export function isAuthenticated() {
  return !!getAuthToken();
}

// Initialize auth on app start
export function initializeAuth() {
  const token = getAuthToken();
  if (token) {
    setAuthToken(token);
    return true;
  }
  return false;
}

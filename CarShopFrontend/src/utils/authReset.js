/**
 * Authentication Reset Utility
 * 
 * This utility helps users clear invalid authentication tokens
 * and reset their authentication state.
 */

// Function to clear all authentication data
export const clearAuthData = () => {
  try {
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Clear sessionStorage if used
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    
    // Clear axios default headers
    if (typeof window !== 'undefined' && window.axios) {
      delete window.axios.defaults.headers.common['Authorization'];
    }
    
    console.log('✅ Authentication data cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing authentication data:', error);
    return false;
  }
};

// Function to check if user has an invalid token
export const hasInvalidToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  
  try {
    // Basic token format check
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid JWT format
    }
    
    // Check if token is expired
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      return true; // Token expired
    }
    
    return false;
  } catch (error) {
    return true; // Invalid token format
  }
};

// Function to show authentication reset prompt
export const showAuthResetPrompt = () => {
  const shouldReset = window.confirm(
    'Authentication Error Detected!\n\n' +
    'There seems to be an issue with your authentication token. ' +
    'Would you like to clear your authentication data and log in again?\n\n' +
    'This will log you out and redirect you to the login page.'
  );
  
  if (shouldReset) {
    clearAuthData();
    // Reload the page to reset the application state
    window.location.href = '/login';
  }
  
  return shouldReset;
};

// Function to automatically fix authentication issues
export const autoFixAuth = () => {
  if (hasInvalidToken()) {
    console.log('🔧 Invalid token detected, clearing authentication data...');
    clearAuthData();
    return true;
  }
  return false;
};

// Export all functions
export default {
  clearAuthData,
  hasInvalidToken,
  showAuthResetPrompt,
  autoFixAuth
};

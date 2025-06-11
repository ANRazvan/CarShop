/**
 * Utilities for ensuring operations are authenticated
 */
import { getAuthToken } from './authToken';

/**
 * Ensures an axios request is authenticated
 * @param {Object} axiosConfig - The axios configuration object
 * @returns {Object} - The updated axios config with auth headers
 */
export const ensureAuthHeaders = (axiosConfig = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication required");
  }
  
  if (!axiosConfig.headers) {
    axiosConfig.headers = {};
  }
  
  // Set the authorization header
  axiosConfig.headers['Authorization'] = `Bearer ${token}`;
  
  return axiosConfig;
};

/**
 * Validates the HTTP response for authentication issues
 * @param {Error} error - The error from axios
 * @throws {Error} - Rethrows with more specific auth error message if needed
 */
export const handleAuthError = (error) => {
  if (error.response) {
    if (error.response.status === 401) {
      // Clear local auth if we get an unauthorized response
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      throw new Error("Authentication failed. Please log in again.");
    } else if (error.response.status === 403) {
      throw new Error("You don't have permission to perform this action.");
    }
  }
  
  // Rethrow the original error if not an auth issue
  throw error;
};

/**
 * Check if the current user is authenticated and has a valid token
 * @returns {boolean} - Whether the user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Logs out the current user by clearing auth data
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

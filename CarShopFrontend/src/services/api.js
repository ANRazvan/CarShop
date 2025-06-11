import axios from 'axios';
import config from '../config';

// Helper to ensure proper URL construction
const normalizeUrl = (baseUrl) => {
  return baseUrl ? baseUrl.replace(/\/+$/, '') : ''; // Remove trailing slashes
};

const api = axios.create({
  baseURL: normalizeUrl(config.API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

// Debug logging for API calls
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  api.interceptors.request.use(request => {
    console.log('API Request:', {
      url: request.url,
      fullUrl: `${request.baseURL}${request.url}`,
      method: request.method,
      headers: request.headers,
      baseURL: request.baseURL
    });
    return request;
  });
  api.interceptors.response.use(
    response => {
      console.log('API Response:', {
        url: response.config.url,
        status: response.status,
        data: response.data
      });
      return response;
    },    error => {
      console.log('API interceptor - error response:', {
        status: error.response?.status,
        data: error.response?.data
      });

      // If it's a 2FA requirement response, throw a special error that can be caught
      if (error.response?.status === 403 && error.response?.data?.requires2FA) {
        console.log('2FA required - creating 2FA error');
        const twoFactorError = new Error('2FA Required');
        twoFactorError.response = error.response;
        twoFactorError.requires2FA = true;
        return Promise.reject(twoFactorError);
      }

      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
}

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clean up auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Avoid redirect loops and circular navigation
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

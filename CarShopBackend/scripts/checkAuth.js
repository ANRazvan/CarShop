/**
 * Authentication Check Utility
 * 
 * This script helps verify that authentication is working correctly.
 * It checks if the auth token is set correctly and can make authenticated requests.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_PATH = path.join(__dirname, '..', 'auth-token.txt');

// Main function to check authentication
async function checkAuth() {
  try {
    console.log('Checking authentication status...');
    
    // Check if token file exists
    let token = null;
    
    if (fs.existsSync(AUTH_TOKEN_PATH)) {
      token = fs.readFileSync(AUTH_TOKEN_PATH, 'utf8').trim();
      console.log('Found stored authentication token');
    } else {
      console.log('No stored authentication token found');
      return { authenticated: false, reason: 'No token found' };
    }
    
    // Try to use the token
    if (!token) {
      return { authenticated: false, reason: 'Empty token' };
    }
    
    // Make a request to verify the token
    console.log('Verifying token with API...');
    
    const response = await axios.get(`${API_URL}/auth/verify-token`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log('Authentication successful!');
      console.log('User:', response.data.user);
      
      return { 
        authenticated: true,
        user: response.data.user
      };
    }
    
    return { authenticated: false, reason: 'Invalid API response' };
  } catch (error) {
    console.error('Authentication check failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      return { 
        authenticated: false, 
        reason: `Server response: ${error.response.status}`,
        details: error.response.data
      };
    } else if (error.request) {
      console.error('No response received from server');
      return { authenticated: false, reason: 'Server did not respond' };
    } else {
      console.error('Error:', error.message);
      return { authenticated: false, reason: error.message };
    }
  }
}

// Function to check authentication headers
async function testAuthHeaders() {
  try {
    // Load token
    if (!fs.existsSync(AUTH_TOKEN_PATH)) {
      console.log('No stored authentication token found');
      return false;
    }
    
    const token = fs.readFileSync(AUTH_TOKEN_PATH, 'utf8').trim();
    
    // Create a test FormData and headers
    const formData = {};
    
    // Test with explicit headers
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    };
    
    console.log('Making authenticated test request with FormData...');
    console.log('Using headers:', JSON.stringify(config.headers));
    
    // Make a request to a protected endpoint
    const response = await axios.get(`${API_URL}/cars`, config);
    
    console.log('Test request successful:');
    console.log('Status:', response.status);
    
    return true;
  } catch (error) {
    console.error('Test headers check failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    
    return false;
  }
}

// If called directly
if (require.main === module) {
  // Save token if provided as argument
  if (process.argv.length > 2) {
    const tokenArg = process.argv[2];
    fs.writeFileSync(AUTH_TOKEN_PATH, tokenArg.trim());
    console.log('Saved new authentication token');
  }
  
  // Run both tests
  (async () => {
    const authStatus = await checkAuth();
    console.log('\nAuthentication Status:', authStatus.authenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    
    if (authStatus.authenticated) {
      console.log('\nTesting headers configuration...');
      const headersCheck = await testAuthHeaders();
      console.log('Headers test result:', headersCheck ? 'SUCCESS' : 'FAILED');
    }
  })();
}

module.exports = {
  checkAuth,
  testAuthHeaders
};

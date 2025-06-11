/**
 * Auth Diagnostics Tool
 * 
 * This script helps diagnose and fix authentication issues in the CarShop application.
 * It checks for common problems and provides solutions.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const AUTH_TOKEN_PATH = path.join(__dirname, '..', 'auth-token.txt');
const CREDENTIALS_PATH = path.join(__dirname, 'admin-credentials.json');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function runDiagnostics() {
  console.log('===== CarShop Authentication Diagnostics =====');
  
  // Step 1: Check environment
  console.log('\n🔍 Checking environment...');
  checkEnvironment();
  
  // Step 2: Check token
  console.log('\n🔑 Checking for existing auth token...');
  const existingToken = checkExistingToken();
  
  // Step 3: Attempt login with default credentials if no token exists
  if (!existingToken) {
    console.log('\n👤 No valid token found. Attempting login with default admin credentials...');
    await loginWithDefaultCredentials();
  } else {
    console.log('\n✅ Found existing token. Verifying validity...');
    await verifyToken(existingToken);
  }
  
  // Step 4: Check upload directories
  console.log('\n📁 Checking upload directories...');
  checkUploadDirectories();
  
  // Step 5: Test API endpoints
  console.log('\n🌐 Testing API endpoints...');
  await testApiEndpoints();
  
  console.log('\n✅ Authentication diagnostics complete!');
  rl.close();
}

// Check environment
function checkEnvironment() {
  console.log(`API URL: ${API_URL}`);
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ Found .env file');
  } else {
    console.log('⚠️ No .env file found - using default settings');
  }
  
  // Check Node.js version
  console.log(`Node.js version: ${process.version}`);
}

// Check for existing token
function checkExistingToken() {
  if (fs.existsSync(AUTH_TOKEN_PATH)) {
    try {
      const token = fs.readFileSync(AUTH_TOKEN_PATH, 'utf8').trim();
      console.log('✅ Found stored token');
      return token;
    } catch (error) {
      console.error('❌ Error reading token file:', error.message);
      return null;
    }
  } else {
    console.log('❌ No token file found');
    return null;
  }
}

// Login with default admin credentials
async function loginWithDefaultCredentials() {
  try {
    // Check for saved credentials
    let credentials;
    
    if (fs.existsSync(CREDENTIALS_PATH)) {
      credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
      console.log('✅ Using saved admin credentials');
    } else {
      // Use default credentials
      credentials = {
        username: 'admin',
        password: 'adminpassword'
      };
      console.log('⚠️ Using default admin credentials');
    }
    
    // Try to login
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    
    if (response.status === 200 && response.data.token) {
      // Save the token
      fs.writeFileSync(AUTH_TOKEN_PATH, response.data.token);
      
      console.log('✅ Login successful!');
      console.log('✅ Token saved to:', AUTH_TOKEN_PATH);
      
      return response.data.token;
    } else {
      console.log('❌ Login response did not contain a token');
      return null;
    }
  } catch (error) {
    console.error('❌ Login failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('❌ Authentication failed - incorrect credentials');
        await promptNewCredentials();
      }
    } else if (error.request) {
      console.error('❌ No response received from server');
      console.error('⚠️ Make sure the backend server is running');
    } else {
      console.error('❌ Error:', error.message);
    }
    
    return null;
  }
}

// Prompt user for new credentials
function promptNewCredentials() {
  return new Promise((resolve) => {
    rl.question('Would you like to enter new admin credentials? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const username = await promptInput('Enter admin username: ');
        const password = await promptInput('Enter admin password: ');
        
        // Save to file
        const credentials = { username, password };
        fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials, null, 2));
        console.log('✅ Credentials saved');
        
        // Try login with new credentials
        await loginWithDefaultCredentials();
      }
      
      resolve();
    });
  });
}

// Generic prompt for input
function promptInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Verify token
async function verifyToken(token) {
  try {
    const response = await axios.get(`${API_URL}/auth/verify-token`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Token is valid');
      console.log('✅ User:', response.data.user);
      return true;
    } else {
      console.log('❌ Token verification returned unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Token verification failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('❌ Token is invalid or expired');
        fs.unlinkSync(AUTH_TOKEN_PATH);
        console.log('🗑️ Removed invalid token');
        
        // Try logging in again
        await loginWithDefaultCredentials();
      }
    } else if (error.request) {
      console.error('❌ No response received from server');
    } else {
      console.error('❌ Error:', error.message);
    }
    
    return false;
  }
}

// Check upload directories
function checkUploadDirectories() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const videosDir = path.join(uploadsDir, 'videos');
  
  // Check main uploads directory
  if (fs.existsSync(uploadsDir)) {
    console.log('✅ Uploads directory exists');
    
    // Check permissions
    try {
      const testFile = path.join(uploadsDir, 'test-write-permission.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Upload directory is writable');
    } catch (error) {
      console.error('❌ Upload directory is not writable:', error.message);
    }
  } else {
    console.log('❌ Uploads directory not found');
    console.log('⚠️ Creating uploads directory...');
    
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    } catch (error) {
      console.error('❌ Failed to create uploads directory:', error.message);
    }
  }
  
  // Check videos directory
  if (fs.existsSync(videosDir)) {
    console.log('✅ Videos directory exists');
  } else {
    console.log('⚠️ Creating videos directory...');
    
    try {
      fs.mkdirSync(videosDir, { recursive: true });
      console.log('✅ Created videos directory');
    } catch (error) {
      console.error('❌ Failed to create videos directory:', error.message);
    }
  }
}

// Test API endpoints
async function testApiEndpoints() {
  const token = checkExistingToken();
  
  if (!token) {
    console.log('❌ No valid token available to test endpoints');
    return;
  }
  
  const endpoints = [
    { url: '/cars?page=1&itemsPerPage=1', method: 'get', name: 'Get Cars' },
    { url: '/brands', method: 'get', name: 'Get Brands' },
    { url: '/auth/verify-token', method: 'get', name: 'Verify Token' },
    { url: '/auth/profile', method: 'get', name: 'Get Profile' }
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name} (${endpoint.method.toUpperCase()} ${endpoint.url})...`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${API_URL}${endpoint.url}`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ ${endpoint.name}: Success (${response.status})`);
        passCount++;
      } else {
        console.log(`⚠️ ${endpoint.name}: Unexpected status (${response.status})`);
        failCount++;
      }
    } catch (error) {
      console.error(`❌ ${endpoint.name} failed:`);
      
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response received from server');
      } else {
        console.error('Error:', error.message);
      }
      
      failCount++;
    }
  }
  
  console.log(`\nEndpoint tests summary: ${passCount} passed, ${failCount} failed`);
}

// Run the diagnostics
runDiagnostics().catch(error => {
  console.error('Diagnostics failed with error:', error);
  rl.close();
});

// Export functions for use in other scripts
module.exports = {
  checkExistingToken,
  verifyToken,
  loginWithDefaultCredentials
};

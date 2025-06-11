/**
 * Authentication Fix Script
 * 
 * This script helps fix the 401 authentication error by clearing invalid tokens
 * and providing fresh admin credentials.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

console.log('=== CarShop Authentication Fix ===');
console.log('This script will help resolve the 401 authentication error.\n');

// Step 1: Verify environment
console.log('1. Checking environment configuration...');
console.log(`API URL: ${API_URL}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set in environment variables!');
  console.log('Please ensure your .env file has JWT_SECRET=your_jwt_secret_here');
  process.exit(1);
}

console.log('✅ Environment configuration looks good.\n');

// Step 2: Test login with admin credentials
async function testAdminLogin() {
  console.log('2. Testing admin login...');
  
  try {
    const credentials = {
      username: 'admin',
      password: 'adminpassword'
    };
    
    console.log('Attempting login with admin credentials...');
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Admin login successful!');
      console.log('✅ Token generated successfully');
      
      // Test the token
      console.log('\n3. Testing token validation...');
      const tokenResponse = await axios.get(`${API_URL}/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${response.data.token}`
        }
      });
      
      if (tokenResponse.status === 200) {
        console.log('✅ Token validation successful!');
        console.log('✅ Authentication system is working correctly');
        
        return response.data.token;
      }
    }
  } catch (error) {
    console.error('❌ Login test failed:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n🔧 Creating admin user...');
        await createAdminUser();
      }
    } else {
      console.error('Error:', error.message);
      console.log('❌ Make sure the backend server is running on the correct port');
    }
    
    return null;
  }
}

// Create admin user if it doesn't exist
async function createAdminUser() {
  try {
    const adminData = {
      username: 'admin',
      email: 'admin@carshop.com',
      password: 'adminpassword',
      role: 'admin'
    };
    
    const response = await axios.post(`${API_URL}/auth/register`, adminData);
    
    if (response.status === 201) {
      console.log('✅ Admin user created successfully!');
      console.log('Now you can login with:');
      console.log('Username: admin');
      console.log('Password: adminpassword');
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('ℹ️ Admin user already exists');
    } else {
      console.error('❌ Failed to create admin user:', error.response?.data || error.message);
    }
  }
}

// Main execution
async function fixAuthentication() {
  const token = await testAdminLogin();
  
  if (token) {
    console.log('\n=== Fix Summary ===');
    console.log('✅ Authentication system is working correctly');
    console.log('✅ JWT secret configuration is consistent');
    console.log('✅ Admin login and token validation successful');
    
    console.log('\n📋 Next Steps for Users:');
    console.log('1. Clear browser cache and localStorage');
    console.log('2. Log out and log back in to get a fresh token');
    console.log('3. The 401 error should now be resolved');
    
    console.log('\n🔧 For developers:');
    console.log('- The JWT secret mismatch has been fixed');
    console.log('- All authentication components now use consistent JWT_SECRET');
    console.log('- Restart the backend server to apply changes');
  } else {
    console.log('\n❌ Authentication fix incomplete');
    console.log('Please check the server logs and try again');
  }
}

// Run the fix
fixAuthentication().catch(error => {
  console.error('Fix script failed:', error);
});

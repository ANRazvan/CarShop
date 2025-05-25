/**
 * Debug Authentication Issue
 * 
 * This script tests the JWT token validation to identify the 401 error issue
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Check JWT secrets
console.log('=== JWT Secret Debug ===');
console.log('Environment JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('Environment JWT_SECRET value:', process.env.JWT_SECRET);

// Check what's actually used in the middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
console.log('Actual JWT_SECRET used:', JWT_SECRET);

// Try to read a token from localStorage simulation
console.log('\n=== Token Validation Test ===');

// Let's create a test token with the environment secret
const testUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user'
};

// Create token with env secret
const tokenWithEnvSecret = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '24h' });
console.log('Token created with env secret:', tokenWithEnvSecret.substring(0, 20) + '...');

// Create token with fallback secret
const tokenWithFallbackSecret = jwt.sign(testUser, 'your-secret-key', { expiresIn: '24h' });
console.log('Token created with fallback secret:', tokenWithFallbackSecret.substring(0, 20) + '...');

// Test validation with both
console.log('\n=== Validation Tests ===');

try {
  const decoded1 = jwt.verify(tokenWithEnvSecret, JWT_SECRET);
  console.log('✅ Token with env secret validates successfully');
} catch (error) {
  console.log('❌ Token with env secret validation failed:', error.message);
}

try {
  const decoded2 = jwt.verify(tokenWithFallbackSecret, JWT_SECRET);
  console.log('✅ Token with fallback secret validates successfully');
} catch (error) {
  console.log('❌ Token with fallback secret validation failed:', error.message);
}

// Test cross-validation
console.log('\n=== Cross-Validation Tests ===');

try {
  const decoded3 = jwt.verify(tokenWithEnvSecret, 'your-secret-key');
  console.log('✅ Env secret token validates with fallback secret');
} catch (error) {
  console.log('❌ Env secret token fails with fallback secret:', error.message);
}

try {
  const decoded4 = jwt.verify(tokenWithFallbackSecret, process.env.JWT_SECRET);
  console.log('✅ Fallback secret token validates with env secret');
} catch (error) {
  console.log('❌ Fallback secret token fails with env secret:', error.message);
}

// Check if there's a stored auth token we can test
const AUTH_TOKEN_PATH = path.join(__dirname, '..', 'auth-token.txt');
if (fs.existsSync(AUTH_TOKEN_PATH)) {
  console.log('\n=== Stored Token Test ===');
  const storedToken = fs.readFileSync(AUTH_TOKEN_PATH, 'utf8').trim();
  console.log('Found stored token:', storedToken.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(storedToken, JWT_SECRET);
    console.log('✅ Stored token validates successfully');
    console.log('Token payload:', decoded);
  } catch (error) {
    console.log('❌ Stored token validation failed:', error.message);
    
    // Try with different secrets
    try {
      const decoded = jwt.verify(storedToken, 'your-secret-key');
      console.log('✅ Stored token validates with fallback secret');
    } catch (err2) {
      console.log('❌ Stored token also fails with fallback secret:', err2.message);
    }
  }
}

console.log('\n=== Recommendations ===');
if (process.env.JWT_SECRET !== 'your-secret-key') {
  console.log('⚠️ JWT secrets are different between .env and fallback');
  console.log('🔧 This could cause authentication issues if tokens are created with one secret but validated with another');
  console.log('💡 Solution: Ensure consistent JWT_SECRET usage across login and authentication');
}

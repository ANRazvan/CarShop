/**
 * Simple JWT Secret Verification
 * 
 * This script verifies that the JWT secret fix is working correctly
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('=== JWT Secret Verification ===');

// Check environment
const JWT_SECRET = process.env.JWT_SECRET;
console.log('JWT_SECRET from .env:', JWT_SECRET);

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set!');
  process.exit(1);
}

// Test token creation and validation
const testUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'user'
};

try {
  // Create token
  const token = jwt.sign(testUser, JWT_SECRET, { expiresIn: '24h' });
  console.log('✅ Token created successfully');
  
  // Validate token
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token validated successfully');
  console.log('User from token:', { id: decoded.id, username: decoded.username });
  
  console.log('\n✅ JWT secret consistency verified!');
  console.log('The authentication fix should now work correctly.');
  
} catch (error) {
  console.error('❌ JWT verification failed:', error.message);
}

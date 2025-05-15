const axios = require('axios');
const jwt = require('jsonwebtoken');

const API_URL = process.env.API_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create a test token
const createTestToken = () => {
  const testUser = {
    id: 1,
    email: 'test@example.com',
    role: 'admin'
  };
  
  return jwt.sign(testUser, JWT_SECRET, { expiresIn: '1h' });
};

const testCorsDelete = async () => {
  const token = createTestToken();
  console.log('Generated test token:', token);
  
  try {
    // First, make a GET request to confirm API is accessible
    console.log('Testing GET request...');
    const getResponse = await axios.get(`${API_URL}/api/cars`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('GET response status:', getResponse.status);
    
    // Only try to delete a car if we found one in the GET request
    if (getResponse.data && getResponse.data.cars && getResponse.data.cars.length > 0) {
      const testCarId = getResponse.data.cars[0].id;
      
      console.log(`Testing DELETE request for car ID ${testCarId}...`);
      const deleteResponse = await axios.delete(`${API_URL}/api/cars/${testCarId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'If-Modified-Since': '0'
        }
      });
      
      console.log('DELETE response status:', deleteResponse.status);
      console.log('DELETE response data:', deleteResponse.data);
    } else {
      console.log('No cars found to test DELETE operation');
    }
  } catch (error) {
    console.error('Error during test:');
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    
    if (error.request) {
      console.error('Request configuration:');
      console.error('URL:', error.config?.url);
      console.error('Method:', error.config?.method);
      console.error('Headers:', error.config?.headers);
    }
  }
};

testCorsDelete();

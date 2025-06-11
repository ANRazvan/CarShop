/**
 * Image Upload Test Tool for Car Shop API
 * 
 * This script helps test image uploads to ensure the functionality is working correctly.
 * It can be used to diagnose issues with image uploads in the Car Shop application.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:5000/api';
const TEST_IMAGE_PATH = path.join(__dirname, '../uploads/test-image.png');
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

/**
 * Test updating a car with a new image
 * @param {number} carId - ID of the car to update
 */
async function testCarImageUpdate(carId) {
  try {
    console.log(`Testing image update for car ID: ${carId}`);
    
    // First, create a test image if it doesn't exist
    if (!fs.existsSync(TEST_IMAGE_PATH)) {
      console.log('Test image not found. Creating a simple test image...');
      // Create a simple test PNG (this is just a 1x1 pixel PNG)
      const testImageData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(TEST_IMAGE_PATH, testImageData);
      console.log(`Created test image at: ${TEST_IMAGE_PATH}`);
    }
    
    // Create a FormData instance for the multipart request
    const formData = new FormData();
    formData.append('make', 'Test Make');
    formData.append('model', 'Test Model');
    formData.append('year', '2023');
    formData.append('price', '10000');
    formData.append('description', 'Test car with updated image');
    formData.append('fuelType', 'Gasoline');
    
    // Add the test image file
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    
    // Set request headers
    const headers = {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${AUTH_TOKEN}`
    };
    
    // Send the request
    console.log('Sending update request...');
    const response = await axios.put(
      `${API_URL}/cars/${carId}`, 
      formData, 
      { headers }
    );
    
    // Log the response
    console.log('Update successful!');
    console.log('Response status:', response.status);
    console.log('Updated car:', {
      id: response.data.id,
      make: response.data.make,
      model: response.data.model,
      hasImage: !!response.data.img,
      imageLength: response.data.img ? response.data.img.length : 0
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating car image:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}

/**
 * Test keeping an existing image
 * @param {number} carId - ID of the car to update
 */
async function testKeepExistingImage(carId) {
  try {
    console.log(`Testing keeping existing image for car ID: ${carId}`);
    
    // Create a FormData instance for the multipart request
    const formData = new FormData();
    formData.append('make', 'Updated Make');
    formData.append('model', 'Updated Model');
    formData.append('year', '2024');
    formData.append('price', '12000');
    formData.append('description', 'Updated description, keeping existing image');
    formData.append('fuelType', 'Hybrid');
    // Flag to keep existing image
    formData.append('keepExistingImage', 'true');
    
    // Set request headers
    const headers = {
      ...formData.getHeaders(),
      'Authorization': `Bearer ${AUTH_TOKEN}`
    };
    
    // Send the request
    console.log('Sending update request with keepExistingImage flag...');
    const response = await axios.put(
      `${API_URL}/cars/${carId}`, 
      formData, 
      { headers }
    );
    
    // Log the response
    console.log('Update successful!');
    console.log('Response status:', response.status);
    console.log('Updated car:', {
      id: response.data.id,
      make: response.data.make,
      model: response.data.model,
      hasImage: !!response.data.img,
      imageLength: response.data.img ? response.data.img.length : 0
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating car with keepExistingImage:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error message:', error.message);
    }
    
    throw error;
  }
}

// Export functions for use in other scripts
module.exports = {
  testCarImageUpdate,
  testKeepExistingImage
};

// If this script is run directly, execute the tests
if (require.main === module) {
  const carId = process.argv[2] || 1; // Default to car ID 1 if not provided
  
  // Run the tests
  (async () => {
    try {
      // Test updating with a new image
      await testCarImageUpdate(carId);
      
      // Wait a bit before the next test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Test keeping the existing image
      await testKeepExistingImage(carId);
      
      console.log('All tests completed successfully!');
    } catch (error) {
      console.error('Test execution failed.');
      process.exit(1);
    }
  })();
}

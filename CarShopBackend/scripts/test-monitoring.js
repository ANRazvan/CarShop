// Simple test script to verify monitoring endpoint
// Save this as test-monitoring.js
const http = require('http');

// Your authentication token
const token = 'YOUR_AUTH_TOKEN'; // Replace with a valid admin token

// Function to make an HTTP request
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5000,
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          console.log(`Raw response: ${responseData}`);
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Get monitored users
async function testGetMonitoredUsers() {
  try {
    console.log("Testing GET /api/monitoring/monitored");
    const result = await makeRequest('GET', '/api/monitoring/monitored');
    console.log("Response:", result);
    
    if (result.status === 200 && Array.isArray(result.data)) {
      // Pick the first monitored user for the PATCH test
      const firstUser = result.data[0];
      if (firstUser && firstUser.id) {
        await testPatchMonitoredUser(firstUser.id);
      } else {
        console.log("No monitored users found for PATCH test");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Update monitored user status
async function testPatchMonitoredUser(id) {
  try {
    console.log(`\nTesting PATCH /api/monitoring/monitored/${id}`);
    const result = await makeRequest(
      'PATCH', 
      `/api/monitoring/monitored/${id}`, 
      { status: 'resolved' }
    );
    console.log("Response:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run the tests
testGetMonitoredUsers();

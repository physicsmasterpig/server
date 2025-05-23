/**
 * Simple API Test Script
 * Run with: node test/api.test.js
 */
const http = require('http');

// Make a GET request to the server
function testApiEndpoint(endpoint) {  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: endpoint,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          console.log('Response:', JSON.stringify(parsedData, null, 2));
          resolve(parsedData);
        } catch (e) {
          console.log('Raw response:', data);
          if (data.trim()) {
            resolve(data);
          } else {
            reject(new Error('Empty response'));
          }
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

// Test endpoints
async function runTests() {  try {
    console.log('Testing server root endpoint...');
    await testApiEndpoint('/');
    
    console.log('\nTesting test API students endpoint...');
    await testApiEndpoint('/api/students/test');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();

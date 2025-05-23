/**
 * Test script for the render endpoint
 * Run with: node test/render-test.js
 */
const http = require('http');

// Make a GET request to the render endpoint
function testRenderEndpoint(page) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: `/render/${page}`,
      method: 'GET',
      headers: {
        'Content-Type': 'text/html'
      }
    };

    const req = http.request(options, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`First 100 characters of response:\n${data.substring(0, 100)}...`);
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      reject(error);
    });

    req.end();
  });
}

// Test students page
async function runTest() {
  try {
    console.log('Testing render endpoint for students page...');
    await testRenderEndpoint('students');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
runTest();

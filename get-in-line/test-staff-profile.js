// Test script for staff profile API
const fetch = require('node-fetch');

async function testStaffProfileAPI() {
  console.log('Testing Staff Profile API...\n');

  try {
    // Test the staff profile endpoint
    const response = await fetch('http://localhost:3000/api/staff/profile', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Staff Profile API Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.log('\n❌ Error Response:');
      console.log(errorData);
    }
  } catch (error) {
    console.error('\n❌ Error testing staff profile API:', error.message);
  }
}

// Run the test
testStaffProfileAPI();

// Simple test to check if the API endpoints are working
const testApi = async () => {
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test if the server is responding
    const response = await fetch('http://localhost:3000/api/users/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('✅ API is working (401 Unauthorized is expected when not logged in)');
    } else if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
  }
};

// Run the test
testApi();

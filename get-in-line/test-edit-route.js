// Test script to verify the edit route configuration
const BASE_URL = 'http://localhost:3001';

async function testEditRoute() {
  console.log('🧪 Testing Branch Edit Route Configuration...\n');

  try {
    // Test the exact route that the edit button should use
    const testBranchId = 'test-branch-123';
    const editRoute = `/business-admin/branches/edit/${testBranchId}`;
    
    console.log(`Testing route: ${editRoute}`);
    
    const response = await fetch(`${BASE_URL}${editRoute}`);
    
    if (response.status === 200) {
      console.log('✅ Edit route loads successfully');
      console.log('✅ Route configuration is correct');
    } else if (response.status === 404) {
      console.log('❌ Edit route returns 404 - Route not found');
      console.log('   This means the file structure doesn\'t match the route');
    } else if (response.status === 401) {
      console.log('✅ Edit route exists but requires authentication (expected)');
      console.log('✅ Route configuration is correct');
    } else {
      console.log(`⚠️  Unexpected response: ${response.status} ${response.statusText}`);
    }

    console.log('\n📝 Route Analysis:');
    console.log(`   - Config route: /business-admin/branches/edit/${testBranchId}`);
    console.log(`   - File location: /business-admin/branches/edit/[id]/page.tsx`);
    console.log(`   - Expected behavior: Should load the edit page`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

// Run the test
testEditRoute();

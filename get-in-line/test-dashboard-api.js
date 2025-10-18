// Test script for dashboard API endpoints
const BASE_URL = 'http://localhost:3000';

async function testDashboardAPI() {
  console.log('🧪 Testing Dashboard API Endpoints...\n');

  try {
    // Test 1: Dashboard data endpoint
    console.log('1. Testing /api/users/me/dashboard...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/users/me/dashboard`);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API working');
      console.log('   - User:', dashboardData.user?.name || 'No user');
      console.log('   - Active entries:', dashboardData.stats?.activeEntries || 0);
      console.log('   - Total entries:', dashboardData.stats?.totalEntries || 0);
      console.log('   - Today entries:', dashboardData.stats?.todayEntries || 0);
    } else {
      console.log('❌ Dashboard API failed:', dashboardResponse.status, dashboardResponse.statusText);
    }

    // Test 2: Notifications endpoint
    console.log('\n2. Testing /api/users/me/notifications...');
    const notificationsResponse = await fetch(`${BASE_URL}/api/users/me/notifications`);
    
    if (notificationsResponse.ok) {
      const notificationsData = await notificationsResponse.json();
      console.log('✅ Notifications API working');
      console.log('   - Unread count:', notificationsData.unreadCount || 0);
      console.log('   - Total notifications:', notificationsData.notifications?.length || 0);
    } else {
      console.log('❌ Notifications API failed:', notificationsResponse.status, notificationsResponse.statusText);
    }

    // Test 3: Recommended queues endpoint
    console.log('\n3. Testing /api/queues/recommended...');
    const recommendedResponse = await fetch(`${BASE_URL}/api/queues/recommended`);
    
    if (recommendedResponse.ok) {
      const recommendedData = await recommendedResponse.json();
      console.log('✅ Recommended queues API working');
      console.log('   - Recommended queues:', recommendedData.recommended?.length || 0);
      console.log('   - User history:', recommendedData.userHistory?.length || 0);
    } else {
      console.log('❌ Recommended queues API failed:', recommendedResponse.status, recommendedResponse.statusText);
    }

    console.log('\n🎉 Dashboard API testing completed!');
    console.log('\n📝 Note: Some endpoints may return 401 (Unauthorized) if you\'re not logged in.');
    console.log('   This is expected behavior for protected endpoints.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the development server is running: npm run dev');
  }
}

// Run the test
testDashboardAPI();

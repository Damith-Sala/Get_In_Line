#!/usr/bin/env node

/**
 * User Status Diagnostic Tool
 * 
 * This script helps diagnose why you can't access the staff dashboard
 * by checking your current user role and business association.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserStatus() {
  console.log('🔍 Checking User Status for Staff Dashboard Access');
  console.log('='.repeat(50));
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication Error:', authError.message);
      return;
    }
    
    if (!user) {
      console.log('❌ No authenticated user found');
      console.log('💡 Solution: Please log in first');
      return;
    }
    
    console.log('✅ User is authenticated');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    
    // Check user data via API
    console.log('\n🔍 Checking user data via API...');
    
    const response = await fetch('http://localhost:3000/api/users/me', {
      method: 'GET',
      headers: {
        'Cookie': `sb-access-token=${user.access_token}; sb-refresh-token=${user.refresh_token}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch user data:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      return;
    }
    
    const userData = await response.json();
    console.log('✅ User data fetched successfully');
    console.log(`   Role: ${userData.role}`);
    console.log(`   Business ID: ${userData.businessId || 'None'}`);
    
    // Check if user can access staff dashboard
    console.log('\n🎯 Staff Dashboard Access Check');
    console.log('-'.repeat(30));
    
    const allowedRoles = ['staff', 'business_admin', 'super_admin'];
    const hasValidRole = allowedRoles.includes(userData.role);
    
    if (!hasValidRole) {
      console.log('❌ Role Issue: Your role is not allowed');
      console.log(`   Current role: ${userData.role}`);
      console.log(`   Required roles: ${allowedRoles.join(', ')}`);
      console.log('\n💡 Solutions:');
      console.log('   1. Create a business account (becomes business_admin)');
      console.log('   2. Get added as staff by a business admin');
      console.log('   3. Use super admin access');
      return;
    }
    
    console.log('✅ Role is valid for staff dashboard');
    
    if (!userData.businessId) {
      console.log('❌ Business Association Issue: No business associated');
      console.log('\n💡 Solutions:');
      console.log('   1. Create a business account at /business-admin/create');
      console.log('   2. Get added as staff by a business admin');
      console.log('   3. Contact your business admin to add you as staff');
      return;
    }
    
    console.log('✅ Business association is valid');
    
    // Check permissions
    console.log('\n🔍 Checking permissions...');
    const permissionsResponse = await fetch('http://localhost:3000/api/users/me/permissions', {
      method: 'GET',
      headers: {
        'Cookie': `sb-access-token=${user.access_token}; sb-refresh-token=${user.refresh_token}`
      }
    });
    
    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json();
      console.log('✅ Permissions fetched successfully');
      console.log('   Queue Management Permissions:');
      console.log(`     - Create Queues: ${permissionsData.permissions.canCreateQueues ? '✅' : '❌'}`);
      console.log(`     - Edit Queues: ${permissionsData.permissions.canEditQueues ? '✅' : '❌'}`);
      console.log(`     - Delete Queues: ${permissionsData.permissions.canDeleteQueues ? '✅' : '❌'}`);
      console.log(`     - Manage Operations: ${permissionsData.permissions.canManageQueueOperations ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  Could not fetch permissions (this is okay for basic access)');
    }
    
    console.log('\n🎉 SUCCESS! You should be able to access the staff dashboard');
    console.log('   Try navigating to: http://localhost:3000/staff-dashboard');
    
  } catch (error) {
    console.error('❌ Error checking user status:', error.message);
  }
}

// Run the check
checkUserStatus();

#!/usr/bin/env node

/**
 * Staff Access Setup Tool
 * 
 * This tool helps you set up proper staff access to the staff dashboard
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseAnonKey || !databaseUrl) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const pool = new Pool({ connectionString: databaseUrl });

async function setupStaffAccess() {
  console.log('👥 STAFF ACCESS SETUP TOOL');
  console.log('='.repeat(40));
  
  try {
    // Check if user is logged in
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ You need to log in first!');
      console.log('💡 Go to: http://localhost:3000/login');
      return;
    }
    
    console.log(`✅ Logged in as: ${user.email}`);
    
    // Check current user status
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
      return;
    }
    
    const currentUser = userResult.rows[0];
    console.log(`   Current role: ${currentUser.role}`);
    console.log(`   Business ID: ${currentUser.business_id || 'None'}`);
    
    // Show available businesses
    const businessResult = await pool.query('SELECT id, name, owner_id FROM businesses');
    console.log('\n🏢 Available Businesses:');
    businessResult.rows.forEach((business, index) => {
      console.log(`   ${index + 1}. ${business.name} (ID: ${business.id})`);
    });
    
    console.log('\n🎯 STAFF ACCESS OPTIONS:');
    console.log('='.repeat(30));
    
    if (currentUser.role === 'user') {
      console.log('❌ Your current role is "user" - you need staff access');
      console.log('\n💡 SOLUTIONS:');
      console.log('1. Create a business account (becomes business_admin):');
      console.log('   → Go to: http://localhost:3000/business-admin/create');
      console.log('\n2. Get added as staff by a business owner:');
      console.log('   → Ask a business owner to add you via /business-admin/staff');
      console.log('\n3. Manually update your role (if you have database access):');
      console.log('   → Update your role to "staff" in the database');
    } else if (['staff', 'business_admin', 'super_admin'].includes(currentUser.role)) {
      console.log(`✅ Your role "${currentUser.role}" is valid for staff dashboard`);
      
      if (!currentUser.business_id) {
        console.log('❌ But you have no business association');
        console.log('\n💡 SOLUTIONS:');
        console.log('1. Create a business: http://localhost:3000/business-admin/create');
        console.log('2. Get added to an existing business as staff');
      } else {
        console.log(`✅ You have business association: ${currentUser.business_id}`);
        console.log('🎉 You should be able to access the staff dashboard!');
        console.log('   Try: http://localhost:3000/staff-dashboard');
      }
    }
    
    // Check if user is already staff in any business
    const staffResult = await pool.query('SELECT * FROM business_staff WHERE user_id = $1', [user.id]);
    if (staffResult.rows.length > 0) {
      console.log('\n👥 Staff Records Found:');
      staffResult.rows.forEach((staff, index) => {
        console.log(`   ${index + 1}. Business: ${staff.business_id}, Role: ${staff.role}, Active: ${staff.is_active}`);
      });
    }
    
    console.log('\n🔧 QUICK FIX OPTIONS:');
    console.log('='.repeat(25));
    console.log('1. Create Business Account (Recommended):');
    console.log('   → http://localhost:3000/business-admin/create');
    console.log('   → This makes you a business_admin with full access');
    console.log('\n2. Use Existing Business:');
    if (businessResult.rows.length > 0) {
      console.log('   → Ask the owner of one of these businesses to add you as staff');
      console.log('   → They can do this via /business-admin/staff');
    }
    console.log('\n3. Manual Database Update (Advanced):');
    console.log('   → Update your role to "staff" in the users table');
    console.log('   → Add a business_staff record');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupStaffAccess();


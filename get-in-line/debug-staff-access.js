#!/usr/bin/env node

/**
 * Comprehensive Staff Access Debug Tool
 * 
 * This will help us figure out exactly why you can't access the staff dashboard
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 COMPREHENSIVE STAFF ACCESS DEBUG');
console.log('='.repeat(50));

// Check environment variables
console.log('\n1. Environment Variables Check:');
console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   Supabase Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   Database URL: ${databaseUrl ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey || !databaseUrl) {
  console.log('\n❌ CRITICAL: Missing environment variables!');
  console.log('   Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const pool = new Pool({ connectionString: databaseUrl });

async function debugEverything() {
  try {
    console.log('\n2. Supabase Authentication Check:');
    
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.log(`   ❌ Session Error: ${sessionError.message}`);
    } else if (session) {
      console.log(`   ✅ Session exists for: ${session.user.email}`);
    } else {
      console.log('   ❌ No active session - you need to log in');
    }
    
    // Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log(`   ❌ User Error: ${userError.message}`);
    } else if (user) {
      console.log(`   ✅ User authenticated: ${user.email}`);
      console.log(`   User ID: ${user.id}`);
    } else {
      console.log('   ❌ No authenticated user');
    }
    
    console.log('\n3. Database Connection Check:');
    try {
      const dbTest = await pool.query('SELECT NOW()');
      console.log('   ✅ Database connected successfully');
    } catch (dbError) {
      console.log(`   ❌ Database Error: ${dbError.message}`);
    }
    
    console.log('\n4. User Data Check:');
    if (user) {
      try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user.id]);
        if (userResult.rows.length > 0) {
          const userRecord = userResult.rows[0];
          console.log('   ✅ User found in database:');
          console.log(`      Role: ${userRecord.role}`);
          console.log(`      Business ID: ${userRecord.business_id || 'None'}`);
          console.log(`      Name: ${userRecord.name}`);
        } else {
          console.log('   ❌ User not found in database');
        }
      } catch (dbError) {
        console.log(`   ❌ Database query error: ${dbError.message}`);
      }
    }
    
    console.log('\n5. Business Staff Check:');
    if (user) {
      try {
        const staffResult = await pool.query('SELECT * FROM business_staff WHERE user_id = $1', [user.id]);
        if (staffResult.rows.length > 0) {
          console.log('   ✅ Staff record found:');
          staffResult.rows.forEach((staff, index) => {
            console.log(`      Record ${index + 1}:`);
            console.log(`        Business ID: ${staff.business_id}`);
            console.log(`        Role: ${staff.role}`);
            console.log(`        Active: ${staff.is_active}`);
          });
        } else {
          console.log('   ❌ No staff records found');
        }
      } catch (dbError) {
        console.log(`   ❌ Staff query error: ${dbError.message}`);
      }
    }
    
    console.log('\n6. Available Businesses:');
    try {
      const businessResult = await pool.query('SELECT id, name, owner_id FROM businesses LIMIT 10');
      if (businessResult.rows.length > 0) {
        console.log('   ✅ Available businesses:');
        businessResult.rows.forEach((business, index) => {
          console.log(`      ${index + 1}. ${business.name} (ID: ${business.id})`);
        });
      } else {
        console.log('   ❌ No businesses found in database');
      }
    } catch (dbError) {
      console.log(`   ❌ Business query error: ${dbError.message}`);
    }
    
    console.log('\n7. API Endpoint Test:');
    try {
      const response = await fetch('http://localhost:3000/api/users/me');
      if (response.ok) {
        const data = await response.json();
        console.log('   ✅ API working:');
        console.log(`      Role: ${data.role}`);
        console.log(`      Business ID: ${data.businessId || 'None'}`);
      } else {
        console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`      Error: ${errorText}`);
      }
    } catch (apiError) {
      console.log(`   ❌ API Connection Error: ${apiError.message}`);
      console.log('      Make sure the dev server is running (npm run dev)');
    }
    
    console.log('\n8. Staff Dashboard Access Test:');
    try {
      const response = await fetch('http://localhost:3000/staff-dashboard');
      if (response.ok) {
        console.log('   ✅ Staff dashboard is accessible!');
      } else {
        console.log(`   ❌ Staff dashboard error: ${response.status} ${response.statusText}`);
      }
    } catch (dashboardError) {
      console.log(`   ❌ Dashboard Error: ${dashboardError.message}`);
    }
    
    console.log('\n🎯 DIAGNOSIS & SOLUTIONS:');
    console.log('='.repeat(30));
    
    if (!user) {
      console.log('❌ MAIN ISSUE: You are not logged in');
      console.log('💡 SOLUTION: Go to http://localhost:3000/login and log in');
    } else {
      console.log('✅ You are logged in');
      
      // Check role
      try {
        const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [user.id]);
        if (userResult.rows.length > 0) {
          const role = userResult.rows[0].role;
          const allowedRoles = ['staff', 'business_admin', 'super_admin'];
          
          if (!allowedRoles.includes(role)) {
            console.log(`❌ MAIN ISSUE: Your role is "${role}" but staff dashboard requires: ${allowedRoles.join(', ')}`);
            console.log('💡 SOLUTIONS:');
            console.log('   1. Create a business: http://localhost:3000/business-admin/create');
            console.log('   2. Use super admin: http://localhost:3000/super-admin/login');
            console.log('   3. Get added as staff by a business owner');
          } else {
            console.log(`✅ Your role "${role}" is valid for staff dashboard`);
            
            // Check business association
            const businessResult = await pool.query('SELECT business_id FROM users WHERE id = $1', [user.id]);
            const businessId = businessResult.rows[0]?.business_id;
            
            if (!businessId) {
              console.log('❌ MAIN ISSUE: No business association');
              console.log('💡 SOLUTIONS:');
              console.log('   1. Create a business: http://localhost:3000/business-admin/create');
              console.log('   2. Get added as staff by a business owner');
            } else {
              console.log(`✅ Business association found: ${businessId}`);
              console.log('🎉 You should be able to access the staff dashboard!');
              console.log('   Try: http://localhost:3000/staff-dashboard');
            }
          }
        }
      } catch (error) {
        console.log(`❌ Could not check user role: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the debug
debugEverything();

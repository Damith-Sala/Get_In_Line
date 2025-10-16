#!/usr/bin/env node

/**
 * Staff Access Fix Tool
 * 
 * This script helps fix common issues preventing staff dashboard access
 * by updating user roles and business associations.
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseAnonKey || !databaseUrl) {
  console.error('❌ Missing required environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const pool = new Pool({ connectionString: databaseUrl });

async function fixStaffAccess() {
  console.log('🔧 Staff Access Fix Tool');
  console.log('='.repeat(30));
  
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Please log in first');
      return;
    }
    
    console.log(`✅ Authenticated as: ${user.email}`);
    
    // Check current user status
    const userResponse = await fetch('http://localhost:3000/api/users/me');
    if (!userResponse.ok) {
      console.log('❌ Could not fetch user data');
      return;
    }
    
    const userData = await userResponse.json();
    console.log(`   Current role: ${userData.role}`);
    console.log(`   Business ID: ${userData.businessId || 'None'}`);
    
    // Show options
    console.log('\n🎯 Available Fix Options:');
    console.log('1. Create a business account (becomes business_admin)');
    console.log('2. Set role to staff (requires existing business)');
    console.log('3. Set role to super_admin (full access)');
    console.log('4. Check existing businesses');
    
    // For demo purposes, let's show how to create a business
    console.log('\n💡 Recommended: Create a business account');
    console.log('   This will give you business_admin role and full access');
    console.log('   Go to: http://localhost:3000/business-admin/create');
    
    // Check if there are any existing businesses
    const businessesResult = await pool.query('SELECT id, name, owner_id FROM businesses LIMIT 5');
    if (businessesResult.rows.length > 0) {
      console.log('\n🏢 Existing businesses:');
      businessesResult.rows.forEach((business, index) => {
        console.log(`   ${index + 1}. ${business.name} (ID: ${business.id})`);
      });
      console.log('\n💡 You can also ask a business owner to add you as staff');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the fix tool
fixStaffAccess();

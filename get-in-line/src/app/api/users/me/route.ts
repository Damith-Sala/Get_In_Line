import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getUserBusinessId } from '@/lib/auth-helpers';

export async function GET() {
  try {
    console.log('GET /api/users/me - Starting request');
    
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options });
          },
        },
      }
    );

    // Get the current authenticated user
    console.log('Getting authenticated user from Supabase...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.log('No authenticated user found');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('User authenticated:', user.id, user.email);

    // Get user record from custom database
    console.log('Looking up user in custom database...');
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    console.log('User record found:', userRecord.length > 0);

    if (userRecord.length === 0) {
      console.log('User not found in custom database, creating user record...');
      
      // Create user record if it doesn't exist
      try {
        const newUser = await db
          .insert(users)
          .values({
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.name || user.email!.split('@')[0],
            password: 'supabase_auth_user', // Placeholder since we use Supabase auth
            role: 'business_admin', // Default role for business users
          })
          .returning();

        console.log('Created new user record:', newUser[0]);
        
        return NextResponse.json({
          user: newUser[0],
          role: newUser[0].role || 'business_admin',
          businessId: null // Will be set when they create/join a business
        });
      } catch (createError: any) {
        console.error('Error creating user record:', createError);
        return NextResponse.json({ 
          error: 'Failed to create user record', 
          details: createError.message 
        }, { status: 500 });
      }
    }

    console.log('Getting business ID for user...');
    // Get business ID from either users table or businessStaff table
    const businessId = await getUserBusinessId(user.id);
    console.log('Business ID found:', businessId);

    return NextResponse.json({
      user: userRecord[0],
      role: userRecord[0].role || 'user',
      businessId: businessId
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch user data', details: error.message },
      { status: 500 }
    );
  }
}

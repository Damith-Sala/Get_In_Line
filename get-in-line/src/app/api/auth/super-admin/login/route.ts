import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// Hardcoded super admin credentials
const SUPER_ADMIN_CREDENTIALS = {
  email: 'superadmin@getinline.com',
  password: 'SuperAdmin123!',
  name: 'Super Administrator'
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Check if it's the super admin credentials
    if (email !== SUPER_ADMIN_CREDENTIALS.email || password !== SUPER_ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { error: 'Invalid super admin credentials' },
        { status: 401 }
      );
    }

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

    // Check if super admin user exists in our database
    let superAdminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, SUPER_ADMIN_CREDENTIALS.email))
      .limit(1);

    // Create super admin user if doesn't exist
    if (superAdminUser.length === 0) {
      const newSuperAdmin = await db
        .insert(users)
        .values({
          email: SUPER_ADMIN_CREDENTIALS.email,
          name: SUPER_ADMIN_CREDENTIALS.name,
          password: 'super_admin_hardcoded', // Special marker
          role: 'super_admin',
          businessId: null, // Super admin is not tied to any business
        })
        .returning();
      
      superAdminUser = newSuperAdmin;
    }

    // For super admin, we'll create a custom session approach
    // Since we're using hardcoded credentials, we'll bypass Supabase auth
    console.log('Super admin login successful, creating custom session');
    
    // Create a custom session for super admin
    const customSession = {
      access_token: 'super_admin_token_' + Date.now(),
      refresh_token: 'super_admin_refresh_' + Date.now(),
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: superAdminUser[0].id,
        email: superAdminUser[0].email,
        name: superAdminUser[0].name,
        role: 'super_admin'
      }
    };

    // Set a custom cookie for super admin session
    cookieStore.set('super-admin-session', JSON.stringify(customSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    return NextResponse.json({
      message: 'Super admin login successful',
      user: {
        id: superAdminUser[0].id,
        email: superAdminUser[0].email,
        name: superAdminUser[0].name,
        role: 'super_admin'
      },
      isSuperAdmin: true,
      session: customSession
    });

  } catch (error) {
    console.error('Super admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

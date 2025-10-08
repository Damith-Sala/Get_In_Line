import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user already exists in custom users table
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, user.email!))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        message: 'User already exists in custom table',
        user: existingUser[0]
      });
    }

    // Create user in custom users table
    const newUser = await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || 'Unknown',
        password: 'supabase_auth_user', // Placeholder since password is handled by Supabase Auth
      })
      .returning();

    return NextResponse.json({ 
      message: 'User synced successfully',
      user: newUser[0]
    });

  } catch (error) {
    console.error('Sync user error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}

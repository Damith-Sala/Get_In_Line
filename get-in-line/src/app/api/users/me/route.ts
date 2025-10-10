import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getUserBusinessId } from '@/lib/auth-helpers';

export async function GET() {
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

    // Get user record from custom database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Get business ID from either users table or businessStaff table
    const businessId = await getUserBusinessId(user.id);

    return NextResponse.json({
      user: userRecord[0],
      role: userRecord[0].role || 'user',
      businessId: businessId
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queueEntries, users } from '@/lib/drizzle/schema';
import { sql, eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { queueId } = await request.json();
    
    if (!queueId) {
      return NextResponse.json({ error: 'Queue ID is required' }, { status: 400 });
    }
    
    // Get authenticated user
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        authError: authError?.message 
      }, { status: 401 });
    }

    const userId = user.id;

    // Check if user exists in custom users table
    const customUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    // If user doesn't exist in custom table, create them
    if (customUser.length === 0) {
      await db
        .insert(users)
        .values({
          id: userId,
          email: user.email!,
          name: user.user_metadata?.name || 'Unknown',
          password: 'supabase_auth_user',
        });
    }

    // Check if user is already in this queue
    const existingEntry = await db
      .select()
      .from(queueEntries)
      .where(sql`${queueEntries.queueId} = ${queueId} AND ${queueEntries.userId} = ${userId}`)
      .limit(1);

    if (existingEntry.length > 0) {
      return NextResponse.json({
        error: 'You are already in this queue',
        existingEntry: existingEntry[0]
      }, { status: 400 });
    }
    
    // Get current position (highest position + 1)
    const lastEntry = await db
      .select()
      .from(queueEntries)
      .where(sql`${queueEntries.queueId} = ${queueId}`)
      .orderBy(queueEntries.position)
      .limit(1);
      
    const position = lastEntry.length > 0 ? lastEntry[0].position + 1 : 1;
    
    const entry = await db
      .insert(queueEntries)
      .values({
        userId,
        queueId,
        position,
        status: 'waiting',
      })
      .returning();
      
    return NextResponse.json({
      success: true,
      entry: entry[0],
      debug: {
        userId,
        queueId,
        position,
        customUserExists: customUser.length > 0,
        lastEntry: lastEntry[0] || null
      }
    });
  } catch (error) {
    console.error('Debug join queue error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to join queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

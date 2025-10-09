import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queueEntries, users } from '@/lib/drizzle/schema';
import { sql, eq } from 'drizzle-orm';
import { broadcastToQueue } from '@/lib/socket-server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    const body = await request.json();
    const { userId: clientUserId } = body;
    
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

    // Try to get the session first, then the user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ 
        error: 'Not authenticated - no session found',
        details: sessionError?.message 
      }, { status: 401 });
    }

    const user = session.user;
    
    // Use client-provided userId if server-side auth fails
    let userId = user?.id || clientUserId;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated - no user ID available',
        debug: {
          hasSession: !!session,
          hasUser: !!user,
          hasClientUserId: !!clientUserId
        }
      }, { status: 401 });
    }

    // Check if user exists in custom users table, create if not
    const customUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

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
      return NextResponse.json(
        { error: 'You are already in this queue' },
        { status: 400 }
      );
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

    // 🚀 NEW: Broadcast position update to all clients in this queue
    try {
      broadcastToQueue(queueId, 'position-changed', {
        queueId,
        position: entry[0].position,
        totalInQueue: position,
        newUser: true
      });
    } catch (socketError) {
      console.log('Socket broadcast failed (non-critical):', socketError);
    }
      
    return NextResponse.json(entry[0], { status: 201 });
  } catch (error) {
    console.error('Join queue error:', error);
    return NextResponse.json(
      { error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}
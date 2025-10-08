import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries, users } from '@/lib/drizzle/schema';
import { sql, eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists in custom users table, create if not
    const customUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (customUser.length === 0) {
      // Create user in custom users table
      await db
        .insert(users)
        .values({
          id: userId,
          email: 'user@example.com', // Placeholder
          name: 'User',
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
      
    return NextResponse.json({
      success: true,
      entry: entry[0],
      position: position
    });
  } catch (error) {
    console.error('Join queue error:', error);
    return NextResponse.json(
      { error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/drizzle/schema';
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

    // Find the user's entry in this queue
    const userEntry = await db
      .select()
      .from(queueEntries)
      .where(sql`${queueEntries.queueId} = ${queueId} AND ${queueEntries.userId} = ${userId}`)
      .limit(1);

    if (userEntry.length === 0) {
      return NextResponse.json(
        { error: 'You are not in this queue' },
        { status: 404 }
      );
    }

    const entry = userEntry[0];

    // Check if user is already being served (can't leave if being served)
    if (entry.status === 'serving') {
      return NextResponse.json(
        { error: 'Cannot leave queue while being served. Please wait to be served or ask staff for help.' },
        { status: 400 }
      );
    }

    // Delete the user's entry from the queue
    await db
      .delete(queueEntries)
      .where(sql`${queueEntries.queueId} = ${queueId} AND ${queueEntries.userId} = ${userId}`);

    // Update positions of remaining users in the queue
    // Get all entries with position higher than the leaving user
    const remainingEntries = await db
      .select()
      .from(queueEntries)
      .where(sql`${queueEntries.queueId} = ${queueId} AND ${queueEntries.position} > ${entry.position}`)
      .orderBy(queueEntries.position);

    // Decrease position by 1 for all users behind the leaving user
    for (const remainingEntry of remainingEntries) {
      await db
        .update(queueEntries)
        .set({ position: remainingEntry.position - 1 })
        .where(eq(queueEntries.id, remainingEntry.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the queue',
      leftPosition: entry.position,
      updatedCount: remainingEntries.length
    });

  } catch (error) {
    console.error('Leave queue error:', error);
    return NextResponse.json(
      { error: 'Failed to leave queue' },
      { status: 500 }
    );
  }
}

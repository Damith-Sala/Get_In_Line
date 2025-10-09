import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queues, queueEntries } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    
    // Check if queue exists and is active
    const queue = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (queue.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    if (!queue[0].isActive) {
      return NextResponse.json({ error: 'Queue is not active' }, { status: 400 });
    }

    // Get current queue position
    const currentEntries = await db
      .select()
      .from(queueEntries)
      .where(eq(queueEntries.queueId, queueId));

    const nextPosition = currentEntries.length + 1;

    // Create guest entry (without user ID)
    const guestEntry = await db.insert(queueEntries).values({
      queueId: queueId,
      userId: null, // Guest entry
      position: nextPosition,
      status: 'waiting',
      enteredAt: new Date(),
    }).returning();

    return NextResponse.json({
      message: 'Successfully joined queue as guest',
      entry: guestEntry[0],
      position: nextPosition,
      estimatedWaitTime: queue[0].estimatedWaitTime,
    });

  } catch (error) {
    console.error('Guest join queue error:', error);
    return NextResponse.json(
      { error: 'Failed to join queue' },
      { status: 500 }
    );
  }
}

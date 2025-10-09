import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';
import { broadcastToQueue } from '@/lib/socket-server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    
    // Get next person in line
    const nextInLine = await db
      .select()
      .from(queueEntries)
      .where(sql`${queueEntries.queueId} = ${queueId} AND ${queueEntries.status} = 'waiting'`)
      .orderBy(queueEntries.position)
      .limit(1);
      
    if (nextInLine.length === 0) {
      return NextResponse.json(
        { message: 'No one in line' },
        { status: 404 }
      );
    }
    
    // Update their status
    const updated = await db
      .update(queueEntries)
      .set({
        status: 'serving',
        updatedAt: new Date(),
      })
      .where(sql`${queueEntries.id} = ${nextInLine[0].id}`)
      .returning();

    // 🚀 NEW: Broadcast to all clients in this queue
    try {
      broadcastToQueue(queueId, 'next-called', {
        queueId,
        position: nextInLine[0].position,
        userId: nextInLine[0].userId,
        message: `Position ${nextInLine[0].position} is now being served!`
      });

      // Also broadcast updated queue status
      broadcastToQueue(queueId, 'queue-updated', {
        queueId,
        currentServing: nextInLine[0].position,
        timestamp: new Date().toISOString()
      });
    } catch (socketError) {
      console.log('Socket broadcast failed (non-critical):', socketError);
    }
      
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process next in line' },
      { status: 500 }
    );
  }
}
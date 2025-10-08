import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

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
      
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process next in line' },
      { status: 500 }
    );
  }
}
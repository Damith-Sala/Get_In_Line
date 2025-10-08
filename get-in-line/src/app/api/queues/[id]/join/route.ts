import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/drizzle/schema';
import { sql } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = ''; // TODO: Get from auth session
    const queueId = params.id;
    
    // Get current position
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
      
    return NextResponse.json(entry[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to join queue' },
      { status: 400 }
    );
  }
}
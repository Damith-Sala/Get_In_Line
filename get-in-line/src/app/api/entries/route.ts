import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueEntries } from '@/lib/drizzle/schema';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const updated = await db
      .update(queueEntries)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'served' ? { servedAt: new Date() } : {}),
      })
      .where({ id })
      .returning();
      
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}
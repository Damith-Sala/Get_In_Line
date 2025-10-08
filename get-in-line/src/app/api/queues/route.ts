import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queues } from '@/lib/drizzle/schema';
import { queueSchema } from '@/lib/validation';

export async function GET() {
  try {
    const allQueues = await db.select().from(queues);
    return NextResponse.json(allQueues);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = queueSchema.parse(body);
    
    const newQueue = await db.insert(queues).values(validatedData).returning();
    return NextResponse.json(newQueue[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create queue' },
      { status: 400 }
    );
  }
}
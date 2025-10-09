import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queues } from '@/lib/drizzle/schema';

export async function POST() {
  try {
    // Create a demo queue for testing
    const demoQueue = await db.insert(queues).values({
      name: 'Demo Restaurant Queue',
      description: 'Join our demo queue to test the guest joining feature!',
      serviceType: 'restaurant',
      maxSize: 50,
      isActive: true,
      estimatedWaitTime: 15,
    }).returning();

    return NextResponse.json({
      message: 'Demo queue created successfully',
      queue: demoQueue[0],
    });
  } catch (error) {
    console.error('Create demo queue error:', error);
    return NextResponse.json(
      { error: 'Failed to create demo queue' },
      { status: 500 }
    );
  }
}

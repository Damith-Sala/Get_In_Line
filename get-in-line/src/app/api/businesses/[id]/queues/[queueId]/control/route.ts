import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queues, queueEntries, businesses, users } from '@/lib/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function POST(
  request: Request,
  { params }: { params: { id: string; queueId: string } }
) {
  try {
    const businessId = params.id;
    const queueId = params.queueId;
    const body = await request.json();
    const { action, userId } = body; // action: 'next', 'close', 'open', 'walkin'
    
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user has permission to manage this business
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userBusiness = userRecord[0];
    
    // Check if user is owner or admin of this business
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (business[0].ownerId !== user.id && userBusiness.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Verify queue belongs to this business
    const queue = await db
      .select()
      .from(queues)
      .where(and(
        eq(queues.id, queueId),
        eq(queues.businessId, businessId)
      ))
      .limit(1);

    if (queue.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'next':
        // Move to next person in queue
        const nextEntry = await db
          .select()
          .from(queueEntries)
          .where(and(
            eq(queueEntries.queueId, queueId),
            eq(queueEntries.status, 'waiting')
          ))
          .orderBy(queueEntries.position)
          .limit(1);

        if (nextEntry.length === 0) {
          return NextResponse.json({ error: 'No one waiting in queue' }, { status: 400 });
        }

        // Mark current serving person as served (if any)
        await db
          .update(queueEntries)
          .set({ 
            status: 'served',
            servedAt: new Date(),
            servedBy: user.id
          })
          .where(and(
            eq(queueEntries.queueId, queueId),
            eq(queueEntries.status, 'serving')
          ));

        // Mark next person as serving
        result = await db
          .update(queueEntries)
          .set({ 
            status: 'serving',
            updatedAt: new Date()
          })
          .where(eq(queueEntries.id, nextEntry[0].id))
          .returning();

        break;

      case 'close':
        // Close the queue
        result = await db
          .update(queues)
          .set({ 
            isActive: false,
            updatedAt: new Date()
          })
          .where(eq(queues.id, queueId))
          .returning();
        break;

      case 'open':
        // Open the queue
        result = await db
          .update(queues)
          .set({ 
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(queues.id, queueId))
          .returning();
        break;

      case 'walkin':
        // Add walk-in customer
        if (!userId) {
          return NextResponse.json({ error: 'User ID required for walk-in' }, { status: 400 });
        }

        // Get current position
        const lastEntry = await db
          .select()
          .from(queueEntries)
          .where(eq(queueEntries.queueId, queueId))
          .orderBy(queueEntries.position)
          .limit(1);
          
        const position = lastEntry.length > 0 ? lastEntry[0].position + 1 : 1;

        result = await db
          .insert(queueEntries)
          .values({
            userId,
            queueId,
            position,
            status: 'waiting',
            isWalkIn: true,
          })
          .returning();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result[0], { status: 200 });
  } catch (error) {
    console.error('Queue control error:', error);
    return NextResponse.json(
      { error: 'Failed to control queue' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queues, queueEntries, users } from '@/lib/drizzle/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { hasBusinessAccess } from '@/lib/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    
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

    // Check if user has access to this business
    const hasAccess = await hasBusinessAccess(user.id, businessId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get all queues for this business with additional stats
    const businessQueues = await db
      .select({
        id: queues.id,
        name: queues.name,
        description: queues.description,
        service_type: queues.serviceType,
        max_size: queues.maxSize,
        is_active: queues.isActive,
        estimated_wait_time: queues.estimatedWaitTime,
        created_at: queues.createdAt,
        updated_at: queues.updatedAt,
      })
      .from(queues)
      .where(eq(queues.businessId, businessId))
      .orderBy(desc(queues.createdAt));

    // Get queue statistics for each queue
    const queuesWithStats = await Promise.all(
      businessQueues.map(async (queue) => {
        // Get current serving position
        const currentServing = await db
          .select({ position: queueEntries.position })
          .from(queueEntries)
          .where(and(
            eq(queueEntries.queueId, queue.id),
            eq(queueEntries.status, 'serving')
          ))
          .limit(1);

        // Get total waiting count
        const waitingCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(queueEntries)
          .where(and(
            eq(queueEntries.queueId, queue.id),
            eq(queueEntries.status, 'waiting')
          ));

        return {
          ...queue,
          current_position: currentServing[0]?.position || null,
          total_waiting: waitingCount[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(queuesWithStats);
  } catch (error) {
    console.error('Fetch business queues error:', error);
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 });
  }
}

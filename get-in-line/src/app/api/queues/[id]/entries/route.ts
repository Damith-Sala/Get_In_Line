import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queueEntries, queues, users, businesses } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { hasBusinessAccess } from '@/lib/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    
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

    // Get queue details to find business ID
    const queue = await db
      .select({
        id: queues.id,
        businessId: queues.businessId,
      })
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (queue.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    // Check if user has access to this business
    if (!queue[0].businessId) {
      return NextResponse.json({ error: 'Queue has no associated business' }, { status: 400 });
    }
    
    const hasAccess = await hasBusinessAccess(user.id, queue[0].businessId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get queue entries with user details
    const entries = await db
      .select({
        id: queueEntries.id,
        position: queueEntries.position,
        status: queueEntries.status,
        entered_at: queueEntries.enteredAt,
        updated_at: queueEntries.updatedAt,
        served_at: queueEntries.servedAt,
        is_walk_in: queueEntries.isWalkIn,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(queueEntries)
      .leftJoin(users, eq(queueEntries.userId, users.id))
      .where(eq(queueEntries.queueId, queueId))
      .orderBy(queueEntries.position);

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Fetch queue entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue entries' }, { status: 500 });
  }
}

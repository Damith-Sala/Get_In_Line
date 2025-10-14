import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queues, users, queueEntries } from '@/lib/drizzle/schema';
import { queueSchema } from '@/lib/validation';
import { eq, and, sql } from 'drizzle-orm';
import { hasPermission } from '@/lib/permission-helpers';

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
    
    // Get queue details
    const queueRecord = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (queueRecord.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    const queue = queueRecord[0];

    // Get current serving position
    const currentServing = await db
      .select({ position: queueEntries.position })
      .from(queueEntries)
      .where(and(
        eq(queueEntries.queueId, queueId),
        eq(queueEntries.status, 'serving')
      ))
      .limit(1);

    // Get total waiting count
    const waitingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(queueEntries)
      .where(and(
        eq(queueEntries.queueId, queueId),
        eq(queueEntries.status, 'waiting')
      ));

    return NextResponse.json({
      ...queue,
      current_position: currentServing[0]?.position || null,
      total_waiting: waitingCount[0]?.count || 0,
    });
  } catch (error) {
    console.error('Fetch queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    const body = await request.json();
    const validatedData = queueSchema.parse(body);
    
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
    
    // Check if user is a business user (admin or staff)
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userRecord[0].role;
    const userBusinessId = userRecord[0].businessId;

    // Only allow business users (staff, admin, super_admin) to update queues
    if (!['staff', 'business_admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: 'Only business accounts can update queues' 
      }, { status: 403 });
    }

    // Ensure user has a business association
    if (!userBusinessId) {
      return NextResponse.json({ 
        error: 'User must be associated with a business to update queues' 
      }, { status: 403 });
    }

    // Check if queue exists and belongs to user's business
    const queueRecord = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (queueRecord.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    if (queueRecord[0].businessId !== userBusinessId) {
      return NextResponse.json({ 
        error: 'You can only update queues from your own business' 
      }, { status: 403 });
    }

    // Check if user has permission to edit queues (for staff members)
    if (userRole === 'staff') {
      const canEdit = await hasPermission(user.id, userBusinessId, 'canEditQueues');
      if (!canEdit) {
        return NextResponse.json({ 
          error: 'You do not have permission to edit queues. Contact your business admin.' 
        }, { status: 403 });
      }
    }
    
    // Update queue
    const updatedQueue = await db
      .update(queues)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        serviceType: validatedData.serviceType,
        maxSize: validatedData.maxSize,
        estimatedWaitTime: validatedData.estimatedWaitTime,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(queues.id, queueId))
      .returning();

    return NextResponse.json(updatedQueue[0]);
  } catch (error) {
    console.error('Update queue error:', error);
    return NextResponse.json(
      { error: 'Failed to update queue' },
      { status: 400 }
    );
  }
}

export async function DELETE(
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
    
    // Check if user is a business user (admin or staff)
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userRecord[0].role;
    const userBusinessId = userRecord[0].businessId;

    // Only allow business users (staff, admin, super_admin) to delete queues
    if (!['staff', 'business_admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: 'Only business accounts can delete queues' 
      }, { status: 403 });
    }

    // Ensure user has a business association
    if (!userBusinessId) {
      return NextResponse.json({ 
        error: 'User must be associated with a business to delete queues' 
      }, { status: 403 });
    }

    // Check if queue exists and belongs to user's business
    const queueRecord = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (queueRecord.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    if (queueRecord[0].businessId !== userBusinessId) {
      return NextResponse.json({ 
        error: 'You can only delete queues from your own business' 
      }, { status: 403 });
    }

    // Check if user has permission to delete queues (for staff members)
    if (userRole === 'staff') {
      const canDelete = await hasPermission(user.id, userBusinessId, 'canDeleteQueues');
      if (!canDelete) {
        return NextResponse.json({ 
          error: 'You do not have permission to delete queues. Contact your business admin.' 
        }, { status: 403 });
      }
    }

    // Delete the queue (this will cascade delete queue entries)
    await db.delete(queues).where(eq(queues.id, queueId));

    return NextResponse.json({ 
      message: 'Queue deleted successfully' 
    });

  } catch (error) {
    console.error('Delete queue error:', error);
    return NextResponse.json(
      { error: 'Failed to delete queue' },
      { status: 400 }
    );
  }
}

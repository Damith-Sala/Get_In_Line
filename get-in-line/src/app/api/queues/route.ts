import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queues, users, businesses } from '@/lib/drizzle/schema';
import { queueSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Try to get queues with business information, fallback to basic queues if join fails
    let allQueues;
    
    try {
      // First try with business join
      allQueues = await db
        .select({
          id: queues.id,
          name: queues.name,
          description: queues.description,
          current_position: queues.estimatedWaitTime,
          estimated_wait_time: queues.estimatedWaitTime,
          is_active: queues.isActive,
          created_at: queues.createdAt,
          business_name: businesses.name,
          business_type: businesses.businessType,
        })
        .from(queues)
        .leftJoin(businesses, eq(queues.businessId, businesses.id));
    } catch (joinError) {
      console.log('Business join failed, using basic queue query:', joinError);
      // Fallback to basic queue query without business join
      const basicQueues = await db
        .select({
          id: queues.id,
          name: queues.name,
          description: queues.description,
          current_position: queues.estimatedWaitTime,
          estimated_wait_time: queues.estimatedWaitTime,
          is_active: queues.isActive,
          created_at: queues.createdAt,
        })
        .from(queues);
      
      // Add null business fields
      allQueues = basicQueues.map(queue => ({
        ...queue,
        business_name: null,
        business_type: null,
      }));
    }

    // Filter active queues
    const activeQueues = allQueues.filter(queue => queue.is_active === true);

    return NextResponse.json({ queues: activeQueues });
  } catch (error) {
    console.error('Fetch queues error:', error);
    // Return empty array if there's an error, so the page still loads
    return NextResponse.json({ queues: [] });
  }
}

export async function POST(request: Request) {
  try {
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

    // Only allow business users (staff, admin, super_admin) to create queues
    if (!['staff', 'admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ 
        error: 'Only business accounts can create queues' 
      }, { status: 403 });
    }

    // Ensure user has a business association
    if (!userBusinessId) {
      return NextResponse.json({ 
        error: 'User must be associated with a business to create queues' 
      }, { status: 403 });
    }
    
    // Create queue with business association
    const newQueue = await db.insert(queues).values({
      ...validatedData,
      creatorId: user.id,
      businessId: userBusinessId,
    }).returning();
    return NextResponse.json(newQueue[0], { status: 201 });
  } catch (error) {
    console.error('Create queue error:', error);
    return NextResponse.json(
      { error: 'Failed to create queue' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queueId = searchParams.get('id');
    
    if (!queueId) {
      return NextResponse.json(
        { error: 'Queue ID is required' },
        { status: 400 }
      );
    }

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
    if (!['staff', 'admin', 'super_admin'].includes(userRole)) {
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
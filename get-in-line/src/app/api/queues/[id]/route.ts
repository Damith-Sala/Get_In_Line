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
    console.log('PUT request for queue:', queueId, 'with body:', body);
    
    const validatedData = queueSchema.parse(body);
    console.log('Validated data:', validatedData);
    
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
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Check if user is a business user (admin or staff)
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userRecord[0].role;
    const userBusinessId = userRecord[0].businessId;
    
    console.log('User role:', userRole);
    console.log('User business ID:', userBusinessId);

    // Only allow business users (staff, business_admin, super_admin) to update queues
    if (!['staff', 'business_admin', 'super_admin'].includes(userRole)) {
      console.log('User role not allowed:', userRole);
      return NextResponse.json({ 
        error: 'Only business accounts can update queues' 
      }, { status: 403 });
    }

    // Ensure user has a business association
    if (!userBusinessId) {
      console.log('User has no business association');
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
      console.log('Queue not found:', queueId);
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    console.log('Queue found:', queueRecord[0]);
    console.log('Queue business ID:', queueRecord[0].businessId);

    if (queueRecord[0].businessId !== userBusinessId) {
      console.log('Queue does not belong to user business');
      return NextResponse.json({ 
        error: 'You can only update queues from your own business' 
      }, { status: 403 });
    }

    // Check if user has permission to edit queues (for staff members only)
    // Business admins and super admins have full permissions by default
    if (userRole === 'staff') {
      try {
        console.log('Checking staff permissions for user:', user.id);
        const canEdit = await hasPermission(user.id, userBusinessId, 'canEditQueues');
        console.log('Staff edit permission result:', canEdit);
        if (!canEdit) {
          console.log('Staff user does not have edit permission');
          return NextResponse.json({ 
            error: 'You do not have permission to edit queues. Contact your business admin.' 
          }, { status: 403 });
        }
      } catch (permissionError: any) {
        console.error('Permission check error:', permissionError);
        console.error('Permission error stack:', permissionError.stack);
        return NextResponse.json({ 
          error: 'Permission check failed' 
        }, { status: 500 });
      }
    } else {
      console.log('User is business admin or super admin, skipping permission check');
    }
    
    // Update queue
    console.log('Attempting to update queue:', queueId);
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

    console.log('Queue updated successfully:', updatedQueue[0]);
    return NextResponse.json(updatedQueue[0]);
  } catch (error: any) {
    console.error('Update queue error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to update queue', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    console.log('DELETE request for queue:', queueId);
    
    // Test database connection
    try {
      console.log('Testing database connection...');
      await db.select().from(users).limit(1);
      console.log('Database connection successful');
    } catch (dbError: any) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: dbError.message 
      }, { status: 500 });
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
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('User authenticated:', user.id);
    
    // Check if user is a business user (admin or staff)
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      console.log('User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userRecord[0].role;
    const userBusinessId = userRecord[0].businessId;
    
    console.log('User role:', userRole);
    console.log('User business ID:', userBusinessId);

    // Only allow business users (staff, business_admin, super_admin) to delete queues
    if (!['staff', 'business_admin', 'super_admin'].includes(userRole)) {
      console.log('User role not allowed:', userRole);
      return NextResponse.json({ 
        error: 'Only business accounts can delete queues' 
      }, { status: 403 });
    }

    // Ensure user has a business association
    if (!userBusinessId) {
      console.log('User has no business association');
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
      console.log('Queue not found:', queueId);
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    console.log('Queue found:', queueRecord[0]);
    console.log('Queue business ID:', queueRecord[0].businessId);

    if (queueRecord[0].businessId !== userBusinessId) {
      console.log('Queue does not belong to user business');
      return NextResponse.json({ 
        error: 'You can only delete queues from your own business' 
      }, { status: 403 });
    }

    // Check if user has permission to delete queues (for staff members only)
    // Business admins and super admins have full permissions by default
    if (userRole === 'staff') {
      try {
        console.log('Checking staff permissions for user:', user.id);
        const canDelete = await hasPermission(user.id, userBusinessId, 'canDeleteQueues');
        console.log('Staff delete permission result:', canDelete);
        if (!canDelete) {
          console.log('Staff user does not have delete permission');
          return NextResponse.json({ 
            error: 'You do not have permission to delete queues. Contact your business admin.' 
          }, { status: 403 });
        }
      } catch (permissionError: any) {
        console.error('Permission check error:', permissionError);
        console.error('Permission error stack:', permissionError.stack);
        return NextResponse.json({ 
          error: 'Permission check failed' 
        }, { status: 500 });
      }
    } else {
      console.log('User is business admin or super admin, skipping permission check');
    }

    // Delete the queue and its entries
    console.log('Attempting to delete queue:', queueId);
    
    // First, let's check if the queue exists and get its details
    const queueToDelete = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);
    
    if (queueToDelete.length === 0) {
      console.log('Queue not found for deletion:', queueId);
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }
    
    console.log('Queue found for deletion:', queueToDelete[0]);
    
    // Check if there are any queue entries
    const existingEntries = await db
      .select()
      .from(queueEntries)
      .where(eq(queueEntries.queueId, queueId));
    
    console.log(`Found ${existingEntries.length} queue entries to delete`);
    
    // Delete all queue entries first
    if (existingEntries.length > 0) {
      console.log('Deleting queue entries...');
      const deleteEntriesResult = await db.delete(queueEntries).where(eq(queueEntries.queueId, queueId));
      console.log('Queue entries deleted:', deleteEntriesResult);
    }
    
    // Now delete the queue
    console.log('Deleting queue...');
    const deleteResult = await db.delete(queues).where(eq(queues.id, queueId));
    console.log('Queue deleted successfully:', deleteResult);

    return NextResponse.json({ 
      message: 'Queue deleted successfully' 
    });

  } catch (error: any) {
    console.error('Delete queue error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to delete queue', details: error.message },
      { status: 500 }
    );
  }
}

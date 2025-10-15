import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queues, businesses, queueEntries, users, notifications, queueAnalytics } from '@/lib/drizzle/schema';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { eq, sql } from 'drizzle-orm';

// Helper function to validate super admin sessions
function validateSuperAdminSession(sessionData: any): boolean {
  if (!sessionData || !sessionData.user || sessionData.user.role !== 'super_admin') {
    return false;
  }
  
  // Check if session is expired
  if (sessionData.expires_in) {
    const sessionTime = sessionData.access_token.split('_').pop();
    const currentTime = Date.now();
    const sessionAge = (currentTime - parseInt(sessionTime)) / 1000; // in seconds
    
    if (sessionAge > sessionData.expires_in) {
      return false; // Session expired
    }
  }
  
  return true;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    
    // Verify super admin access
    const cookieStore = cookies();
    
    const superAdminSession = cookieStore.get('super-admin-session');
    
    if (superAdminSession) {
      try {
        const sessionData = JSON.parse(superAdminSession.value);
        if (!validateSuperAdminSession(sessionData)) {
          return NextResponse.json({ error: 'Invalid or expired super admin session' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Get queue details with business information and statistics
    const queueData = await db
      .select({
        queue: queues,
        business: businesses,
        totalEntries: sql<number>`count(${queueEntries.id})`,
        waitingEntries: sql<number>`count(case when ${queueEntries.status} = 'waiting' then 1 end)`,
        servingEntries: sql<number>`count(case when ${queueEntries.status} = 'serving' then 1 end)`,
        servedEntries: sql<number>`count(case when ${queueEntries.status} = 'served' then 1 end)`,
        cancelledEntries: sql<number>`count(case when ${queueEntries.status} = 'cancelled' then 1 end)`,
        lastActivity: sql<string>`max(${queueEntries.enteredAt})`
      })
      .from(queues)
      .leftJoin(businesses, eq(queues.businessId, businesses.id))
      .leftJoin(queueEntries, eq(queues.id, queueEntries.queueId))
      .where(eq(queues.id, queueId))
      .groupBy(queues.id, businesses.id)
      .limit(1);

    if (queueData.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    const q = queueData[0];

    // Format the response
    const formattedQueue = {
      id: q.queue.id,
      name: q.queue.name,
      description: q.queue.description,
      serviceType: q.queue.serviceType,
      maxSize: q.queue.maxSize,
      isActive: q.queue.isActive,
      estimatedWaitTime: q.queue.estimatedWaitTime,
      createdAt: q.queue.createdAt,
      updatedAt: q.queue.updatedAt,
      business: {
        id: q.business?.id,
        name: q.business?.name,
        businessType: q.business?.businessType,
        isActive: q.business?.isActive
      },
      statistics: {
        totalEntries: q.totalEntries || 0,
        waitingEntries: q.waitingEntries || 0,
        servingEntries: q.servingEntries || 0,
        servedEntries: q.servedEntries || 0,
        cancelledEntries: q.cancelledEntries || 0,
        averageWaitTime: q.queue.estimatedWaitTime || 0,
        lastActivity: q.lastActivity
      }
    };

    return NextResponse.json(formattedQueue);

  } catch (error) {
    console.error('Super admin queue details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const queueId = params.id;
    
    // Verify super admin access
    const cookieStore = cookies();
    
    const superAdminSession = cookieStore.get('super-admin-session');
    
    if (superAdminSession) {
      try {
        const sessionData = JSON.parse(superAdminSession.value);
        if (!validateSuperAdminSession(sessionData)) {
          return NextResponse.json({ error: 'Invalid or expired super admin session' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, serviceType, maxSize, estimatedWaitTime, isActive } = body;

    // Check if queue exists
    const existingQueue = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (existingQueue.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    // Update the queue
    const updatedQueue = await db
      .update(queues)
      .set({
        name: name || existingQueue[0].name,
        description: description !== undefined ? description : existingQueue[0].description,
        serviceType: serviceType !== undefined ? serviceType : existingQueue[0].serviceType,
        maxSize: maxSize !== undefined ? (maxSize ? parseInt(maxSize) : null) : existingQueue[0].maxSize,
        estimatedWaitTime: estimatedWaitTime !== undefined ? (estimatedWaitTime ? parseInt(estimatedWaitTime) : null) : existingQueue[0].estimatedWaitTime,
        isActive: isActive !== undefined ? isActive : existingQueue[0].isActive,
        updatedAt: new Date()
      })
      .where(eq(queues.id, queueId))
      .returning();

    return NextResponse.json({
      message: 'Queue updated successfully',
      queue: updatedQueue[0]
    });

  } catch (error) {
    console.error('Super admin queue update error:', error);
    return NextResponse.json(
      { error: 'Failed to update queue' },
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
    
    // Verify super admin access
    const cookieStore = cookies();
    
    const superAdminSession = cookieStore.get('super-admin-session');
    
    if (superAdminSession) {
      try {
        const sessionData = JSON.parse(superAdminSession.value);
        if (!validateSuperAdminSession(sessionData)) {
          return NextResponse.json({ error: 'Invalid or expired super admin session' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Check if queue exists
    const existingQueue = await db
      .select()
      .from(queues)
      .where(eq(queues.id, queueId))
      .limit(1);

    if (existingQueue.length === 0) {
      return NextResponse.json({ error: 'Queue not found' }, { status: 404 });
    }

    // Delete related records first (CASCADE DELETE manually)
    await db.delete(queueEntries).where(eq(queueEntries.queueId, queueId));
    await db.delete(notifications).where(eq(notifications.queueId, queueId));
    await db.delete(queueAnalytics).where(eq(queueAnalytics.queueId, queueId));

    // Now delete the queue
    await db.delete(queues).where(eq(queues.id, queueId));

    return NextResponse.json({
      message: 'Queue and all related data deleted successfully'
    });

  } catch (error) {
    console.error('Super admin queue deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete queue' },
      { status: 500 }
    );
  }
}

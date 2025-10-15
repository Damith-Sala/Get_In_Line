import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queues, businesses, queueEntries, users } from '@/lib/drizzle/schema';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { eq, sql, desc } from 'drizzle-orm';

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

export async function GET() {
  try {
    // Verify super admin access
    const cookieStore = cookies();
    
    // Check for super admin session cookie first
    const superAdminSession = cookieStore.get('super-admin-session');
    
    if (superAdminSession) {
      try {
        const sessionData = JSON.parse(superAdminSession.value);
        if (validateSuperAdminSession(sessionData)) {
          // Super admin session found and valid, proceed with queue data
          console.log('Super admin session verified via cookie');
        } else {
          return NextResponse.json({ error: 'Invalid or expired super admin session' }, { status: 401 });
        }
      } catch (error) {
        return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
      }
    } else {
      // Fallback to Supabase auth
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

      // Check if user is super admin
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (userRecord.length === 0 || userRecord[0].role !== 'super_admin') {
        return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
      }
    }

    // Get all queues with business information and statistics
    const allQueues = await db
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
      .groupBy(queues.id, businesses.id)
      .orderBy(desc(queues.createdAt));

    // Format the response
    const formattedQueues = allQueues.map(q => ({
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
    }));

    return NextResponse.json({
      queues: formattedQueues,
      totalQueues: formattedQueues.length,
      activeQueues: formattedQueues.filter(q => q.isActive).length,
      inactiveQueues: formattedQueues.filter(q => !q.isActive).length
    });

  } catch (error) {
    console.error('Super admin queues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queue data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Verify super admin access (same as GET)
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
    const { name, description, serviceType, maxSize, estimatedWaitTime, businessId } = body;

    // Validate required fields
    if (!name || !businessId) {
      return NextResponse.json({ error: 'Name and business ID are required' }, { status: 400 });
    }

    // Verify business exists
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Create the queue
    const newQueue = await db
      .insert(queues)
      .values({
        name,
        description: description || null,
        serviceType: serviceType || null,
        maxSize: maxSize ? parseInt(maxSize) : null,
        estimatedWaitTime: estimatedWaitTime ? parseInt(estimatedWaitTime) : null,
        businessId,
        isActive: true
      })
      .returning();

    return NextResponse.json({
      message: 'Queue created successfully',
      queue: newQueue[0]
    });

  } catch (error) {
    console.error('Super admin queue creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create queue' },
      { status: 500 }
    );
  }
}

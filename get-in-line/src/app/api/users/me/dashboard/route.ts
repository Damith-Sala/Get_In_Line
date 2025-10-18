import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, queueEntries, queues, businesses } from '@/lib/drizzle/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function GET() {
  try {
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

    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's active queue entries with queue and business details
    const myEntries = await db
      .select({
        id: queueEntries.id,
        queueId: queueEntries.queueId,
        position: queueEntries.position,
        status: queueEntries.status,
        enteredAt: queueEntries.enteredAt,
        updatedAt: queueEntries.updatedAt,
        servedAt: queueEntries.servedAt,
        queueName: queues.name,
        queueDescription: queues.description,
        estimatedWaitTime: queues.estimatedWaitTime,
        businessName: businesses.name,
        businessType: businesses.businessType,
      })
      .from(queueEntries)
      .leftJoin(queues, eq(queueEntries.queueId, queues.id))
      .leftJoin(businesses, eq(queues.businessId, businesses.id))
      .where(eq(queueEntries.userId, user.id))
      .orderBy(desc(queueEntries.enteredAt));

    // Get today's entries count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEntries = await db
      .select({ count: sql<number>`count(*)` })
      .from(queueEntries)
      .where(and(
        eq(queueEntries.userId, user.id),
        sql`${queueEntries.enteredAt} >= ${today}`,
        sql`${queueEntries.enteredAt} < ${tomorrow}`
      ));

    // Get completed entries count for today
    const completedToday = await db
      .select({ count: sql<number>`count(*)` })
      .from(queueEntries)
      .where(and(
        eq(queueEntries.userId, user.id),
        eq(queueEntries.status, 'served'),
        sql`${queueEntries.servedAt} >= ${today}`,
        sql`${queueEntries.servedAt} < ${tomorrow}`
      ));

    // Get total entries count
    const totalEntries = await db
      .select({ count: sql<number>`count(*)` })
      .from(queueEntries)
      .where(eq(queueEntries.userId, user.id));

    // Get popular queues (most entries in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const popularQueues = await db
      .select({
        id: queues.id,
        name: queues.name,
        description: queues.description,
        estimatedWaitTime: queues.estimatedWaitTime,
        businessName: businesses.name,
        businessType: businesses.businessType,
        entryCount: sql<number>`count(${queueEntries.id})`,
      })
      .from(queues)
      .leftJoin(businesses, eq(queues.businessId, businesses.id))
      .leftJoin(queueEntries, and(
        eq(queueEntries.queueId, queues.id),
        sql`${queueEntries.enteredAt} >= ${sevenDaysAgo}`
      ))
      .where(eq(queues.isActive, true))
      .groupBy(queues.id, businesses.name, businesses.businessType)
      .orderBy(desc(sql`count(${queueEntries.id})`))
      .limit(5);

    // Get recent activity (last 10 entries)
    const recentActivity = await db
      .select({
        id: queueEntries.id,
        queueName: queues.name,
        businessName: businesses.name,
        status: queueEntries.status,
        position: queueEntries.position,
        enteredAt: queueEntries.enteredAt,
        servedAt: queueEntries.servedAt,
      })
      .from(queueEntries)
      .leftJoin(queues, eq(queueEntries.queueId, queues.id))
      .leftJoin(businesses, eq(queues.businessId, businesses.id))
      .where(eq(queueEntries.userId, user.id))
      .orderBy(desc(queueEntries.enteredAt))
      .limit(10);

    // Calculate statistics
    const activeEntries = myEntries.filter(entry => 
      ['waiting', 'serving'].includes(entry.status)
    );

    const waitingEntries = myEntries.filter(entry => entry.status === 'waiting');
    const servingEntries = myEntries.filter(entry => entry.status === 'serving');
    const completedEntries = myEntries.filter(entry => entry.status === 'served');

    // Calculate average wait time for completed entries
    const completedWithWaitTime = myEntries.filter(entry => 
      entry.status === 'served' && entry.servedAt && entry.enteredAt
    );

    let averageWaitTime = 0;
    if (completedWithWaitTime.length > 0) {
      const totalWaitTime = completedWithWaitTime.reduce((sum, entry) => {
        const waitTime = new Date(entry.servedAt!).getTime() - new Date(entry.enteredAt).getTime();
        return sum + (waitTime / (1000 * 60)); // Convert to minutes
      }, 0);
      averageWaitTime = Math.round(totalWaitTime / completedWithWaitTime.length);
    }

    // Get most used business
    const businessUsage = myEntries.reduce((acc, entry) => {
      const businessName = entry.businessName || 'Unknown';
      acc[businessName] = (acc[businessName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteBusiness = Object.keys(businessUsage).length > 0 
      ? Object.keys(businessUsage).reduce((a, b) => businessUsage[a] > businessUsage[b] ? a : b)
      : 'None';

    const dashboardData = {
      user: {
        id: user.id,
        name: userRecord[0].name,
        email: userRecord[0].email,
        role: userRecord[0].role,
      },
      stats: {
        activeEntries: activeEntries.length,
        waitingEntries: waitingEntries.length,
        servingEntries: servingEntries.length,
        completedEntries: completedEntries.length,
        totalEntries: totalEntries[0]?.count || 0,
        todayEntries: todayEntries[0]?.count || 0,
        completedToday: completedToday[0]?.count || 0,
        averageWaitTime,
        favoriteBusiness,
      },
      myEntries: activeEntries,
      popularQueues: popularQueues.filter(q => q.id), // Filter out null entries
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        message: generateActivityMessage(activity),
        type: getActivityType(activity.status),
      })),
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function generateActivityMessage(activity: any): string {
  const businessName = activity.businessName || 'Unknown Business';
  const queueName = activity.queueName || 'Unknown Queue';
  
  switch (activity.status) {
    case 'waiting':
      return `Joined ${queueName} at ${businessName} (Position #${activity.position})`;
    case 'serving':
      return `Now being served at ${queueName} - ${businessName}`;
    case 'served':
      return `Completed service at ${queueName} - ${businessName}`;
    case 'cancelled':
      return `Left ${queueName} at ${businessName}`;
    case 'missed':
      return `Missed your turn at ${queueName} - ${businessName}`;
    default:
      return `Updated status in ${queueName} at ${businessName}`;
  }
}

function getActivityType(status: string): string {
  switch (status) {
    case 'waiting':
      return 'joined';
    case 'serving':
      return 'serving';
    case 'served':
      return 'completed';
    case 'cancelled':
    case 'missed':
      return 'left';
    default:
      return 'updated';
  }
}

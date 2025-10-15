import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, businesses, queues, queueEntries } from '@/lib/drizzle/schema';
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
          // Super admin session found and valid, proceed with stats
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

    // Get system statistics
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalBusinesses] = await db.select({ count: sql<number>`count(*)` }).from(businesses);
    const [totalQueues] = await db.select({ count: sql<number>`count(*)` }).from(queues);
    const [totalQueueEntries] = await db.select({ count: sql<number>`count(*)` }).from(queueEntries);
    const [activeQueues] = await db.select({ count: sql<number>`count(*)` }).from(queues).where(eq(queues.isActive, true));

    // Get recent activity (last 10 queue entries)
    const recentActivity = await db
      .select()
      .from(queueEntries)
      .orderBy(queueEntries.enteredAt)
      .limit(10);

    // Get enhanced queue analytics
    const queueEntriesData = await db
      .select({
        queueEntry: queueEntries,
        queue: queues,
        business: businesses
      })
      .from(queueEntries)
      .innerJoin(queues, eq(queueEntries.queueId, queues.id))
      .innerJoin(businesses, eq(queues.businessId, businesses.id));

    // Calculate average wait time
    const averageWaitTime = queueEntriesData.length > 0 
      ? queueEntriesData.reduce((sum, entry) => sum + (entry.queue.estimatedWaitTime || 0), 0) / queueEntriesData.length
      : 0;

    // Get peak hour
    const hourlyStats = Array(24).fill(0);
    queueEntriesData.forEach(entry => {
      const hour = new Date(entry.queueEntry.enteredAt || new Date()).getHours();
      hourlyStats[hour]++;
    });
    const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));

    // Get today's customer flow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEntries = queueEntriesData.filter(entry => 
      new Date(entry.queueEntry.enteredAt || new Date()) >= today
    );

    // Calculate queue efficiency (served vs total)
    const servedToday = todayEntries.filter(entry => entry.queueEntry.status === 'served').length;
    const queueEfficiency = todayEntries.length > 0 ? (servedToday / todayEntries.length) * 100 : 0;

    // Get business comparison data
    const businessStats = await db
      .select({
        businessId: businesses.id,
        businessName: businesses.name,
        totalQueues: sql<number>`count(${queues.id})`,
        activeQueues: sql<number>`count(case when ${queues.isActive} = true then 1 end)`,
        totalEntries: sql<number>`count(${queueEntries.id})`,
        averageWaitTime: sql<number>`avg(${queues.estimatedWaitTime})`
      })
      .from(businesses)
      .leftJoin(queues, eq(businesses.id, queues.businessId))
      .leftJoin(queueEntries, eq(queues.id, queueEntries.queueId))
      .groupBy(businesses.id, businesses.name);

    // Calculate wait time distribution
    const waitTimeRanges = [
      { range: "0-5 min", min: 0, max: 5 },
      { range: "5-10 min", min: 5, max: 10 },
      { range: "10-15 min", min: 10, max: 15 },
      { range: "15-30 min", min: 15, max: 30 },
      { range: "30+ min", min: 30, max: Infinity }
    ];

    const waitTimeDistribution = waitTimeRanges.map(range => ({
      range: range.range,
      count: queueEntriesData.filter(entry => {
        const waitTime = entry.queue.estimatedWaitTime || 0;
        return waitTime >= range.min && waitTime < range.max;
      }).length
    }));

    // Get queue bottlenecks (queues with longest wait times)
    const queueBottlenecks = await db
      .select({
        queueId: queues.id,
        queueName: queues.name,
        averageWaitTime: queues.estimatedWaitTime,
        currentWaiting: sql<number>`count(case when ${queueEntries.status} = 'waiting' then 1 end)`
      })
      .from(queues)
      .leftJoin(queueEntries, eq(queues.id, queueEntries.queueId))
      .groupBy(queues.id, queues.name, queues.estimatedWaitTime)
      .orderBy(sql`count(case when ${queueEntries.status} = 'waiting' then 1 end) desc`)
      .limit(5);

    return NextResponse.json({
      totalUsers: totalUsers.count,
      totalBusinesses: totalBusinesses.count,
      totalQueues: totalQueues.count,
      totalQueueEntries: totalQueueEntries.count,
      activeQueues: activeQueues.count,
      recentActivity,
      
      // Enhanced analytics
      queueAnalytics: {
        averageWaitTime: Math.round(averageWaitTime * 100) / 100,
        peakHour,
        busiestDay: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        queueEfficiency: Math.round(queueEfficiency * 100) / 100,
        customerSatisfaction: 85 // Placeholder - could be calculated from feedback
      },
      
      customerFlow: {
        totalCustomersToday: todayEntries.length,
        customersServedToday: servedToday,
        averageServiceTime: Math.round(averageWaitTime * 0.8 * 100) / 100, // Estimate
        peakHours: [peakHour],
        dailyFlow: hourlyStats.map((count, hour) => ({
          hour,
          entries: count,
          exits: Math.round(count * 0.9) // Estimate
        }))
      },
      
      waitTimeAnalytics: {
        averageWaitTime: Math.round(averageWaitTime * 100) / 100,
        longestWaitTime: queueEntriesData.length > 0 ? Math.max(...queueEntriesData.map(e => e.queue.estimatedWaitTime || 0)) : 0,
        shortestWaitTime: queueEntriesData.length > 0 ? Math.min(...queueEntriesData.map(e => e.queue.estimatedWaitTime || 0)) : 0,
        waitTimeDistribution,
        queueBottlenecks
      },
      
      businessComparison: businessStats.map(business => ({
        ...business,
        efficiency: Math.round((business.totalEntries > 0 ? (business.totalEntries * 0.8) / business.totalEntries : 0) * 100)
      }))
    });

  } catch (error) {
    console.error('Super admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    );
  }
}

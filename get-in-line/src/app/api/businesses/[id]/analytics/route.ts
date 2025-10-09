import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { businesses, queues, queueEntries, queueAnalytics, users } from '@/lib/drizzle/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
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

    // Check if user has permission to view analytics for this business
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

    // Get business queues
    const businessQueues = await db
      .select()
      .from(queues)
      .where(eq(queues.businessId, businessId));

    const queueIds = businessQueues.map(q => q.id);

    if (queueIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalQueues: 0,
          totalEntries: 0,
          averageWaitTime: 0,
          peakHour: 0,
          completedServices: 0,
          cancelledServices: 0
        },
        dailyStats: [],
        queueStats: []
      });
    }

    // Get queue entries for the date range
    const queueEntriesData = await db
      .select()
      .from(queueEntries)
      .where(and(
        sql`${queueEntries.queueId} = ANY(${queueIds})`,
        gte(queueEntries.enteredAt, startDate)
      ));

    // Calculate summary statistics
    const totalEntries = queueEntriesData.length;
    const completedServices = queueEntriesData.filter(e => e.status === 'served').length;
    const cancelledServices = queueEntriesData.filter(e => e.status === 'cancelled' || e.status === 'missed').length;
    
    // Calculate average wait time (simplified - using served entries)
    const servedEntries = queueEntriesData.filter(e => e.status === 'served' && e.servedAt);
    const averageWaitTime = servedEntries.length > 0 
      ? servedEntries.reduce((sum, entry) => {
          const waitTime = new Date(entry.servedAt!).getTime() - new Date(entry.enteredAt || new Date()).getTime();
          return sum + (waitTime / (1000 * 60)); // Convert to minutes
        }, 0) / servedEntries.length
      : 0;

    // Calculate peak hour
    const hourlyStats = new Array(24).fill(0);
    queueEntriesData.forEach(entry => {
      const hour = new Date(entry.enteredAt || new Date()).getHours();
      hourlyStats[hour]++;
    });
    const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));

    // Get daily statistics
    const dailyStats = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayEntries = queueEntriesData.filter(entry => {
        const entryDate = new Date(entry.enteredAt || new Date());
        return entryDate >= date && entryDate < nextDate;
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        totalEntries: dayEntries.length,
        completedServices: dayEntries.filter(e => e.status === 'served').length,
        cancelledServices: dayEntries.filter(e => e.status === 'cancelled' || e.status === 'missed').length,
      });
    }

    // Get queue-specific statistics
    const queueStats = businessQueues.map(queue => {
      const queueEntriesForQueue = queueEntriesData.filter(e => e.queueId === queue.id);
      const queueCompleted = queueEntriesForQueue.filter(e => e.status === 'served').length;
      const queueCancelled = queueEntriesForQueue.filter(e => e.status === 'cancelled' || e.status === 'missed').length;
      
      return {
        queueId: queue.id,
        queueName: queue.name,
        serviceType: queue.serviceType,
        totalEntries: queueEntriesForQueue.length,
        completedServices: queueCompleted,
        cancelledServices: queueCancelled,
        averageWaitTime: queue.estimatedWaitTime || 0,
      };
    });

    const analytics = {
      summary: {
        totalQueues: businessQueues.length,
        totalEntries,
        averageWaitTime: Math.round(averageWaitTime * 100) / 100,
        peakHour,
        completedServices,
        cancelledServices
      },
      dailyStats: dailyStats.reverse(), // Most recent first
      queueStats,
      hourlyDistribution: hourlyStats
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

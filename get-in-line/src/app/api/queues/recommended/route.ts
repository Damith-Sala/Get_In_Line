import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, queueEntries, queues, businesses } from '@/lib/drizzle/schema';
import { eq, and, sql, gte } from 'drizzle-orm';

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

    // Get user's queue history to find preferred businesses
    const userHistory = await db
      .select({
        businessId: businesses.id,
        businessName: businesses.name,
        businessType: businesses.businessType,
        usageCount: sql<number>`count(${queueEntries.id})`,
      })
      .from(queueEntries)
      .leftJoin(queues, eq(queueEntries.queueId, queues.id))
      .leftJoin(businesses, eq(queues.businessId, businesses.id))
      .where(eq(queueEntries.userId, user.id))
      .groupBy(businesses.id, businesses.name, businesses.businessType)
      .orderBy(desc(sql`count(${queueEntries.id})`));

    // Get active queues with low wait times
    const activeQueues = await db
      .select({
        id: queues.id,
        name: queues.name,
        description: queues.description,
        estimatedWaitTime: queues.estimatedWaitTime,
        maxSize: queues.maxSize,
        businessId: queues.businessId,
        businessName: businesses.name,
        businessType: businesses.businessType,
        currentWaiting: sql<number>`count(${queueEntries.id})`,
      })
      .from(queues)
      .leftJoin(businesses, eq(queues.businessId, businesses.id))
      .leftJoin(queueEntries, and(
        eq(queueEntries.queueId, queues.id),
        eq(queueEntries.status, 'waiting')
      ))
      .where(eq(queues.isActive, true))
      .groupBy(queues.id, businesses.name, businesses.businessType)
      .orderBy(sql`count(${queueEntries.id}) ASC`) // Order by least waiting
      .limit(20);

    // Get user's current active entries to exclude them
    const userActiveEntries = await db
      .select({ queueId: queueEntries.queueId })
      .from(queueEntries)
      .where(and(
        eq(queueEntries.userId, user.id),
        eq(queueEntries.status, 'waiting')
      ));

    const userActiveQueueIds = userActiveEntries.map(entry => entry.queueId);

    // Filter out queues user is already in
    const availableQueues = activeQueues.filter(queue => 
      !userActiveQueueIds.includes(queue.id)
    );

    // Score and rank queues based on user preferences
    const scoredQueues = availableQueues.map(queue => {
      let score = 0;
      
      // Base score from wait time (lower is better)
      const waitTime = queue.estimatedWaitTime || 15;
      score += Math.max(0, 30 - waitTime);
      
      // Bonus for preferred businesses
      const preferredBusiness = userHistory.find(h => h.businessId === queue.businessId);
      if (preferredBusiness) {
        score += preferredBusiness.usageCount * 10;
      }
      
      // Bonus for low current waiting
      score += Math.max(0, 20 - (queue.currentWaiting || 0));
      
      // Bonus for same business type as user's history
      const userBusinessTypes = userHistory.map(h => h.businessType).filter(Boolean);
      if (userBusinessTypes.includes(queue.businessType)) {
        score += 15;
      }
      
      return {
        ...queue,
        score,
      };
    });

    // Sort by score and return top recommendations
    const recommendedQueues = scoredQueues
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(queue => ({
        id: queue.id,
        name: queue.name,
        description: queue.description,
        estimatedWaitTime: queue.estimatedWaitTime,
        maxSize: queue.maxSize,
        businessName: queue.businessName,
        businessType: queue.businessType,
        currentWaiting: queue.currentWaiting,
        score: queue.score,
        reason: getRecommendationReason(queue, userHistory),
      }));

    return NextResponse.json({
      recommended: recommendedQueues,
      userHistory: userHistory.slice(0, 5), // Top 5 used businesses
    });
  } catch (error) {
    console.error('Recommended queues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommended queues' },
      { status: 500 }
    );
  }
}

function getRecommendationReason(queue: any, userHistory: any[]): string {
  const preferredBusiness = userHistory.find(h => h.businessId === queue.businessId);
  
  if (preferredBusiness) {
    return `You've used this business ${preferredBusiness.usageCount} times before`;
  }
  
  if (queue.currentWaiting <= 2) {
    return 'Short wait time - only a few people ahead';
  }
  
  if (queue.estimatedWaitTime && queue.estimatedWaitTime <= 10) {
    return 'Quick service - estimated wait under 10 minutes';
  }
  
  return 'Popular choice with good reviews';
}

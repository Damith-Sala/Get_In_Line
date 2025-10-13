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

    return NextResponse.json({
      totalUsers: totalUsers.count,
      totalBusinesses: totalBusinesses.count,
      totalQueues: totalQueues.count,
      totalQueueEntries: totalQueueEntries.count,
      activeQueues: activeQueues.count,
      recentActivity
    });

  } catch (error) {
    console.error('Super admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system stats' },
      { status: 500 }
    );
  }
}

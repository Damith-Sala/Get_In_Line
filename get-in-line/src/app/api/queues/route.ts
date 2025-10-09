import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { queues, users } from '@/lib/drizzle/schema';
import { queueSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allQueues = await db.select().from(queues);
    return NextResponse.json(allQueues);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch queues' }, { status: 500 });
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
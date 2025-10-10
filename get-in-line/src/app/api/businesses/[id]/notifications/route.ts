import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { businesses, notifications, users } from '@/lib/drizzle/schema';
import { notificationSchema } from '@/lib/validation';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
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

    // Check if user has permission to view notifications for this business
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

    // Check authorization: user must be either:
    // 1. The business owner, OR
    // 2. A super admin, OR  
    // 3. An admin with access to this business
    const isOwner = business[0].ownerId === user.id;
    const isSuperAdmin = userBusiness.role === 'super_admin';
    const isAdminWithAccess = userBusiness.role === 'admin' && userBusiness.businessId === businessId;

    if (!isOwner && !isSuperAdmin && !isAdminWithAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get notifications for this business
    const businessNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.businessId, businessId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    
    return NextResponse.json(businessNotifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const body = await request.json();
    const validatedData = notificationSchema.parse(body);
    
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

    // Check if user has permission to send notifications for this business
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

    // Check authorization: user must be either:
    // 1. The business owner, OR
    // 2. A super admin, OR  
    // 3. An admin with access to this business
    const isOwner = business[0].ownerId === user.id;
    const isSuperAdmin = userBusiness.role === 'super_admin';
    const isAdminWithAccess = userBusiness.role === 'admin' && userBusiness.businessId === businessId;

    if (!isOwner && !isSuperAdmin && !isAdminWithAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const newNotification = await db.insert(notifications).values({
      ...validatedData,
      businessId: businessId,
    }).returning();

    return NextResponse.json(newNotification[0], { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 400 }
    );
  }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, businessStaff } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getUserPermissions } from '@/lib/permission-helpers';

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
      return NextResponse.json({ 
        error: 'Not authenticated',
        authError: authError?.message 
      }, { status: 401 });
    }
    
    // Get user record from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found in database',
        userId: user.id 
      }, { status: 404 });
    }

    const userData = userRecord[0];
    const userBusinessId = userData.businessId;

    // Get staff record if exists
    let staffRecord = null;
    if (userBusinessId) {
      const staffRecords = await db
        .select()
        .from(businessStaff)
        .where(and(
          eq(businessStaff.userId, user.id),
          eq(businessStaff.businessId, userBusinessId),
          eq(businessStaff.isActive, true)
        ))
        .limit(1);
      
      staffRecord = staffRecords.length > 0 ? staffRecords[0] : null;
    }

    // Get permissions
    let permissions = null;
    if (userBusinessId) {
      try {
        permissions = await getUserPermissions(user.id, userBusinessId);
      } catch (error) {
        console.error('Error getting permissions:', error);
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: userData.role,
        businessId: userBusinessId,
        name: userData.name,
        createdAt: userData.createdAt
      },
      staffRecord: staffRecord ? {
        id: staffRecord.id,
        role: staffRecord.role,
        permissions: staffRecord.permissions,
        isActive: staffRecord.isActive,
        joinedAt: staffRecord.joinedAt
      } : null,
      permissions: permissions,
      debug: {
        hasBusinessId: !!userBusinessId,
        hasStaffRecord: !!staffRecord,
        canCreateQueues: permissions?.canCreateQueues || false,
        canEditQueues: permissions?.canEditQueues || false,
        canDeleteQueues: permissions?.canDeleteQueues || false
      }
    });

  } catch (error) {
    console.error('Debug user status error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get user status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

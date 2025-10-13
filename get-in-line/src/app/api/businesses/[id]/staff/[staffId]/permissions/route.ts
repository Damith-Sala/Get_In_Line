import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { businessStaff, businesses, users } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { StaffPermissions } from '@/lib/permission-helpers';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const businessId = params.id;
    const staffId = params.staffId;
    const body = await request.json();
    const { permissions, role } = body;
    
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

    // Check if user is business admin/owner
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userRecord[0];
    
    // Check if user is business owner or admin
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Only business owner or business admin can manage staff permissions
    const isOwner = business[0].ownerId === user.id;
    const isBusinessAdmin = currentUser.role === 'business_admin' && currentUser.businessId === businessId;
    const isSuperAdmin = currentUser.role === 'super_admin';
    
    if (!isOwner && !isBusinessAdmin && !isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Only business owners and admins can manage staff permissions' 
      }, { status: 403 });
    }

    // Validate permissions object
    if (!permissions || typeof permissions !== 'object') {
      return NextResponse.json({ error: 'Invalid permissions object' }, { status: 400 });
    }

    // Validate role
    if (!role || !['staff', 'manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update staff permissions
    const updatedStaff = await db
      .update(businessStaff)
      .set({
        permissions: JSON.stringify(permissions),
        role: role
      })
      .where(and(
        eq(businessStaff.id, staffId),
        eq(businessStaff.businessId, businessId)
      ))
      .returning();

    if (updatedStaff.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Also update the user's role in the users table
    await db
      .update(users)
      .set({ role: role })
      .where(eq(users.id, updatedStaff[0].userId));

    return NextResponse.json({
      message: 'Staff permissions updated successfully',
      staff: updatedStaff[0]
    });
  } catch (error) {
    console.error('Update staff permissions error:', error);
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const businessId = params.id;
    const staffId = params.staffId;
    
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

    // Check if user has access to this business
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentUser = userRecord[0];
    
    // Check if user is business owner or admin
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const isOwner = business[0].ownerId === user.id;
    const isBusinessAdmin = currentUser.role === 'business_admin' && currentUser.businessId === businessId;
    const isSuperAdmin = currentUser.role === 'super_admin';
    
    if (!isOwner && !isBusinessAdmin && !isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to view staff details' 
      }, { status: 403 });
    }

    // Get staff member details
    const staffRecord = await db
      .select({
        id: businessStaff.id,
        userId: businessStaff.userId,
        role: businessStaff.role,
        permissions: businessStaff.permissions,
        isActive: businessStaff.isActive,
        joinedAt: businessStaff.joinedAt,
        user: {
          name: users.name,
          email: users.email,
        }
      })
      .from(businessStaff)
      .innerJoin(users, eq(businessStaff.userId, users.id))
      .where(and(
        eq(businessStaff.id, staffId),
        eq(businessStaff.businessId, businessId)
      ))
      .limit(1);

    if (staffRecord.length === 0) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json(staffRecord[0]);
  } catch (error) {
    console.error('Get staff permissions error:', error);
    return NextResponse.json({ error: 'Failed to get staff permissions' }, { status: 500 });
  }
}

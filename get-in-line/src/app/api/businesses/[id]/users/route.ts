import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { businessStaff, businesses, users } from '@/lib/drizzle/schema';
import { eq, and, or } from 'drizzle-orm';
import { hasBusinessAccess } from '@/lib/auth-helpers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    
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

    // Check if user has permission to view users for this business
    const hasAccess = await hasBusinessAccess(user.id, businessId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get business details to find the owner
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const businessOwnerId = business[0].ownerId;

    // Get all users associated with this business
    // This includes: business owner, business admins, and staff members
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        businessId: users.businessId,
        isOwner: eq(users.id, businessOwnerId),
      })
      .from(users)
      .where(
        or(
          // Business owner
          eq(users.id, businessOwnerId),
          // Business admins (users with business_admin role and matching businessId)
          and(
            eq(users.role, 'business_admin'),
            eq(users.businessId, businessId)
          ),
          // Staff members (users with businessId matching this business)
          eq(users.businessId, businessId)
        )
      );

    // Get additional staff information from businessStaff table
    const staffDetails = await db
      .select({
        userId: businessStaff.userId,
        role: businessStaff.role,
        isActive: businessStaff.isActive,
      })
      .from(businessStaff)
      .where(eq(businessStaff.businessId, businessId));

    // Combine user data with staff details
    const usersWithDetails = allUsers.map(user => {
      const staffDetail = staffDetails.find(staff => staff.userId === user.id);
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.isOwner ? 'owner' : (staffDetail?.role || user.role),
        isOwner: user.isOwner,
        isActive: staffDetail?.isActive ?? true,
        displayRole: user.isOwner ? 'Owner' : (staffDetail?.role || user.role).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      };
    });

    // Sort users: Owner first, then by role, then by name
    const sortedUsers = usersWithDetails.sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(sortedUsers);
  } catch (error) {
    console.error('Error fetching business users:', error);
    return NextResponse.json({ error: 'Failed to fetch business users' }, { status: 500 });
  }
}

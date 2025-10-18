import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { branches, businesses, users } from '@/lib/drizzle/schema';
import { branchSchema } from '@/lib/validation';
import { eq, and } from 'drizzle-orm';
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

    // Check if user has permission to view branches for this business
    const hasAccess = await hasBusinessAccess(user.id, businessId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    const businessBranches = await db
      .select()
      .from(branches)
      .where(eq(branches.businessId, businessId));
    
    return NextResponse.json(businessBranches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const body = await request.json();
    const validatedData = branchSchema.parse(body);
    
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

    // Check if user has permission to manage this business
    const hasAccess = await hasBusinessAccess(user.id, businessId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    const business = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (business.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get user record to check role
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userBusiness = userRecord[0];

    // Check authorization: user must be either:
    // 1. The business owner, OR
    // 2. A super admin, OR  
    // 3. An admin with access to this business
    const isOwner = business[0].ownerId === user.id;
    const isSuperAdmin = userBusiness.role === 'super_admin';
    const isAdminWithAccess = userBusiness.role === 'business_admin' && userBusiness.businessId === businessId;

    if (!isOwner && !isSuperAdmin && !isAdminWithAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Map assignment field names to database field names
    const branchData = {
      name: validatedData.name,
      address: validatedData.location, // Map location -> address
      phone: validatedData.contact_number, // Map contact_number -> phone
      email: validatedData.email,
      managerId: validatedData.managerId,
      businessId: businessId,
    };

    const newBranch = await db.insert(branches).values(branchData).returning();

    return NextResponse.json(newBranch[0], { status: 201 });
  } catch (error) {
    console.error('Create branch error:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 400 }
    );
  }
}

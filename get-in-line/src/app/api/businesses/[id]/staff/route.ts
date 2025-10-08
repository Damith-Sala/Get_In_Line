import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { businessStaff, businesses, users } from '@/lib/drizzle/schema';
import { staffSchema } from '@/lib/validation';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    
    // Get all staff for this business with user details
    const staff = await db
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
      .where(eq(businessStaff.businessId, businessId));
    
    return NextResponse.json(staff);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const body = await request.json();
    const validatedData = staffSchema.parse(body);
    
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

    // Check if staff member already exists
    const existingStaff = await db
      .select()
      .from(businessStaff)
      .where(and(
        eq(businessStaff.businessId, businessId),
        eq(businessStaff.userId, validatedData.userId)
      ))
      .limit(1);

    if (existingStaff.length > 0) {
      return NextResponse.json({ error: 'Staff member already exists' }, { status: 400 });
    }

    // Update user's business association and role
    await db
      .update(users)
      .set({ 
        businessId: businessId,
        role: validatedData.role
      })
      .where(eq(users.id, validatedData.userId));
    
    const newStaff = await db.insert(businessStaff).values({
      ...validatedData,
      businessId: businessId,
    }).returning();

    return NextResponse.json(newStaff[0], { status: 201 });
  } catch (error) {
    console.error('Add staff error:', error);
    return NextResponse.json(
      { error: 'Failed to add staff member' },
      { status: 400 }
    );
  }
}

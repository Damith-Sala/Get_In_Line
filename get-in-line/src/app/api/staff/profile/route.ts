import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, businessStaff, businesses } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
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

    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userRecord[0];

    // Get staff record with business information
    const staffRecord = await db
      .select({
        id: businessStaff.id,
        role: businessStaff.role,
        permissions: businessStaff.permissions,
        isActive: businessStaff.isActive,
        joinedAt: businessStaff.joinedAt,
        business: {
          id: businesses.id,
          name: businesses.name,
          businessType: businesses.business_type,
          description: businesses.description,
        }
      })
      .from(businessStaff)
      .innerJoin(businesses, eq(businessStaff.businessId, businesses.id))
      .where(and(
        eq(businessStaff.userId, user.id),
        eq(businessStaff.isActive, true)
      ))
      .limit(1);

    if (staffRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Staff record not found' 
      }, { status: 404 });
    }

    const staff = staffRecord[0];
    
    // Parse permissions
    let permissions = {};
    try {
      permissions = staff.permissions ? JSON.parse(staff.permissions) : {};
    } catch (e) {
      console.error('Error parsing permissions:', e);
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        notificationPreferences: userData.notificationPreferences,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      },
      staff: {
        id: staff.id,
        role: staff.role,
        permissions,
        isActive: staff.isActive,
        joinedAt: staff.joinedAt,
        business: staff.business
      }
    });

  } catch (error) {
    console.error('Get staff profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff profile' },
      { status: 500 }
    );
  }
}

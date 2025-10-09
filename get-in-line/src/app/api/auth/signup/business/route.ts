import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { users, businesses, businessStaff } from '@/lib/drizzle/schema';
import { businessSignupSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = businessSignupSchema.parse(body);

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

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // Handle based on registration type
    if (validatedData.registrationType === 'owner') {
      // Business Owner Registration
      if (!validatedData.businessData) {
        return NextResponse.json(
          { error: 'Business data is required for business owners' },
          { status: 400 }
        );
      }

      // Create user in custom database FIRST (with temporary null businessId)
      await db.insert(users).values({
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        password: 'supabase_auth_user',
        role: 'admin',
        businessId: null,
      });

      // Create the business
      const newBusiness = await db.insert(businesses).values({
        ...validatedData.businessData,
        ownerId: authData.user.id,
      }).returning();

      // Update user with business ID
      await db.update(users)
        .set({ businessId: newBusiness[0].id })
        .where(eq(users.id, authData.user.id));

      return NextResponse.json({
        message: 'Business owner account created successfully',
        user: authData.user,
        business: newBusiness[0],
        session: authData.session,
        userType: 'owner',
      });

    } else if (validatedData.registrationType === 'staff') {
      // Staff Member Registration
      if (!validatedData.businessId) {
        return NextResponse.json(
          { error: 'Business ID is required for staff members' },
          { status: 400 }
        );
      }

      // Verify business exists
      const business = await db
        .select()
        .from(businesses)
        .where(eq(businesses.id, validatedData.businessId))
        .limit(1);

      if (business.length === 0) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }

      // Create user in custom database with staff role
      await db.insert(users).values({
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        password: 'supabase_auth_user',
        role: 'staff',
        businessId: validatedData.businessId,
      });

      // Add to business_staff table
      await db.insert(businessStaff).values({
        businessId: validatedData.businessId,
        userId: authData.user.id,
        role: 'staff',
        permissions: JSON.stringify({
          canManageQueues: true,
          canViewAnalytics: false,
          canManageStaff: false,
        }),
      });

      return NextResponse.json({
        message: 'Staff account created successfully',
        user: authData.user,
        business: business[0],
        session: authData.session,
        userType: 'staff',
      });
    }

    return NextResponse.json(
      { error: 'Invalid registration type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Business signup error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


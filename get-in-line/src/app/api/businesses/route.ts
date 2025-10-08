import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { businesses, users } from '@/lib/drizzle/schema';
import { businessSchema } from '@/lib/validation';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allBusinesses = await db.select().from(businesses);
    return NextResponse.json(allBusinesses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = businessSchema.parse(body);
    
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

    // Check if user already has a business
    const existingBusiness = await db
      .select()
      .from(businesses)
      .where(eq(businesses.ownerId, user.id))
      .limit(1);

    if (existingBusiness.length > 0) {
      return NextResponse.json({ 
        error: 'User already owns a business',
        business: existingBusiness[0]
      }, { status: 400 });
    }
    
    const newBusiness = await db.insert(businesses).values({
      ...validatedData,
      ownerId: user.id,
    }).returning();

    // Update user role to admin
    await db
      .update(users)
      .set({ role: 'admin', businessId: newBusiness[0].id })
      .where(eq(users.id, user.id));

    return NextResponse.json(newBusiness[0], { status: 201 });
  } catch (error) {
    console.error('Create business error:', error);
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 400 }
    );
  }
}

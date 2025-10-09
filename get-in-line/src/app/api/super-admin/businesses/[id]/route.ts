import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, businesses } from '@/lib/drizzle/schema';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id;
    const { action } = await request.json();

    // Verify super admin access
    const cookieStore = cookies();
    
    // Check for super admin session cookie first
    const superAdminSession = cookieStore.get('super-admin-session');
    
    if (!superAdminSession) {
      return NextResponse.json({ error: 'Super admin session required' }, { status: 401 });
    }

    try {
      const sessionData = JSON.parse(superAdminSession.value);
      if (!sessionData.user || sessionData.user.role !== 'super_admin') {
        return NextResponse.json({ error: 'Invalid super admin session' }, { status: 401 });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid session format' }, { status: 401 });
    }

    // Get target business
    const targetBusiness = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (targetBusiness.length === 0) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Perform action
    switch (action) {
      case 'activate':
        await db
          .update(businesses)
          .set({ isActive: true })
          .where(eq(businesses.id, businessId));
        break;

      case 'deactivate':
        await db
          .update(businesses)
          .set({ isActive: false })
          .where(eq(businesses.id, businessId));
        break;

      case 'delete':
        await db
          .delete(businesses)
          .where(eq(businesses.id, businessId));
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `Business ${action} successful` });

  } catch (error) {
    console.error('Super admin business action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform business action' },
      { status: 500 }
    );
  }
}

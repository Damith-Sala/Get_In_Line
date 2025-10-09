import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/drizzle/schema';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
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

    // Get target user
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent super admin from modifying other super admins
    if (targetUser[0].role === 'super_admin') {
      return NextResponse.json({ error: 'Cannot modify super admin users' }, { status: 403 });
    }

    // Perform action
    switch (action) {
      case 'suspend':
        // In a real system, you'd have a suspended field or similar
        await db
          .update(users)
          .set({ role: 'suspended' })
          .where(eq(users.id, userId));
        break;

      case 'delete':
        await db
          .delete(users)
          .where(eq(users.id, userId));
        break;

      case 'promote':
        await db
          .update(users)
          .set({ role: 'admin' })
          .where(eq(users.id, userId));
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ message: `User ${action} successful` });

  } catch (error) {
    console.error('Super admin user action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform user action' },
      { status: 500 }
    );
  }
}

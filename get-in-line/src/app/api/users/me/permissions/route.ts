import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserBusinessId } from '@/lib/auth-helpers';
import { getUserPermissions } from '@/lib/permission-helpers';

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

    // Get user's business ID
    const businessId = await getUserBusinessId(user.id);
    
    if (!businessId) {
      return NextResponse.json({ 
        error: 'No business associated with your account' 
      }, { status: 403 });
    }

    // Get user's permissions
    const permissions = await getUserPermissions(user.id, businessId);

    return NextResponse.json({
      permissions,
      businessId,
      userId: user.id
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear the super admin session cookie on server side
    cookieStore.set('super-admin-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      expires: new Date(0) // Set to epoch time
    });

    return NextResponse.json({ message: 'Super admin logged out successfully' });
  } catch (error) {
    console.error('Super admin logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

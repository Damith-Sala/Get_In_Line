import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Check if session exists and is not expired
  const isSessionValid = session && session.expires_at && session.expires_at > Date.now() / 1000

  // Check for super admin session
  const superAdminSession = request.cookies.get('super-admin-session');
  const hasSuperAdminSession = superAdminSession && superAdminSession.value;

  // If user is not signed in or session is expired and trying to access protected routes, redirect to /login
  if (!isSessionValid && !request.nextUrl.pathname.startsWith('/login') && !request.nextUrl.pathname.startsWith('/signup') && !request.nextUrl.pathname.startsWith('/super-admin/login') && !(request.nextUrl.pathname.startsWith('/super-admin') && hasSuperAdminSession) && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Note: Removed hardcoded dashboard redirect to allow LoginForm to handle role-based routing
  // The LoginForm component now handles proper redirection based on user roles

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/business-admin/:path*', '/staff-dashboard/:path*', '/super-admin/:path*', '/login', '/signup']
}
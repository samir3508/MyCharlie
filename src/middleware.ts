import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware entirely for API routes and public pages (signature, public devis, password reset)
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/sign') || 
      pathname.startsWith('/devis-public') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/auth/reset-password')) {
    console.log('[MIDDLEWARE] Skipping public route:', pathname)
    return NextResponse.next()
  }
  
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match only these specific routes that need auth:
     * NOTE: /sign/* and /api/* are PUBLIC (not in this list)
     */
    '/dashboard/:path*',
    '/clients/:path*',
    '/devis/:path*',
    '/factures/:path*',
    '/relances/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
}

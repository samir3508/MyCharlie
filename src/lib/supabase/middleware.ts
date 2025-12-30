import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isApi = pathname.startsWith('/api')
  console.log('[DEBUG] Middleware called:', {pathname, isApi, timestamp: Date.now()})
  
  // CRITICAL: Skip middleware for ALL API routes immediately
  if (isApi) {
    console.log('[DEBUG] API route detected - returning immediately without auth check')
    return NextResponse.next({ request })
  }
  
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    // Vérifier les variables d'environnement
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ [Middleware] Missing Supabase environment variables')
      return supabaseResponse
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Refresh session if exists (ne pas bloquer si erreur)
    let user = null
    try {
      const { data: { user: userData } } = await supabase.auth.getUser()
      user = userData
    } catch (error) {
      console.warn('⚠️ [Middleware] Error getting user:', error)
      // Continue sans user si erreur
    }

    // This check is redundant now (already done at the top), but keeping for safety
    if (pathname.startsWith('/api')) {
      console.log('[DEBUG] API route detected in try block - returning:', pathname)
      return NextResponse.next({ request })
    }

    // Protected routes
    const protectedRoutes = ['/dashboard', '/clients', '/devis', '/factures', '/relances', '/settings']
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Auth routes (redirect to dashboard if logged in)
    const authRoutes = ['/login', '/register']
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('❌ [Middleware] Error in updateSession:', error)
    // En cas d'erreur, retourner une réponse normale pour ne pas bloquer
    return NextResponse.next({
      request,
    })
  }
}

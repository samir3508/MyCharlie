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
    const protectedRoutes = ['/dashboard', '/clients', '/devis', '/factures', '/relances', '/settings', '/fiches-visite', '/dossiers', '/rdv']
    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    
    // Log détaillé pour fiches-visite
    if (pathname.startsWith('/fiches-visite')) {
      console.log('[MIDDLEWARE] FICHES-VISITE PROTECTION CHECK:', {
        pathname,
        isProtectedRoute,
        hasUser: !!user,
        userId: user?.id,
        protectedRoutes,
        timestamp: new Date().toISOString()
      })
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:88',message:'Route protection check',data:{pathname,isProtectedRoute,hasUser:!!user,matchesFichesVisite:pathname.startsWith('/fiches-visite')},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    // Auth routes (redirect to dashboard if logged in)
    const authRoutes = ['/login', '/register']
    const isAuthRoute = authRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    if (isProtectedRoute && !user) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:96',message:'Redirecting to login',data:{pathname,isProtectedRoute,hasUser:!!user,isFichesVisite:pathname.startsWith('/fiches-visite')},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B,E'})}).catch(()=>{});
      // #endregion
      
      // Log spécifique pour fiches-visite
      if (pathname.startsWith('/fiches-visite')) {
        console.log('[MIDDLEWARE] FICHES-VISITE - REDIRECTING TO LOGIN:', {
          pathname,
          isProtectedRoute,
          hasUser: !!user,
          timestamp: new Date().toISOString()
        })
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:103',message:'FICHES-VISITE - Redirecting to login',data:{pathname,isProtectedRoute,hasUser:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }
      
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:108',message:'Returning NextResponse',data:{pathname,hasUser:!!user,isProtectedRoute,isFichesVisite:pathname.startsWith('/fiches-visite')},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'B,E'})}).catch(()=>{});
    // #endregion
    
    // Log spécifique pour fiches-visite avant retour
    if (pathname.startsWith('/fiches-visite')) {
      console.log('[MIDDLEWARE] FICHES-VISITE - Returning NextResponse:', {
        pathname,
        hasUser: !!user,
        isProtectedRoute,
        responseStatus: supabaseResponse.status,
        timestamp: new Date().toISOString()
      })
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:115',message:'FICHES-VISITE - About to return NextResponse',data:{pathname,hasUser:!!user,isProtectedRoute,responseStatus:supabaseResponse.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    }
    
    return supabaseResponse
  } catch (error) {
    console.error('❌ [Middleware] Error in updateSession:', error)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:111',message:'Middleware error',data:{pathname,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // En cas d'erreur, retourner une réponse normale pour ne pas bloquer
    return NextResponse.next({
      request,
    })
  }
}

import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:4',message:'PROXY entry - MATCHER WORKED',data:{pathname,matchesFichesVisite:pathname.startsWith('/fiches-visite'),url:request.url,method:request.method},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  // Log détaillé pour fiches-visite
  if (pathname.startsWith('/fiches-visite')) {
    console.log('[PROXY] FICHES-VISITE ROUTE DETECTED:', {
      pathname,
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString()
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:12',message:'FICHES-VISITE pathname detected',data:{pathname,url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  }
  
  // Skip proxy entirely for API routes and public pages (signature, public devis, password reset, RGPD)
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/sign') || 
      pathname.startsWith('/devis-public') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/auth/reset-password') ||
      pathname === '/supprimer-donnees' ||
      pathname.startsWith('/politique-confidentialite') ||
      pathname.startsWith('/mentions-legales') ||
      pathname.startsWith('/cgv') ||
      pathname.startsWith('/conditions-utilisation')) {
    console.log('[PROXY] Skipping public route:', pathname)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:14',message:'Skipping public route',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return NextResponse.next()
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/7bbffab8-4f6e-4eb2-bd56-111314e8f2b0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'proxy.ts:17',message:'Calling updateSession',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run4',hypothesisId:'A,B'})}).catch(()=>{});
  // #endregion
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all routes except static files and API routes
     * Next.js 16 uses path-to-regexp syntax
     * Using :path* syntax (documented as working in Next.js 16)
     * Also adding explicit /fiches-visite patterns to ensure matching
     */
    '/dashboard/:path*',
    '/clients/:path*',
    '/devis/:path*',
    '/factures/:path*',
    '/relances/:path*',
    '/settings/:path*',
    '/fiches-visite/:path*',
    '/fiches-visite',
    '/dossiers/:path*',
    '/rdv/:path*',
    '/login',
    '/register',
    /*
     * Catch-all pattern to ensure we don't miss any routes
     * This will match everything except static files and API routes
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

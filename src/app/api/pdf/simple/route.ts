import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('[SIMPLE ROUTE] GET called at', new Date().toISOString())
  
  const response = NextResponse.json({ 
    message: 'TEST OK', 
    timestamp: new Date().toISOString(),
    path: '/api/pdf/simple'
  })
  
  console.log('[SIMPLE ROUTE] Returning response')
  return response
}


import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'PDF API is working',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

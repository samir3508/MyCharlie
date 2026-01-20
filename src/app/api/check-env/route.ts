import { NextResponse } from 'next/server'

export async function GET() {
  // Ne pas exposer les secrets, seulement les variables publiques
  return NextResponse.json({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
    origin: process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr',
    message: 'Vérifiez que NEXT_PUBLIC_APP_URL est bien défini à https://mycharlie.fr'
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenant_id')

    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id requis' }, { status: 400 })
    }

    // Utiliser le client serveur qui a les cookies de l'utilisateur
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur chargement connexions OAuth:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: 'Erreur lors du chargement',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    return NextResponse.json({ 
      connections: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('Erreur API connexions OAuth:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

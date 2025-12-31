import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const devisId = searchParams.get('devisId')
    
    console.log('Debug devis - devisId:', devisId)
    console.log('Variables Supabase:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MANQUANTE',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MANQUANTE'
    })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    if (!devisId) {
      return NextResponse.json({ error: 'devisId requis' }, { status: 400 })
    }

    // Test de connexion simple
    const { data: testData, error: testError } = await supabase
      .from('devis')
      .select('id, numero')
      .limit(1)

    if (testError) {
      console.error('Erreur connexion devis:', testError)
      return NextResponse.json({ 
        error: 'Erreur connexion Supabase', 
        details: testError.message 
      }, { status: 500 })
    }

    console.log('Connexion Supabase OK:', testData)

    // Test de récupération du devis avec lignes
    const { data, error } = await supabase
      .from('devis')
      .select(`
        *,
        clients (id, nom_complet, email, telephone, adresse_facturation),
        lignes_devis (*)
      `)
      .eq('id', devisId)
      .single()

    if (error) {
      console.error('Erreur récupération devis:', error)
      return NextResponse.json({ 
        error: 'Erreur récupération devis', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('Devis récupéré:', data)
    console.log('Nombre de lignes:', data?.lignes_devis?.length || 0)

    return NextResponse.json({ 
      success: true, 
      message: 'Devis récupéré avec succès',
      devis: data,
      lignesCount: data?.lignes_devis?.length || 0
    })

  } catch (error: any) {
    console.error('Erreur générale:', error)
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error.message 
    }, { status: 500 })
  }
}

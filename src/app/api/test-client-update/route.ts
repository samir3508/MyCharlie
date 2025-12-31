import { NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { clientId, updates } = await request.json()
    
    console.log('Test modification client:', { clientId, updates })
    console.log('Variables Supabase:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MANQUANTE',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MANQUANTE'
    })

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test de connexion Supabase
    const { data: testData, error: testError } = await supabase
      .from('clients')
      .select('id, nom')
      .limit(1)

    if (testError) {
      console.error('Erreur connexion Supabase:', testError)
      return NextResponse.json({ 
        error: 'Erreur connexion Supabase', 
        details: testError.message 
      }, { status: 500 })
    }

    console.log('Connexion Supabase OK:', testData)

    // Test de modification
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single()

    if (error) {
      console.error('Erreur modification client:', error)
      return NextResponse.json({ 
        error: 'Erreur modification client', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('Client modifié avec succès:', data)
    return NextResponse.json({ 
      success: true, 
      message: 'Client modifié avec succès',
      data 
    })

  } catch (error: any) {
    console.error('Erreur générale:', error)
    return NextResponse.json({ 
      error: 'Erreur générale', 
      details: error.message 
    }, { status: 500 })
  }
}

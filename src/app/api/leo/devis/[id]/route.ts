import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Récupérer le devis avec conversion d'URL
    const { data: devis, error } = await supabase
      .from('devis')
      .select(`
        *,
        clients (*),
        template_condition_paiement (*),
        lignes_devis (*)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération du devis', details: error.message },
        { status: 500 }
      )
    }

    if (!devis) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    // Convertir les URLs localhost vers production
    const productionUrl = 'https://mycharlie.fr'
    const localhostUrl = 'http://localhost:3000'

    // Fonction pour convertir les URLs dans l'objet
    function convertUrls(obj: any): any {
      if (typeof obj === 'string') {
        return obj.replace(localhostUrl, productionUrl)
      } else if (Array.isArray(obj)) {
        return obj.map(item => convertUrls(item))
      } else if (obj && typeof obj === 'object') {
        const converted: any = {}
        for (const [key, value] of Object.entries(obj)) {
          converted[key] = convertUrls(value)
        }
        return converted
      }
      return obj
    }

    const devisConverted = convertUrls(devis)

    return NextResponse.json({
      success: true,
      message: 'Devis récupéré avec succès',
      data: { devis: devisConverted }
    })

  } catch (error: any) {
    console.error('Erreur récupération devis:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

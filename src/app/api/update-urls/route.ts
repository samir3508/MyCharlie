import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const productionUrl = 'https://mycharlie.onrender.com'
    const localhostUrl = 'http://localhost:3000'

    console.log('Mise à jour des URLs de localhost vers production...')

    // Mettre à jour les PDF URLs dans les devis
    const { data: devisUpdated, error: devisError } = await supabase
      .from('devis')
      .update({ 
        pdf_url: supabase.rpc('replace_url', { old_url: localhostUrl, new_url: productionUrl })
      })
      .like('pdf_url', `${localhostUrl}%`)

    if (devisError) {
      console.error('Erreur mise à jour devis:', devisError)
    } else {
      console.log('Devis mis à jour:', devisUpdated)
    }

    // Mettre à jour les PDF URLs dans les factures
    const { data: facturesUpdated, error: facturesError } = await supabase
      .from('factures')
      .update({ 
        pdf_url: supabase.rpc('replace_url', { old_url: localhostUrl, new_url: productionUrl })
      })
      .like('pdf_url', `${localhostUrl}%`)

    if (facturesError) {
      console.error('Erreur mise à jour factures:', facturesError)
    } else {
      console.log('Factures mis à jour:', facturesUpdated)
    }

    // Mettre à jour les N8N webhook URLs si nécessaire
    const { data: webhooksUpdated, error: webhooksError } = await supabase
      .from('tenants')
      .update({ 
        n8n_webhook_url: supabase.rpc('replace_url', { old_url: localhostUrl, new_url: productionUrl })
      })
      .like('n8n_webhook_url', `${localhostUrl}%`)

    if (webhooksError) {
      console.error('Erreur mise à jour webhooks:', webhooksError)
    } else {
      console.log('Webhooks mis à jour:', webhooksUpdated)
    }

    return NextResponse.json({
      success: true,
      message: 'URLs mises à jour avec succès',
      devisUpdated: devisUpdated ? 'OK' : 'N/A',
      facturesUpdated: facturesUpdated ? 'OK' : 'N/A',
      webhooksUpdated: webhooksUpdated ? 'OK' : 'N/A'
    })

  } catch (error: any) {
    console.error('Erreur générale:', error)
    return NextResponse.json({
      error: 'Erreur lors de la mise à jour des URLs',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Route pour mettre à jour les URLs de localhost vers production',
    usage: 'POST /api/update-urls'
  })
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const productionUrl = 'https://mycharlie.fr'
    const localhostUrl = 'http://localhost:3000'
    const oldRenderUrl = 'https://mycharlie.onrender.com'

    console.log('Mise à jour des URLs de localhost et onrender.com vers production...')

    // Mettre à jour les PDF URLs dans les devis (localhost et onrender.com)
    const { data: devisUpdated1, error: devisError1 } = await supabase
      .from('devis')
      .update({ 
        pdf_url: supabase.rpc('replace_url', { old_url: localhostUrl, new_url: productionUrl })
      })
      .like('pdf_url', `${localhostUrl}%`)
    
    const { data: devisUpdated2, error: devisError2 } = await supabase
      .from('devis')
      .update({ 
        pdf_url: supabase.rpc('replace_url', { old_url: oldRenderUrl, new_url: productionUrl })
      })
      .like('pdf_url', `${oldRenderUrl}%`)
    
    const devisError = devisError1 || devisError2
    const devisUpdated = devisUpdated1 || devisUpdated2

    if (devisError) {
      console.error('Erreur mise à jour devis:', devisError)
    } else {
      console.log('Devis mis à jour:', devisUpdated)
    }

    // Mettre à jour les PDF URLs dans les factures (localhost et onrender.com)
    const { data: facturesUpdated1, error: facturesError1 } = await supabase
      .from('factures')
      .update({ 
        pdf_url: supabase.rpc('replace_url', { old_url: localhostUrl, new_url: productionUrl })
      })
      .like('pdf_url', `${localhostUrl}%`)
    
    const { data: facturesUpdated2, error: facturesError2 } = await supabase
      .from('factures')
      .update({ 
        pdf_url: supabase.rpc('replace_url', { old_url: oldRenderUrl, new_url: productionUrl })
      })
      .like('pdf_url', `${oldRenderUrl}%`)
    
    const facturesError = facturesError1 || facturesError2
    const facturesUpdated = facturesUpdated1 || facturesUpdated2

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

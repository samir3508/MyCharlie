import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const productionUrl = 'https://mycharlie.fr'
    const localhostUrl = 'http://localhost:3000'
    const oldRenderUrl = 'https://mycharlie.onrender.com'

    console.log('🔧 Correction des URLs N8N et PDF...')

    // Utiliser SQL direct pour plus de fiabilité
    const sqlQueries = [
      // Devis - localhost
      `UPDATE devis SET pdf_url = REPLACE(pdf_url, '${localhostUrl}', '${productionUrl}') WHERE pdf_url LIKE '${localhostUrl}%'`,
      // Devis - onrender.com
      `UPDATE devis SET pdf_url = REPLACE(REPLACE(pdf_url, 'https://mycharlie.onrender.com', '${productionUrl}'), 'http://mycharlie.onrender.com', '${productionUrl}') WHERE pdf_url LIKE '%mycharlie.onrender.com%'`,
      // Factures - localhost
      `UPDATE factures SET pdf_url = REPLACE(pdf_url, '${localhostUrl}', '${productionUrl}') WHERE pdf_url LIKE '${localhostUrl}%'`,
      // Factures - onrender.com
      `UPDATE factures SET pdf_url = REPLACE(REPLACE(pdf_url, 'https://mycharlie.onrender.com', '${productionUrl}'), 'http://mycharlie.onrender.com', '${productionUrl}') WHERE pdf_url LIKE '%mycharlie.onrender.com%'`,
      // Tenants webhook - localhost
      `UPDATE tenants SET n8n_webhook_url = REPLACE(n8n_webhook_url, '${localhostUrl}', '${productionUrl}') WHERE n8n_webhook_url LIKE '${localhostUrl}%'`,
      // Tenants webhook - onrender.com
      `UPDATE tenants SET n8n_webhook_url = REPLACE(REPLACE(n8n_webhook_url, 'https://mycharlie.onrender.com', '${productionUrl}'), 'http://mycharlie.onrender.com', '${productionUrl}') WHERE n8n_webhook_url LIKE '%mycharlie.onrender.com%'`,
      // Tenants logo - localhost
      `UPDATE tenants SET logo_url = REPLACE(logo_url, '${localhostUrl}', '${productionUrl}') WHERE logo_url LIKE '${localhostUrl}%'`,
      // Tenants logo - onrender.com
      `UPDATE tenants SET logo_url = REPLACE(REPLACE(logo_url, 'https://mycharlie.onrender.com', '${productionUrl}'), 'http://mycharlie.onrender.com', '${productionUrl}') WHERE logo_url LIKE '%mycharlie.onrender.com%'`
    ]

    const results = []

    for (const sql of sqlQueries) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql })
        results.push({ sql: sql.split(' ')[0] + ' ' + sql.split(' ')[1], status: error ? 'ERROR' : 'OK', error })
      } catch (err: any) {
        results.push({ sql: sql.split(' ')[0] + ' ' + sql.split(' ')[1], status: 'ERROR', error: err.message })
      }
    }

    // Vérification des résultats
    const { data: devisCheck } = await supabase
      .from('devis')
      .select('pdf_url')
      .like('pdf_url', `${localhostUrl}%`)
      .limit(1)

    const { data: facturesCheck } = await supabase
      .from('factures')
      .select('pdf_url')
      .like('pdf_url', `${localhostUrl}%`)
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'URLs N8N corrigées avec succès',
      results,
      verification: {
        remainingDevisUrls: (devisCheck || []).length,
        remainingFactureUrls: (facturesCheck || []).length
      },
      productionUrl,
      localhostUrl
    })

  } catch (error: any) {
    console.error('Erreur correction URLs N8N:', error)
    return NextResponse.json({
      error: 'Erreur lors de la correction des URLs N8N',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Route pour corriger les URLs N8N de localhost vers production',
    usage: 'POST /api/fix-n8n-urls',
    note: 'Corrige toutes les URLs localhost dans la base de données'
  })
}

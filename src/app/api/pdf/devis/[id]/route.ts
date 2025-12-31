import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDevisPDF, type DevisPDFData } from '@/lib/pdf/generate-pdf'
import { appendFile } from 'fs/promises'

// Force dynamic rendering (pas de cache)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const LOG_FILE = '/Users/adam/Appli BB LEO/.cursor/debug.log'

async function logDebug(data: any) {
  try {
    const logLine = JSON.stringify({...data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1'}) + '\n'
    await appendFile(LOG_FILE, logLine, 'utf-8')
  } catch (err) {
    console.error('Debug log failed:', err)
  }
}

// Utiliser SERVICE_ROLE_KEY pour accès public (bypass RLS)
// Sécurisé car l'UUID du devis est déjà un secret unique
function getSupabasePublic() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
    throw new Error('Supabase credentials not configured')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('[PDF ROUTE] GET called for:', request.nextUrl.pathname)
  await logDebug({location:'devis/[id]/route.ts:41',message:'PDF route GET called',data:{url:request.url,pathname:request.nextUrl.pathname},hypothesisId:'C'})
  try {
    const { id } = await params
    await logDebug({location:'devis/[id]/route.ts:44',message:'Params extracted',data:{id,hasId:!!id,idType:typeof id},hypothesisId:'C'})
    
    // Validation basique
    if (!id || typeof id !== 'string') {
      await logDebug({location:'devis/[id]/route.ts:49',message:'Invalid ID',data:{id},hypothesisId:'C'})
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }
    
    await logDebug({location:'devis/[id]/route.ts:53',message:'Getting Supabase client',data:{hasUrl:!!process.env.NEXT_PUBLIC_SUPABASE_URL,hasServiceKey:!!process.env.SUPABASE_SERVICE_ROLE_KEY,hasAnonKey:!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY},hypothesisId:'D'})
    const supabase = getSupabasePublic()

    // Fetch devis with all relations
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select(`
        *,
        client:clients(*),
        lignes:lignes_devis(*),
        template:templates_conditions_paiement(*)
      `)
      .eq('id', id)
      .single()

    if (devisError) {
      await logDebug({location:'devis/[id]/route.ts:59',message:'Devis query error',data:{error:devisError.message,code:devisError.code},hypothesisId:'C'})
      console.error('Devis query error:', devisError)
      return NextResponse.json({ error: 'Devis non trouvé', details: devisError.message }, { status: 404 })
    }

    if (!devis) {
      await logDebug({location:'devis/[id]/route.ts:64',message:'Devis not found',data:{id},hypothesisId:'C'})
      console.error('Devis not found:', id)
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    await logDebug({location:'devis/[id]/route.ts:69',message:'Devis found',data:{numero:devis.numero,clientId:devis.client_id,hasLignes:!!devis.lignes,lignesCount:devis.lignes?.length||0},hypothesisId:'C'})
    console.log('Devis found:', devis.numero, 'Client:', devis.client_id)

    // Fetch tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', devis.tenant_id)
      .single()

    // Calculate validity date (30 days from creation by default)
    const dateCreation = new Date(devis.date_creation || devis.created_at)
    const dateValidite = new Date(dateCreation)
    dateValidite.setDate(dateValidite.getDate() + 30)

    // Construire les conditions de paiement détaillées
    const conditionsPaiement = devis.template ? 
      `${devis.template.nom}${devis.template.description ? ` - ${devis.template.description}` : ''}` : 
      (devis.conditions_paiement || '')

    // Prepare PDF data
    const pdfData: DevisPDFData = {
      entreprise: {
        nom: tenant?.company_name || 'MY LÉO',
        adresse: tenant?.address || '',
        cp: '',
        ville: '',
        telephone: tenant?.phone || '',
        email: tenant?.email || '',
        siret: tenant?.siret || '',
        forme_juridique: 'SAS',
        tva_intra: tenant?.tva_intra || '',
      },
      numero: devis.numero,
      date_creation: devis.date_creation || devis.created_at,
      date_validite: devis.date_expiration || dateValidite.toISOString().split('T')[0],
      titre: devis.titre || devis.objet || '',
      client: {
        nom: devis.client?.nom_complet || 'Client',
        adresse: devis.client?.adresse_facturation || '',
        cp: '',
        ville: '',
        telephone: devis.client?.telephone || '',
        email: devis.client?.email || '',
      },
      adresse_chantier: devis.adresse_chantier || devis.client?.adresse_chantier || '',
      lignes: (devis.lignes || []).map((ligne: any) => ({
        designation: ligne.designation,
        description_detaillee: ligne.description_detaillee,
        quantite: ligne.quantite,
        unite: ligne.unite || 'u',
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        tva_pct: ligne.tva_pct || 20,
        total_ht: ligne.total_ht || ligne.quantite * ligne.prix_unitaire_ht,
        total_ttc: ligne.total_ttc || ligne.quantite * ligne.prix_unitaire_ht * (1 + (ligne.tva_pct || 20) / 100),
      })),
      montant_ht: devis.montant_ht || 0,
      montant_tva: devis.montant_tva || 0,
      montant_ttc: devis.montant_ttc || 0,
      conditions_paiement: (() => {
        if (devis.template) {
          return devis.template.description 
            ? `${devis.template.nom} - ${devis.template.description}`
            : devis.template.nom
        }
        return devis.conditions_paiement || ''
      })(),
      delai_execution: devis.delai_execution || '',
      notes: devis.notes || '',
      // URL de signature électronique (si le devis n'est pas encore signé)
      signature_url: devis.signature_token && !devis.signature_client
        ? (() => {
            const host = request.headers.get('host') || 'mycharlie.onrender.com'
            const protocol = 'https'
            return `${protocol}://${host}/sign/${devis.signature_token}`
          })()
        : undefined,
      // Données de signature (si le devis est signé)
      signature: devis.signature_client ? {
        image: devis.signature_client,
        nom: devis.signature_nom || '',
        email: devis.signature_email || '',
        date: devis.signature_date || '',
      } : undefined,
    }

    // Debug: Vérifier les données de signature
    console.log('=== SIGNATURE DEBUG ===')
    console.log('devis.signature_client:', !!devis.signature_client)
    console.log('devis.signature_nom:', devis.signature_nom)
    console.log('devis.signature_email:', devis.signature_email)
    console.log('devis.signature_date:', devis.signature_date)
    console.log('pdfData.signature:', pdfData.signature)
    console.log('=====================')

    // Generate PDF
    await logDebug({location:'devis/[id]/route.ts:141',message:'Starting PDF generation',data:{numero:devis.numero,lignesCount:pdfData.lignes?.length||0},hypothesisId:'E'})
    console.log('Generating PDF for devis:', devis.numero)
    const pdfBuffer = await generateDevisPDF(pdfData)
    await logDebug({location:'devis/[id]/route.ts:144',message:'PDF generated successfully',data:{bufferSize:pdfBuffer.length,bufferType:pdfBuffer.constructor.name},hypothesisId:'E'})
    console.log('PDF generated successfully, size:', pdfBuffer.length)

    // Return PDF with public access headers
    await logDebug({location:'devis/[id]/route.ts:148',message:'Returning PDF response',data:{status:200,contentType:'application/pdf'},hypothesisId:'E'})
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${devis.numero}.pdf"`,
        'Cache-Control': 'public, max-age=3600', // Cache 1 hour
      },
    })
  } catch (error) {
    console.error('[PDF ROUTE] === ERROR generating devis PDF ===')
    console.error('[PDF ROUTE] Error:', error)
    console.error('[PDF ROUTE] Error message:', error instanceof Error ? error.message : 'Unknown')
    console.error('[PDF ROUTE] Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('[PDF ROUTE] ================================')
    
    await logDebug({location:'devis/[id]/route.ts:163',message:'ERROR in PDF route',data:{error:error instanceof Error ? error.message : String(error),errorType:error instanceof Error ? error.constructor.name : typeof error,stack:error instanceof Error ? error.stack?.substring(0,500) : 'no stack'},hypothesisId:'E'})
    
    // Retourner une réponse JSON avec les détails de l'erreur pour debug
    return NextResponse.json({ 
      error: 'Erreur lors de la génération du PDF',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Route publique pour que les clients puissent voir le devis via l'ID (sans authentification)
// Utilise SERVICE_ROLE_KEY pour bypass RLS
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
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
  console.log('[PUBLIC DEVIS API] GET called')
  try {
    const { id } = await params
    console.log('[PUBLIC DEVIS API] ID received:', id)
    
    if (!id) {
      console.log('[PUBLIC DEVIS API] ERROR: ID manquant')
      return NextResponse.json(
        { error: 'ID manquant' },
        { status: 400 }
      )
    }
    
    console.log('[PUBLIC DEVIS API] Creating Supabase client...')
    const supabase = getServiceSupabase()
    console.log('[PUBLIC DEVIS API] Supabase client created')
    
    // Récupérer le devis avec toutes les relations
    console.log('[PUBLIC DEVIS API] Querying devis with ID:', id)
    const { data: devis, error } = await supabase
      .from('devis')
      .select(`
        id,
        numero,
        date_creation,
        date_expiration,
        montant_ht,
        montant_tva,
        montant_ttc,
        statut,
        titre,
        description,
        objet,
        adresse_chantier,
        delai_execution,
        conditions_paiement,
        notes,
        signature_token,
        signature_client,
        signature_nom,
        signature_email,
        signature_date,
        pdf_url,
        client:clients(
          id,
          nom_complet,
          email,
          telephone,
          adresse_facturation
        ),
        tenant:tenants(
          id,
          company_name,
          address,
          phone,
          email,
          siret,
          tva_intra
        ),
        lignes:lignes_devis(
          id,
          ordre,
          designation,
          description_detaillee,
          quantite,
          unite,
          prix_unitaire_ht,
          tva_pct,
          total_ht,
          total_ttc
        )
      `)
      .eq('id', id)
      .maybeSingle()
    
    console.log('[PUBLIC DEVIS API] Query result:', { 
      hasError: !!error, 
      errorMessage: error?.message,
      hasData: !!devis,
      devisNumero: devis?.numero 
    })
    
    if (error) {
      console.error('[PUBLIC DEVIS API] Database error:', error)
      return NextResponse.json(
        { error: 'Erreur base de données', details: error.message },
        { status: 500 }
      )
    }
    
    if (!devis) {
      console.log('[PUBLIC DEVIS API] Devis not found for ID:', id)
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }
    
    console.log('[PUBLIC DEVIS API] Devis found:', devis.numero)
    
    // Convertir les URLs localhost vers production
    const productionUrl = 'https://mycharlie.onrender.com'
    const localhostUrl = 'http://localhost:3000'
    
    // Créer un nouvel objet avec les modifications nécessaires
    const devisResponse: any = {
      ...devis,
    }
    
    if (devisResponse.pdf_url && devisResponse.pdf_url.includes(localhostUrl)) {
      devisResponse.pdf_url = devisResponse.pdf_url.replace(localhostUrl, productionUrl)
    }
    
    // Ajouter l'URL de signature si le token existe
    if (devisResponse.signature_token && !devisResponse.signature_client) {
      const host = request.headers.get('host') || 'mycharlie.onrender.com'
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      devisResponse.signature_url = `${protocol}://${host}/sign/${devisResponse.signature_token}`
    }
    
    return NextResponse.json({
      success: true,
      data: devisResponse
    })
  } catch (error) {
    console.error('Error fetching public devis:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

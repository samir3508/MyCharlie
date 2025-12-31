import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Créer un client Supabase avec la service role key pour contourner RLS
function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('=== DEBUG CONFIGURATION ===')
  console.log('NODE_ENV:', process.env.NODE_ENV)
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'PRESENT' : 'MISSING')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING')
  console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON')
  console.log('==========================')
  
  if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
    throw new Error('Missing Supabase URL configuration')
  }
  
  if (!serviceRoleKey) {
    console.error('Missing both SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    throw new Error('Missing Supabase key configuration')
  }
  
  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('Supabase client created successfully')
    return client
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw new Error('Failed to create Supabase client')
  }
}

// GET - Récupérer les infos du devis pour la signature
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  console.log('=== SIGNATURE API GET START ===')
  
  try {
    const { token } = await params
    console.log('Token received:', token)
    
    if (!token) {
      console.log('ERROR: No token provided')
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      )
    }
    
    const supabase = getServiceSupabase()
    console.log('Supabase client created successfully')

    // Récupérer le devis par son token de signature
    const { data: devis, error } = await supabase
      .from('devis')
      .select(`
        id,
        numero,
        date_creation,
        date_expiration,
        montant_ht,
        montant_ttc,
        statut,
        titre,
        signature_client,
        signature_nom,
        signature_email,
        signature_date,
        client:clients(
          nom_complet,
          email
        ),
        tenant:tenants(
          company_name
        ),
        lignes:lignes_devis(
          id,
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
      .eq('signature_token', token)
      .single()

    console.log('Query result - error:', error)
    console.log('Query result - devis:', devis ? 'Found' : 'Not found')
    console.log('Lignes count:', devis?.lignes?.length || 0)
    console.log('First ligne:', devis?.lignes?.[0])

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Erreur base de données: ' + error.message },
        { status: 500 }
      )
    }
    
    if (!devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé ou lien expiré' },
        { status: 404 }
      )
    }

    // Vérifier si refusé
    if (devis.statut === 'refuse') {
      return NextResponse.json(
        { error: 'Ce devis a été refusé' },
        { status: 400 }
      )
    }

    // Retourner le devis (signé ou non)
    return NextResponse.json(devis)
  } catch (error) {
    console.error('Error fetching devis:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: 'Erreur serveur: ' + message },
      { status: 500 }
    )
  }
}

// POST - Enregistrer la signature
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  console.log('=== SIGNATURE API POST START ===')
  
  try {
    const { token } = await params
    console.log('Token received for POST:', token)
    
    if (!token) {
      console.log('ERROR: No token provided for POST')
      return NextResponse.json(
        { error: 'Token manquant' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    console.log('Has signature_image:', !!body.signature_image)
    console.log('Has signer_name:', !!body.signer_name)
    console.log('Has signer_email:', !!body.signer_email)
    
    const { signature_image, signer_name, signer_email, signed_at } = body

    if (!signature_image || !signer_name || !signer_email) {
      console.log('ERROR: Missing required fields')
      console.log('- signature_image:', !!signature_image)
      console.log('- signer_name:', !!signer_name)
      console.log('- signer_email:', !!signer_email)
      return NextResponse.json(
        { error: 'Données de signature incomplètes' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // Vérifier que le devis existe et n'est pas déjà signé
    const { data: devis, error: fetchError } = await supabase
      .from('devis')
      .select('id, signature_client, statut')
      .eq('signature_token', token)
      .single()

    if (fetchError || !devis) {
      return NextResponse.json(
        { error: 'Devis non trouvé' },
        { status: 404 }
      )
    }

    if (devis.signature_client) {
      return NextResponse.json(
        { error: 'Ce devis a déjà été signé' },
        { status: 400 }
      )
    }

    // Récupérer l'IP du client
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    // Mettre à jour le devis avec la signature
    const { error: updateError } = await supabase
      .from('devis')
      .update({
        signature_client: signature_image,
        signature_nom: signer_name,
        signature_email: signer_email,
        signature_date: signed_at,
        signature_ip: clientIp,
        statut: 'accepte',
        date_acceptation: new Date().toISOString().split('T')[0],
      })
      .eq('id', devis.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement de la signature' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Signature enregistrée' })
  } catch (error) {
    console.error('Error signing devis:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
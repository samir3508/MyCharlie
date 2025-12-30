import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateFacturePDF, type FacturePDFData } from '@/lib/pdf/generate-pdf'

// Utiliser SERVICE_ROLE_KEY pour accès public (bypass RLS)
// Sécurisé car l'UUID de la facture est déjà un secret unique
function getSupabasePublic() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getSupabasePublic()

    // Fetch facture with all relations
    const { data: facture, error: factureError } = await supabase
      .from('factures')
      .select(`
        *,
        client:clients(*),
        lignes:lignes_factures(*),
        devis:devis(numero)
      `)
      .eq('id', id)
      .single()

    if (factureError) {
      console.error('Facture query error:', factureError)
      return NextResponse.json({ error: 'Facture non trouvée', details: factureError.message }, { status: 404 })
    }

    if (!facture) {
      return NextResponse.json({ error: 'Facture non trouvée' }, { status: 404 })
    }

    // Fetch tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', facture.tenant_id)
      .single()

    // Prepare PDF data
    const pdfData: FacturePDFData = {
      entreprise: {
        nom: tenant?.company_name || 'MY LÉO',
        adresse: tenant?.address || '',
        cp: tenant?.code_postal || '',
        ville: tenant?.ville || '',
        telephone: tenant?.phone || '',
        email: tenant?.email || '',
        siret: tenant?.siret || '',
        forme_juridique: tenant?.forme_juridique || 'SAS',
        tva_intra: tenant?.tva_intra || '',
        iban: tenant?.iban || '',
        bic: tenant?.bic || '',
        banque: tenant?.banque || '',
      },
      numero: facture.numero,
      type: facture.type || 'standalone',
      statut: facture.statut || 'brouillon',
      date_emission: facture.date_emission || facture.created_at,
      date_echeance: facture.date_echeance,
      objet: facture.objet || '',
      devis_numero: facture.devis?.numero,
      client: {
        nom: facture.client?.nom_complet || 'Client',
        adresse: facture.client?.adresse || '',
        cp: facture.client?.code_postal || '',
        ville: facture.client?.ville || '',
        telephone: facture.client?.telephone || '',
        email: facture.client?.email || '',
      },
      lignes: (facture.lignes || []).map((ligne: any) => ({
        designation: ligne.designation,
        description_detaillee: ligne.description_detaillee,
        quantite: ligne.quantite,
        unite: ligne.unite || 'u',
        prix_unitaire_ht: ligne.prix_unitaire_ht,
        tva_pct: ligne.tva_pct || 20,
        total_ht: ligne.total_ht || ligne.quantite * ligne.prix_unitaire_ht,
        total_ttc: ligne.total_ttc || ligne.quantite * ligne.prix_unitaire_ht * (1 + (ligne.tva_pct || 20) / 100),
      })),
      montant_ht: facture.montant_ht || 0,
      montant_tva: facture.montant_tva || 0,
      montant_ttc: facture.montant_ttc || 0,
      notes: facture.notes || '',
    }

    // Generate PDF
    const pdfBuffer = await generateFacturePDF(pdfData)

    // Return PDF with public access headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${facture.numero}.pdf"`,
        'Cache-Control': 'public, max-age=3600', // Cache 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating facture PDF:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la génération du PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

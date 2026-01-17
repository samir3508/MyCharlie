/**
 * Edge Function: Création facture depuis devis
 * 
 * Crée une facture (acompte, intermédiaire ou solde) depuis un devis existant :
 * - Récupère le devis avec son template et ses lignes
 * - Calcule les montants selon le type (proportionnel au template)
 * - Génère le numéro de facture avec suffixe (A/I/S)
 * - Crée la facture avec les lignes proportionnelles
 * - Programme les relances si nécessaire
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { validateAuth } from '../_shared/auth.ts'
import { supabase } from '../_shared/db.ts'
import { errorResponse, successResponse, handleZodError, handleSupabaseError } from '../_shared/errors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schéma de validation
const CreateFactureFromDevisRequestSchema = z.object({
  tenant_id: z.string().uuid('Le tenant_id doit être un UUID valide'),
  devis_id: z.string().min(1, 'Le devis_id est obligatoire'), // Accepte UUID ou numéro de devis
  type: z.enum(['acompte', 'intermediaire', 'solde'], {
    errorMap: () => ({ message: "Le type doit être 'acompte', 'intermediaire' ou 'solde'" })
  }),
})

/**
 * Génère un numéro de facture avec suffixe selon le type
 */
async function generateFactureNumeroWithType(
  tenantId: string,
  type: 'acompte' | 'intermediaire' | 'solde'
): Promise<string> {
  const year = new Date().getFullYear()
  
  // Compter les factures existantes pour ce tenant cette année
  const { count } = await supabase
    .from('factures')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .gte('date_emission', `${year}-01-01`)
    .lte('date_emission', `${year}-12-31`)
  
  const numero = (count || 0) + 1
  
  // Suffixe selon type
  const suffixes: Record<string, string> = {
    acompte: '-A',
    intermediaire: '-I',
    solde: '-S',
  }
  
  return `FAC-${year}-${String(numero).padStart(3, '0')}${suffixes[type] || ''}`
}

/**
 * Programme les relances pour une facture
 */
async function programmerRelances(
  factureId: string,
  tenantId: string,
  dateEcheance: Date
): Promise<void> {
  const addDays = (date: Date, days: number): Date => {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  const relances = [
    {
      tenant_id: tenantId,
      facture_id: factureId,
      type: 'email',
      niveau: 1,
      date_prevue: addDays(dateEcheance, 3).toISOString().split('T')[0],
      objet: 'Rappel aimable - Facture à échéance',
      message: 'Bonjour,\n\nNous vous rappelons que votre facture arrive à échéance. Merci de procéder au règlement dans les meilleurs délais.\n\nCordialement',
      statut: 'planifie',
    },
    {
      tenant_id: tenantId,
      facture_id: factureId,
      type: 'email',
      niveau: 2,
      date_prevue: addDays(dateEcheance, 10).toISOString().split('T')[0],
      objet: '2ème relance - Échéance dépassée',
      message: 'Bonjour,\n\nMalgré notre précédent rappel, nous n\'avons pas reçu le règlement de votre facture. Merci de régulariser votre situation rapidement.\n\nCordialement',
      statut: 'planifie',
    },
    {
      tenant_id: tenantId,
      facture_id: factureId,
      type: 'email',
      niveau: 3,
      date_prevue: addDays(dateEcheance, 21).toISOString().split('T')[0],
      objet: 'Dernier avertissement avant mise en recouvrement',
      message: 'Bonjour,\n\nVotre facture reste impayée malgré nos relances. Sans règlement sous 7 jours, nous serons contraints d\'engager une procédure de recouvrement.\n\nCordialement',
      statut: 'planifie',
    },
  ]
  
  const { error: relanceError } = await supabase.from('relances').insert(relances)
  
  if (relanceError) {
    console.error('Error inserting relances:', relanceError)
    // Ne pas faire échouer la création de facture si les relances échouent
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return errorResponse(405, 'METHOD_NOT_ALLOWED', 'Seule la méthode POST est autorisée')
  }

  try {
    // Authentification
    const auth = validateAuth(req)
    if (!auth.success) {
      return errorResponse(401, auth.error!.code, auth.error!.message)
    }

    // Parser et valider le body
    const body = await req.json()
    const validatedRequest = CreateFactureFromDevisRequestSchema.parse(body)

    const { tenant_id, devis_id, type } = validatedRequest

    // ÉTAPE 0 : Convertir devis_id (UUID ou numéro) en UUID si nécessaire
    let devisUuid: string = devis_id
    
    // Si ce n'est pas un UUID (format UUID: 8-4-4-4-12 caractères hexadécimaux)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(devis_id)) {
      // C'est probablement un numéro de devis, chercher l'UUID correspondant
      const { data: devisByNumero, error: numeroError } = await supabase
        .from('devis')
        .select('id')
        .eq('numero', devis_id)
        .eq('tenant_id', tenant_id)
        .single()
      
      if (numeroError || !devisByNumero) {
        return errorResponse(
          404,
          'DEVIS_NOT_FOUND',
          `Le devis avec le numéro "${devis_id}" n'existe pas`,
          { devis_id }
        )
      }
      
      devisUuid = devisByNumero.id
    }

    // ÉTAPE 1 : Récupérer le devis avec template et lignes
    const { data: devis, error: devisError } = await supabase
      .from('devis')
      .select(`
        *,
        template_condition_paiement:templates_conditions_paiement(*),
        lignes_devis(*)
      `)
      .eq('id', devisUuid)
      .eq('tenant_id', tenant_id)
      .single()

    if (devisError || !devis) {
      return errorResponse(
        404,
        'DEVIS_NOT_FOUND',
        'Le devis spécifié n\'existe pas',
        { devis_id }
      )
    }

    const template = devis.template_condition_paiement as any

    if (!template) {
      return errorResponse(
        400,
        'NO_TEMPLATE',
        'Aucun template de conditions de paiement associé au devis'
      )
    }

    // ÉTAPE 2 : Vérifier que le type est valide selon le template
    if (type === 'acompte' && (!template.pourcentage_acompte || template.pourcentage_acompte <= 0)) {
      return errorResponse(
        400,
        'INVALID_TYPE',
        'Ce template ne prévoit pas de facture d\'acompte'
      )
    }

    if (type === 'intermediaire' && (!template.pourcentage_intermediaire || template.pourcentage_intermediaire <= 0)) {
      return errorResponse(
        400,
        'INVALID_TYPE',
        'Ce template ne prévoit pas de facture intermédiaire'
      )
    }

    // ÉTAPE 3 : Vérifier que le devis a les montants requis
    if (!devis.montant_ttc || devis.montant_ttc <= 0) {
      return errorResponse(
        400,
        'INVALID_DEVIS',
        'Le devis doit avoir un montant TTC valide'
      )
    }

    // ÉTAPE 4 : Vérifier les factures existantes et proposer le type suivant
    const { data: facturesExistantes } = await supabase
      .from('factures')
      .select('id, numero, statut, date_emission, date_echeance')
      .eq('devis_id', devisUuid)
      .eq('tenant_id', tenant_id)

    // Déterminer quels types de factures existent déjà
    const typesExistants = new Set<string>()
    const facturesDetails = (facturesExistantes || []).map((f: any) => {
      let factureType = 'unknown'
      if (f.numero.endsWith('-A')) factureType = 'acompte'
      else if (f.numero.endsWith('-I')) factureType = 'intermediaire'
      else if (f.numero.endsWith('-S')) factureType = 'solde'
      
      typesExistants.add(factureType)
      return {
        ...f,
        type: factureType
      }
    })

    // Vérifier si le type demandé existe déjà
    const suffixe = type === 'acompte' ? '-A' : type === 'intermediaire' ? '-I' : '-S'
    const hasTypeFacture = facturesDetails.some(f => f.type === type)

    if (hasTypeFacture) {
      // Déterminer le type suivant à proposer
      const typesDisponibles = ['acompte', 'intermediaire', 'solde']
      const typesDisponiblesDansTemplate: string[] = []
      
      if (template.pourcentage_acompte && template.pourcentage_acompte > 0) {
        typesDisponiblesDansTemplate.push('acompte')
      }
      if (template.pourcentage_intermediaire && template.pourcentage_intermediaire > 0) {
        typesDisponiblesDansTemplate.push('intermediaire')
      }
      if (template.pourcentage_solde && template.pourcentage_solde > 0) {
        typesDisponiblesDansTemplate.push('solde')
      }

      // Trouver le prochain type disponible qui n'a pas encore été créé
      const prochainType = typesDisponiblesDansTemplate.find(t => !typesExistants.has(t))
      
      return errorResponse(
        400,
        'ALREADY_EXISTS',
        `Une facture ${type} existe déjà pour ce devis`,
        {
          factures_existantes: facturesDetails,
          types_crees: Array.from(typesExistants),
          types_disponibles: typesDisponiblesDansTemplate,
          prochain_type_suggere: prochainType || null,
          message_suggestion: prochainType 
            ? `Une facture ${type} existe déjà. Le type suivant disponible est : ${prochainType}`
            : 'Toutes les factures prévues par le template ont déjà été créées pour ce devis.'
        }
      )
    }

    // ÉTAPE 5 : Calculer les montants selon le type
    const lignesDevis = (devis.lignes_devis as any[]) || []
    const today = new Date()
    const dateEmission = today.toISOString().split('T')[0]

    let montantTtc: number
    let montantHt: number
    let montantTva: number
    let dateEcheance: Date
    let pourcentage: number

    if (type === 'acompte') {
      pourcentage = template.pourcentage_acompte
      montantTtc = (devis.montant_ttc * pourcentage) / 100
      montantHt = (devis.montant_ht * pourcentage) / 100
      montantTva = (devis.montant_tva * pourcentage) / 100
      dateEcheance = new Date(today)
      dateEcheance.setDate(dateEcheance.getDate() + (template.delai_acompte || 0))
    } else if (type === 'intermediaire') {
      pourcentage = template.pourcentage_intermediaire
      montantTtc = (devis.montant_ttc * pourcentage) / 100
      montantHt = (devis.montant_ht * pourcentage) / 100
      montantTva = (devis.montant_tva * pourcentage) / 100
      dateEcheance = new Date(today)
      dateEcheance.setDate(dateEcheance.getDate() + (template.delai_intermediaire || 15))
    } else { // solde
      // Pour le solde, on doit calculer ce qui reste après acompte + intermédiaire
      const { data: facturesDevis } = await supabase
        .from('factures')
        .select('montant_ttc, montant_ht, montant_tva')
        .eq('devis_id', devisUuid)

      const montantDejaFactureTtc = facturesDevis?.reduce((sum, f) => sum + (f.montant_ttc || 0), 0) || 0
      const montantDejaFactureHt = facturesDevis?.reduce((sum, f) => sum + (f.montant_ht || 0), 0) || 0
      const montantDejaFactureTva = facturesDevis?.reduce((sum, f) => sum + (f.montant_tva || 0), 0) || 0
      
      montantTtc = devis.montant_ttc - montantDejaFactureTtc
      montantHt = devis.montant_ht - montantDejaFactureHt
      montantTva = devis.montant_tva - montantDejaFactureTva
      pourcentage = 100 // Le solde est le reste
      dateEcheance = new Date(today)
      dateEcheance.setDate(dateEcheance.getDate() + (template.delai_solde || 30))
    }

    // ÉTAPE 6 : Générer le numéro de facture
    let factureNumero: string
    try {
      factureNumero = await generateFactureNumeroWithType(tenant_id, type)
    } catch (error: any) {
      return errorResponse(
        500,
        'NUMERO_GENERATION_ERROR',
        'Erreur lors de la génération du numéro de facture',
        { error: error.message }
      )
    }

    // ÉTAPE 7 : Générer titre et description
    const typeLabels: Record<string, string> = {
      acompte: 'Facture d\'acompte',
      intermediaire: 'Facture intermédiaire',
      solde: 'Facture de solde',
    }
    const titre = `${typeLabels[type]} - ${devis.titre || 'Devis ' + devis.numero}`
    const description = type === 'solde'
      ? `Solde sur devis ${devis.numero}`
      : `${typeLabels[type]} de ${pourcentage}% sur devis ${devis.numero}`

    // ÉTAPE 8 : Créer la facture
    const { data: newFacture, error: createError } = await supabase
      .from('factures')
      .insert({
        tenant_id: devis.tenant_id,
        client_id: devis.client_id,
        devis_id: devis.id,
        numero: factureNumero,
        titre,
        description,
        montant_ht: Math.round(montantHt * 100) / 100,
        montant_tva: Math.round(montantTva * 100) / 100,
        montant_ttc: Math.round(montantTtc * 100) / 100,
        date_emission: dateEmission,
        date_echeance: dateEcheance.toISOString().split('T')[0],
        statut: type === 'acompte' ? 'envoyee' : 'brouillon',
        notes: null,
      })
      .select('id, numero, date_emission, date_echeance, montant_ttc')
      .single()

    if (createError) {
      return handleSupabaseError(createError)
    }

    if (!newFacture) {
      return errorResponse(500, 'CREATION_FAILED', 'La facture n\'a pas pu être créée')
    }

    // ÉTAPE 9 : Créer les lignes de facturation proportionnelles
    if (lignesDevis.length > 0 && type !== 'solde') {
      const lignesFacture = lignesDevis.map((ligneDevis, index) => {
        const prixUnitaireHtProportionnel = (ligneDevis.prix_unitaire_ht * pourcentage) / 100

        return {
          facture_id: newFacture.id,
          ordre: ligneDevis.ordre || index + 1,
          designation: ligneDevis.designation,
          description_detaillee: ligneDevis.description_detaillee || null,
          quantite: ligneDevis.quantite,
          unite: ligneDevis.unite,
          prix_unitaire_ht: Math.round(prixUnitaireHtProportionnel * 100) / 100,
          tva_pct: ligneDevis.tva_pct || 10,
        }
      })

      const { error: lignesError } = await supabase
        .from('lignes_factures')
        .insert(lignesFacture)

      if (lignesError) {
        console.error('Error creating invoice lines:', lignesError)
        // Ne pas faire échouer la création de facture si les lignes échouent
      }
    } else if (type === 'solde') {
      // Pour le solde, créer les lignes avec le montant restant pour chaque ligne
      const { data: facturesDevis } = await supabase
        .from('factures')
        .select(`
          id,
          lignes_factures(*)
        `)
        .eq('devis_id', devisUuid)

      // Calculer les montants déjà facturés par ligne (par ordre)
      const montantsDejaFactures = new Map<number, number>()
      facturesDevis?.forEach(facture => {
        facture.lignes_factures?.forEach((ligne: any) => {
          const ordre = ligne.ordre || 0
          const montantActuel = montantsDejaFactures.get(ordre) || 0
          montantsDejaFactures.set(ordre, montantActuel + (ligne.prix_unitaire_ht * ligne.quantite))
        })
      })

      const lignesFacture = lignesDevis.map((ligneDevis, index) => {
        const ordre = ligneDevis.ordre || index + 1
        const montantDejaFacture = montantsDejaFactures.get(ordre) || 0
        const montantTotalLigne = ligneDevis.prix_unitaire_ht * ligneDevis.quantite
        const montantRestant = montantTotalLigne - montantDejaFacture
        const prixUnitaireHtSolde = ligneDevis.quantite > 0 ? montantRestant / ligneDevis.quantite : 0

        return {
          facture_id: newFacture.id,
          ordre,
          designation: ligneDevis.designation,
          description_detaillee: ligneDevis.description_detaillee || null,
          quantite: ligneDevis.quantite,
          unite: ligneDevis.unite,
          prix_unitaire_ht: Math.max(0, Math.round(prixUnitaireHtSolde * 100) / 100),
          tva_pct: ligneDevis.tva_pct || 10,
        }
      })

      const { error: lignesError } = await supabase
        .from('lignes_factures')
        .insert(lignesFacture)

      if (lignesError) {
        console.error('Error creating invoice lines for solde:', lignesError)
      }
    }

    // ÉTAPE 10 : Programmer les relances (pour acompte et solde)
    if (type === 'acompte' || type === 'solde') {
      try {
        await programmerRelances(newFacture.id, tenant_id, dateEcheance)
      } catch (relanceError) {
        console.warn('Error scheduling relances:', relanceError)
        // Ne pas faire échouer la création de facture si les relances échouent
      }
    }

    return successResponse(
      {
        facture_id: newFacture.id,
        numero: newFacture.numero,
        type,
        montant_ttc: newFacture.montant_ttc,
        date_emission: newFacture.date_emission,
        date_echeance: newFacture.date_echeance,
      },
      `Facture ${type} créée avec succès`
    )
  } catch (error) {
    console.error('Error in create-facture-from-devis:', error)
    if (error.name === 'ZodError') {
      return errorResponse(400, 'VALIDATION_ERROR', 'Erreur de validation', { errors: error.errors })
    }
    return handleSupabaseError(error)
  }
})

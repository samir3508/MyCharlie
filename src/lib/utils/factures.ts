import { getSupabaseClient } from '@/lib/supabase/client'

interface Devis {
  id: string
  tenant_id: string
  client_id: string
  titre: string | null
  numero: string
  montant_ht: number
  montant_tva: number
  montant_ttc: number
  template_condition_paiement_id: string | null
}

interface Template {
  id: string
  nom: string
  pourcentage_acompte: number
  pourcentage_intermediaire: number | null
  pourcentage_solde: number | null
  delai_acompte: number
  delai_intermediaire: number | null
  delai_solde: number
}

interface CreateFactureResult {
  id: string
  numero: string
  montant_ttc: number
  date_echeance: string
}

/**
 * Génère un numéro de facture unique
 */
export async function generateFactureNumero(
  tenantId: string, 
  type: 'acompte' | 'intermediaire' | 'solde' | 'standalone'
): Promise<string> {
  const supabase = getSupabaseClient()
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
    standalone: '',
  }
  
  return `FAC-${year}-${String(numero).padStart(3, '0')}${suffixes[type] || ''}`
}

/**
 * Crée une facture d'acompte pour un devis
 */
export async function createFactureAcompte(devisId: string): Promise<CreateFactureResult> {
  const supabase = getSupabaseClient()
  
  // Récupérer le devis avec son template et ses lignes
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select(`
      *,
      template_condition_paiement:templates_conditions_paiement(*),
      lignes_devis(*)
    `)
    .eq('id', devisId)
    .single()
  
  if (devisError || !devis) {
    console.error('Error fetching devis:', devisError)
    throw new Error(`Devis non trouvé: ${devisError?.message || 'Erreur inconnue'}`)
  }
  
  const template = devis.template_condition_paiement as Template | null
  
  if (!template) {
    throw new Error('Aucun template de conditions de paiement associé au devis')
  }
  
  if (template.pourcentage_acompte <= 0) {
    throw new Error('Ce template ne prévoit pas de facture d\'acompte')
  }
  
  // Vérifier si une facture d'acompte existe déjà
  const { data: facturesExistantes } = await supabase
    .from('factures')
    .select('numero')
    .eq('devis_id', devisId)
  
  const hasAcompte = facturesExistantes?.some((f: any) => f.numero.endsWith('-A')) || false
  if (hasAcompte) {
    throw new Error('Une facture d\'acompte existe déjà pour ce devis')
  }
  
  // Vérifier que le devis a les montants requis
  if (!devis.montant_ttc || devis.montant_ttc <= 0) {
    throw new Error('Le devis doit avoir un montant TTC valide')
  }
  
  const lignesDevis = (devis.lignes_devis as any[]) || []
  const today = new Date()
  
  const montantAcompte = (devis.montant_ttc * template.pourcentage_acompte) / 100
  const dateEcheanceAcompte = new Date(today)
  dateEcheanceAcompte.setDate(dateEcheanceAcompte.getDate() + template.delai_acompte)
  
  const numeroAcompte = await generateFactureNumero(devis.tenant_id, 'acompte')
  
  // Calculer HT et TVA proportionnellement
  const montantHtAcompte = (devis.montant_ht * template.pourcentage_acompte) / 100
  const montantTvaAcompte = (devis.montant_tva * template.pourcentage_acompte) / 100
  
  const { data: factureAcompte, error: acompteError } = await supabase
    .from('factures')
    .insert({
      tenant_id: devis.tenant_id,
      client_id: devis.client_id,
      devis_id: devis.id,
      numero: numeroAcompte,
      titre: `Facture d'acompte - ${devis.titre || 'Devis ' + devis.numero}`,
      description: `Acompte de ${template.pourcentage_acompte}% sur devis ${devis.numero}`,
      montant_ht: montantHtAcompte,
      montant_tva: montantTvaAcompte,
      montant_ttc: montantAcompte,
      date_emission: today.toISOString().split('T')[0],
      date_echeance: dateEcheanceAcompte.toISOString().split('T')[0],
      statut: 'envoyee',
    })
    .select()
    .single()
  
  if (acompteError) {
    console.error('Error creating acompte invoice:', acompteError)
    throw new Error(`Erreur lors de la création de la facture d'acompte: ${acompteError.message}`)
  }
  
  // Créer les lignes de facturation proportionnelles
  if (lignesDevis.length > 0) {
    const lignesAcompte = lignesDevis.map((ligneDevis, index) => {
      const quantite = ligneDevis.quantite
      const prixUnitaireHt = ligneDevis.prix_unitaire_ht
      const tvaPct = ligneDevis.tva_pct || 10
      
      // Calculer le prix unitaire proportionnel au pourcentage d'acompte
      const prixUnitaireHtProportionnel = (prixUnitaireHt * template.pourcentage_acompte) / 100
      
      return {
        facture_id: factureAcompte.id,
        ordre: ligneDevis.ordre || index + 1,
        designation: ligneDevis.designation,
        description_detaillee: ligneDevis.description_detaillee,
        quantite: quantite,
        unite: ligneDevis.unite,
        prix_unitaire_ht: prixUnitaireHtProportionnel,
        tva_pct: tvaPct,
      }
    })
    
    const { error: lignesError } = await supabase
      .from('lignes_factures')
      .insert(lignesAcompte)
    
    if (lignesError) {
      console.error('Error creating invoice lines for acompte:', lignesError)
    }
  }
  
  // Programmer les relances pour l'acompte
  try {
    await programmerRelances(factureAcompte.id, devis.tenant_id, dateEcheanceAcompte)
  } catch (relanceError) {
    console.warn('Error scheduling relances for acompte:', relanceError)
  }
  
  return {
    id: factureAcompte.id,
    numero: numeroAcompte,
    montant_ttc: montantAcompte,
    date_echeance: dateEcheanceAcompte.toISOString().split('T')[0],
  }
}

/**
 * Crée une facture intermédiaire pour un devis
 */
export async function createFactureIntermediaire(devisId: string): Promise<CreateFactureResult> {
  const supabase = getSupabaseClient()
  
  // Récupérer le devis avec son template et ses lignes
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select(`
      *,
      template_condition_paiement:templates_conditions_paiement(*),
      lignes_devis(*)
    `)
    .eq('id', devisId)
    .single()
  
  if (devisError || !devis) {
    console.error('Error fetching devis:', devisError)
    throw new Error(`Devis non trouvé: ${devisError?.message || 'Erreur inconnue'}`)
  }
  
  const template = devis.template_condition_paiement as Template | null
  
  if (!template) {
    throw new Error('Aucun template de conditions de paiement associé au devis')
  }
  
  const pctInter = template.pourcentage_intermediaire;
  if (!pctInter || pctInter <= 0) {
    throw new Error('Ce template ne prévoit pas de facture intermédiaire')
  }

  // Vérifier si une facture intermédiaire existe déjà
  const { data: facturesExistantes } = await supabase
    .from('factures')
    .select('numero')
    .eq('devis_id', devisId)
  
  const hasIntermediaire = facturesExistantes?.some((f: any) => f.numero.endsWith('-I')) || false
  if (hasIntermediaire) {
    throw new Error('Une facture intermédiaire existe déjà pour ce devis')
  }
  
  if (!devis.montant_ttc || devis.montant_ttc <= 0) {
    throw new Error('Le devis doit avoir un montant TTC valide')
  }
  
  const lignesDevis = (devis.lignes_devis as any[]) || []
  const today = new Date()
  
  const montantInter = (devis.montant_ttc * pctInter) / 100
  const dateEcheanceInter = new Date(today)
  dateEcheanceInter.setDate(dateEcheanceInter.getDate() + (template.delai_intermediaire || 15))
  
  const numeroInter = await generateFactureNumero(devis.tenant_id, 'intermediaire')
  
  const montantHtInter = (devis.montant_ht * pctInter) / 100
  const montantTvaInter = (devis.montant_tva * pctInter) / 100
  
  const { data: factureInter, error: interError } = await supabase
    .from('factures')
    .insert({
      tenant_id: devis.tenant_id,
      client_id: devis.client_id,
      devis_id: devis.id,
      numero: numeroInter,
      titre: `Facture intermédiaire - ${devis.titre || 'Devis ' + devis.numero}`,
      description: `Paiement intermédiaire de ${template.pourcentage_intermediaire}% sur devis ${devis.numero}`,
      montant_ht: montantHtInter,
      montant_tva: montantTvaInter,
      montant_ttc: montantInter,
      date_emission: today.toISOString().split('T')[0],
      date_echeance: dateEcheanceInter.toISOString().split('T')[0],
      statut: 'brouillon',
    })
    .select()
    .single()
  
  if (interError) {
    console.error('Error creating intermediaire invoice:', interError)
    throw new Error(`Erreur lors de la création de la facture intermédiaire: ${interError.message}`)
  }
  
  // Créer les lignes de facturation proportionnelles
  if (lignesDevis.length > 0) {
    const lignesInter = lignesDevis.map((ligneDevis, index) => {
      const quantite = ligneDevis.quantite
      const prixUnitaireHt = ligneDevis.prix_unitaire_ht
      const tvaPct = ligneDevis.tva_pct || 10
      
      const prixUnitaireHtProportionnel = (prixUnitaireHt * pctInter) / 100
      
      return {
        facture_id: factureInter.id,
        ordre: ligneDevis.ordre || index + 1,
        designation: ligneDevis.designation,
        description_detaillee: ligneDevis.description_detaillee,
        quantite: quantite,
        unite: ligneDevis.unite,
        prix_unitaire_ht: prixUnitaireHtProportionnel,
        tva_pct: tvaPct,
      }
    })
    
    const { error: lignesError } = await supabase
      .from('lignes_factures')
      .insert(lignesInter)
    
    if (lignesError) {
      console.error('Error creating invoice lines for intermediaire:', lignesError)
    }
  }
  
  return {
    id: factureInter.id,
    numero: numeroInter,
    montant_ttc: montantInter,
    date_echeance: dateEcheanceInter.toISOString().split('T')[0],
  }
}

/**
 * Crée les factures initiales lors de l'acceptation d'un devis
 * (Facture d'acompte et éventuellement facture intermédiaire en brouillon)
 * @deprecated Utilisez createFactureAcompte() et createFactureIntermediaire() séparément
 */
export async function createFacturesFromDevis(devisId: string): Promise<CreateFactureResult[]> {
  const supabase = getSupabaseClient()
  
  // Récupérer le devis avec son template et ses lignes
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select(`
      *,
      template_condition_paiement:templates_conditions_paiement(*),
      lignes_devis(*)
    `)
    .eq('id', devisId)
    .single()
  
  if (devisError || !devis) {
    console.error('Error fetching devis:', devisError)
    throw new Error(`Devis non trouvé: ${devisError?.message || 'Erreur inconnue'}`)
  }
  
  const template = devis.template_condition_paiement as Template | null
  
  if (!template) {
    throw new Error('Aucun template de conditions de paiement associé au devis')
  }
  
  // Vérifier que le devis a les montants requis
  if (!devis.montant_ttc || devis.montant_ttc <= 0) {
    throw new Error('Le devis doit avoir un montant TTC valide')
  }
  
  const lignesDevis = (devis.lignes_devis as any[]) || []
  
  // Vérifier quelles factures existent déjà
  const { data: facturesExistantes } = await supabase
    .from('factures')
    .select('numero')
    .eq('devis_id', devisId)
  
  const hasAcompte = facturesExistantes?.some((f: any) => f.numero.endsWith('-A')) || false
  const hasIntermediaire = facturesExistantes?.some((f: any) => f.numero.endsWith('-I')) || false
  
  const factures: CreateFactureResult[] = []
  const today = new Date()
  
  // 1. Facture d'acompte (si pourcentage > 0 et pas déjà créée)
  if (template.pourcentage_acompte > 0 && !hasAcompte) {
    const montantAcompte = (devis.montant_ttc * template.pourcentage_acompte) / 100
    const dateEcheanceAcompte = new Date(today)
    dateEcheanceAcompte.setDate(dateEcheanceAcompte.getDate() + template.delai_acompte)
    
    const numeroAcompte = await generateFactureNumero(devis.tenant_id, 'acompte')
    
    // Calculer HT et TVA proportionnellement
    const montantHtAcompte = (devis.montant_ht * template.pourcentage_acompte) / 100
    const montantTvaAcompte = (devis.montant_tva * template.pourcentage_acompte) / 100
    
    const { data: factureAcompte, error: acompteError } = await supabase
      .from('factures')
      .insert({
        tenant_id: devis.tenant_id,
        client_id: devis.client_id,
        devis_id: devis.id,
        numero: numeroAcompte,
        titre: `Facture d'acompte - ${devis.titre || 'Devis ' + devis.numero}`,
        description: `Acompte de ${template.pourcentage_acompte}% sur devis ${devis.numero}`,
        montant_ht: montantHtAcompte,
        montant_tva: montantTvaAcompte,
        montant_ttc: montantAcompte,
        date_emission: today.toISOString().split('T')[0],
        date_echeance: dateEcheanceAcompte.toISOString().split('T')[0],
        statut: 'envoyee',
      })
      .select()
      .single()
    
    if (acompteError) {
      console.error('Error creating acompte invoice:', acompteError)
      throw new Error(`Erreur lors de la création de la facture d'acompte: ${acompteError.message}`)
    }
    
    // Créer les lignes de facturation proportionnelles
    if (lignesDevis.length > 0) {
      const lignesAcompte = lignesDevis.map((ligneDevis, index) => {
        const quantite = ligneDevis.quantite
        const prixUnitaireHt = ligneDevis.prix_unitaire_ht
        const tvaPct = ligneDevis.tva_pct || 10
        
        // Calculer le prix unitaire proportionnel au pourcentage d'acompte
        const prixUnitaireHtProportionnel = (prixUnitaireHt * template.pourcentage_acompte) / 100
        
        return {
          facture_id: factureAcompte.id,
          ordre: ligneDevis.ordre || index + 1,
          designation: ligneDevis.designation,
          description_detaillee: ligneDevis.description_detaillee,
          quantite: quantite, // On garde la même quantité
          unite: ligneDevis.unite,
          prix_unitaire_ht: prixUnitaireHtProportionnel,
          tva_pct: tvaPct,
        }
      })
      
      const { error: lignesError } = await supabase
        .from('lignes_factures')
        .insert(lignesAcompte)
      
      if (lignesError) {
        console.error('Error creating invoice lines for acompte:', lignesError)
        // On continue même si les lignes échouent, la facture est créée
      }
    }
    
    factures.push({
      id: factureAcompte.id,
      numero: numeroAcompte,
      montant_ttc: montantAcompte,
      date_echeance: dateEcheanceAcompte.toISOString().split('T')[0],
    })
    
    // Programmer les relances pour l'acompte (ne pas faire échouer si ça échoue)
    try {
      await programmerRelances(factureAcompte.id, devis.tenant_id, dateEcheanceAcompte)
    } catch (relanceError) {
      console.warn('Error scheduling relances for acompte:', relanceError)
      // On continue quand même, les relances peuvent être programmées plus tard
    }
  }
  
  // 2. Facture intermédiaire (en brouillon, sera envoyée manuellement)
  // (si pourcentage > 0 et pas déjà créée)
  const pctInter = template.pourcentage_intermediaire
  if (pctInter && pctInter > 0 && !hasIntermediaire) {
    const montantInter = (devis.montant_ttc * pctInter) / 100
    const dateEcheanceInter = new Date(today)
    dateEcheanceInter.setDate(dateEcheanceInter.getDate() + (template.delai_intermediaire || 15))
    
    const numeroInter = await generateFactureNumero(devis.tenant_id, 'intermediaire')
    
    const montantHtInter = (devis.montant_ht * pctInter) / 100
    const montantTvaInter = (devis.montant_tva * pctInter) / 100
    
    const { data: factureInter, error: interError } = await supabase
      .from('factures')
      .insert({
        tenant_id: devis.tenant_id,
        client_id: devis.client_id,
        devis_id: devis.id,
        numero: numeroInter,
        titre: `Facture intermédiaire - ${devis.titre || 'Devis ' + devis.numero}`,
        description: `Paiement intermédiaire de ${template.pourcentage_intermediaire}% sur devis ${devis.numero}`,
        montant_ht: montantHtInter,
        montant_tva: montantTvaInter,
        montant_ttc: montantInter,
        date_emission: today.toISOString().split('T')[0],
        date_echeance: dateEcheanceInter.toISOString().split('T')[0],
        statut: 'brouillon', // Sera envoyée manuellement
      })
      .select()
      .single()
    
    if (interError) {
      console.error('Error creating intermediaire invoice:', interError)
      throw new Error(`Erreur lors de la création de la facture intermédiaire: ${interError.message}`)
    }
    
    // Créer les lignes de facturation proportionnelles
    if (lignesDevis.length > 0) {
      const lignesInter = lignesDevis.map((ligneDevis, index) => {
        const quantite = ligneDevis.quantite
        const prixUnitaireHt = ligneDevis.prix_unitaire_ht
        const tvaPct = ligneDevis.tva_pct || 10
        
        // Calculer le prix unitaire proportionnel au pourcentage intermédiaire
        const prixUnitaireHtProportionnel = (prixUnitaireHt * pctInter) / 100
        
        return {
          facture_id: factureInter.id,
          ordre: ligneDevis.ordre || index + 1,
          designation: ligneDevis.designation,
          description_detaillee: ligneDevis.description_detaillee,
          quantite: quantite,
          unite: ligneDevis.unite,
          prix_unitaire_ht: prixUnitaireHtProportionnel,
          tva_pct: tvaPct,
        }
      })
      
      const { error: lignesError } = await supabase
        .from('lignes_factures')
        .insert(lignesInter)
      
      if (lignesError) {
        console.error('Error creating invoice lines for intermediaire:', lignesError)
      }
    }
    
    factures.push({
      id: factureInter.id,
      numero: numeroInter,
      montant_ttc: montantInter,
      date_echeance: dateEcheanceInter.toISOString().split('T')[0],
    })
  }
  
  return factures
}

/**
 * Crée la facture de solde lorsque les travaux sont terminés
 */
export async function createFactureSolde(devisId: string): Promise<CreateFactureResult> {
  const supabase = getSupabaseClient()
  
  // Récupérer le devis avec son template et ses lignes
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select(`
      *,
      template_condition_paiement:templates_conditions_paiement(*),
      lignes_devis(*)
    `)
    .eq('id', devisId)
    .single()
  
  if (devisError || !devis) {
    throw new Error('Devis non trouvé')
  }
  
  const template = devis.template_condition_paiement as Template | null
  
  if (!template || !template.pourcentage_solde || template.pourcentage_solde <= 0) {
    throw new Error('Aucun solde à facturer pour ce template')
  }

  const pctSolde = template.pourcentage_solde
  
  const lignesDevis = (devis.lignes_devis as any[]) || []
  
  const today = new Date()
  const montantSolde = (devis.montant_ttc * pctSolde) / 100
  const dateEcheanceSolde = new Date(today)
  dateEcheanceSolde.setDate(dateEcheanceSolde.getDate() + template.delai_solde)
  
  const numeroSolde = await generateFactureNumero(devis.tenant_id, 'solde')
  
  const montantHtSolde = (devis.montant_ht * pctSolde) / 100
  const montantTvaSolde = (devis.montant_tva * pctSolde) / 100
  
  const { data: factureSolde, error: soldeError } = await supabase
    .from('factures')
    .insert({
      tenant_id: devis.tenant_id,
      client_id: devis.client_id,
      devis_id: devis.id,
      numero: numeroSolde,
      titre: `Facture de solde - ${devis.titre || 'Devis ' + devis.numero}`,
      description: `Solde de ${template.pourcentage_solde}% sur devis ${devis.numero}`,
      montant_ht: montantHtSolde,
      montant_tva: montantTvaSolde,
      montant_ttc: montantSolde,
      date_emission: today.toISOString().split('T')[0],
      date_echeance: dateEcheanceSolde.toISOString().split('T')[0],
      statut: 'envoyee',
    })
    .select()
    .single()
  
  if (soldeError) {
    console.error('Error creating solde invoice:', soldeError)
    throw new Error(`Erreur lors de la création de la facture de solde: ${soldeError.message}`)
  }
  
  // Créer les lignes de facturation proportionnelles
  if (lignesDevis.length > 0) {
    const lignesSolde = lignesDevis.map((ligneDevis, index) => {
      const quantite = ligneDevis.quantite
      const prixUnitaireHt = ligneDevis.prix_unitaire_ht
      const tvaPct = ligneDevis.tva_pct || 10
      
      // Calculer le prix unitaire proportionnel au pourcentage de solde
      const prixUnitaireHtProportionnel = (prixUnitaireHt * pctSolde) / 100
      
      return {
        facture_id: factureSolde.id,
        ordre: ligneDevis.ordre || index + 1,
        designation: ligneDevis.designation,
        description_detaillee: ligneDevis.description_detaillee,
        quantite: quantite,
        unite: ligneDevis.unite,
        prix_unitaire_ht: prixUnitaireHtProportionnel,
        tva_pct: tvaPct,
      }
    })
    
    const { error: lignesError } = await supabase
      .from('lignes_factures')
      .insert(lignesSolde)
    
    if (lignesError) {
      console.error('Error creating invoice lines for solde:', lignesError)
    }
  }
  
  // Programmer les relances pour le solde (ne pas faire échouer si ça échoue)
  try {
    await programmerRelances(factureSolde.id, devis.tenant_id, dateEcheanceSolde)
  } catch (relanceError) {
    console.warn('Error scheduling relances for solde:', relanceError)
    // On continue quand même, les relances peuvent être programmées plus tard
  }
  
  return {
    id: factureSolde.id,
    numero: numeroSolde,
    montant_ttc: montantSolde,
    date_echeance: dateEcheanceSolde.toISOString().split('T')[0],
  }
}

/**
 * Programme les relances automatiques pour une facture
 */
async function programmerRelances(
  factureId: string, 
  tenantId: string, 
  dateEcheance: Date
): Promise<void> {
  const supabase = getSupabaseClient()
  
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
    throw new Error(`Erreur lors de la programmation des relances: ${relanceError.message}`)
  }
}

/**
 * Vérifie si toutes les factures d'un devis sont payées et met à jour le statut du devis si nécessaire
 */
export async function checkAndUpdateDevisStatus(devisId: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  // Récupérer toutes les factures liées au devis
  const { data: factures, error: facturesError } = await supabase
    .from('factures')
    .select('id, statut')
    .eq('devis_id', devisId)
  
  if (facturesError) {
    console.error('Error fetching factures:', facturesError)
    return
  }
  
  // Si aucune facture, ne rien faire
  if (!factures || factures.length === 0) {
    return
  }
  
  // Vérifier si toutes les factures sont payées
  const allPaid = factures.every((f: any) => f.statut === 'payee')
  
  if (allPaid) {
    // Mettre à jour le statut du devis à "paye"
    // Note: On utilise 'accepte' comme statut de base si 'paye' n'existe pas encore dans le type
    // Il faudra ajouter 'paye' au type dans database.ts
    const { error: updateError } = await supabase
      .from('devis')
      .update({
        statut: 'paye' as any, // Forcer le type pour l'instant
        updated_at: new Date().toISOString(),
      })
      .eq('id', devisId)
    
    if (updateError) {
      console.error('Error updating devis status:', updateError)
    }
  }
}

/**
 * Marque une facture comme payée et annule les relances planifiées
 * Met également à jour le statut du devis si toutes les factures sont payées
 */
export async function markFactureAsPaid(factureId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const today = new Date().toISOString().split('T')[0]
  
  // Récupérer la facture pour obtenir le devis_id
  const { data: facture, error: factureError } = await supabase
    .from('factures')
    .select('devis_id')
    .eq('id', factureId)
    .single()
  
  if (factureError) throw factureError
  
  // Mettre à jour la facture
  const { error: updateError } = await supabase
    .from('factures')
    .update({
      statut: 'payee',
      date_paiement: today,
    })
    .eq('id', factureId)
  
  if (updateError) throw updateError
  
  // Annuler les relances planifiées
  await supabase
    .from('relances')
    .update({ statut: 'annule' })
    .eq('facture_id', factureId)
    .eq('statut', 'planifie')
  
  // Si la facture est liée à un devis, vérifier et mettre à jour le statut du devis
  if (facture.devis_id) {
    await checkAndUpdateDevisStatus(facture.devis_id)
  }
}

/**
 * Récupère le résumé des factures liées à un devis
 */
export async function getDevisFacturesSummary(devisId: string) {
  const supabase = getSupabaseClient()
  
  const { data: factures, error } = await supabase
    .from('factures')
    .select('*')
    .eq('devis_id', devisId)
    .order('date_emission')
  
  if (error) throw error
  
  const summary = {
    total: factures?.length || 0,
    acompte: factures?.find((f: any) => f.numero.endsWith('-A')),
    intermediaire: factures?.find((f: any) => f.numero.endsWith('-I')),
    solde: factures?.find((f: any) => f.numero.endsWith('-S')),
    totalPaye: factures?.filter((f: any) => f.statut === 'payee').reduce((sum: any, f: any) => sum + f.montant_ttc, 0) || 0,
    totalDu: factures?.filter((f: any) => f.statut !== 'payee').reduce((sum: any, f: any) => sum + f.montant_ttc, 0) || 0,
    factures: factures || [],
  }
  
  return summary
}

// Helper function
function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}
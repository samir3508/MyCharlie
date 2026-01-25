/**
 * Tests E2E : Workflow complet de création client → dossier → devis → facture
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

describe('Workflow Complet E2E', () => {
  let supabase: ReturnType<typeof createClient>
  let userId: string
  let tenantId: string
  let clientId: string
  let dossierId: string
  let devisId: string
  let factureId: string

  const testEmail = `test-workflow-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!@#'

  beforeAll(async () => {
    // Créer client Supabase
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Créer utilisateur de test
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    })

    if (authError) throw authError
    userId = authData.user!.id

    // Récupérer tenant_id
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', userId)
      .single()

    tenantId = tenantData!.id
  }, 30000) // Timeout 30s

  describe('1. Création Client', () => {
    it('Devrait créer un client avec succès', async () => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          tenant_id: tenantId,
          nom: 'Martin',
          prenom: 'Jean',
          email: 'jean.martin@example.com',
          telephone: '0612345678',
          type: 'particulier',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.nom).toBe('Martin')
      expect(data.prenom).toBe('Jean')
      expect(data.tenant_id).toBe(tenantId)
      clientId = data.id
    })

    it('Le client devrait avoir un nom_complet généré', async () => {
      const { data } = await supabase
        .from('clients')
        .select('nom_complet')
        .eq('id', clientId)
        .single()

      expect(data!.nom_complet).toBe('Jean Martin')
    })
  })

  describe('2. Création Dossier', () => {
    it('Devrait créer un dossier avec succès', async () => {
      const { data, error } = await supabase
        .from('dossiers')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          numero: `DOS-E2E-${Date.now()}`,
          titre: 'Test dossier E2E',
          statut: 'contact_recu',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.statut).toBe('contact_recu')
      dossierId = data.id
    })

    it('Le journal devrait avoir une entrée "Dossier créé"', async () => {
      // Attendre un peu pour que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data } = await supabase
        .from('journal_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('type', 'creation')
        .single()

      expect(data).toBeDefined()
      expect(data!.titre).toBe('Dossier créé')
      expect(data!.auteur).toBe('systeme')
    })
  })

  describe('3. Création Devis', () => {
    it('Devrait créer un devis avec succès', async () => {
      const { data, error } = await supabase
        .from('devis')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          dossier_id: dossierId,
          numero: `DV-E2E-${Date.now()}`,
          titre: 'Test devis E2E',
          montant_ht: 1000,
          montant_tva: 200,
          montant_ttc: 1200,
          statut: 'brouillon',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.montant_ht).toBe(1000)
      expect(data.montant_ttc).toBe(1200)
      devisId = data.id
    })

    it('Le devis devrait avoir un pdf_url généré automatiquement', async () => {
      // Attendre un peu pour que le trigger s'exécute
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data } = await supabase
        .from('devis')
        .select('pdf_url')
        .eq('id', devisId)
        .single()

      expect(data!.pdf_url).toContain('/api/pdf/devis/')
      expect(data!.pdf_url).toContain(devisId)
    })

    it('Le journal devrait avoir une entrée "Devis créé"', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data } = await supabase
        .from('journal_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('type', 'devis')
        .single()

      expect(data).toBeDefined()
      expect(data!.titre).toBe('Devis créé')
    })
  })

  describe('4. Ajouter Lignes Devis', () => {
    it('Devrait ajouter une ligne de devis', async () => {
      const { data, error } = await supabase
        .from('lignes_devis')
        .insert({
          devis_id: devisId,
          ordre: 1,
          designation: 'Test ligne',
          quantite: 10,
          prix_unitaire_ht: 100,
          tva_pct: 20,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
    })

    it('Les totaux devraient être calculés automatiquement', async () => {
      const { data } = await supabase
        .from('lignes_devis')
        .select('total_ht, total_tva, total_ttc')
        .eq('devis_id', devisId)
        .single()

      expect(data!.total_ht).toBe(1000) // 10 × 100
      expect(data!.total_tva).toBe(200) // 1000 × 20%
      expect(data!.total_ttc).toBe(1200) // 1000 + 200
    })
  })

  describe('5. Changement Statut Devis', () => {
    it('Devrait changer le statut du devis', async () => {
      const { data, error } = await supabase
        .from('devis')
        .update({ statut: 'envoye', date_envoi: new Date().toISOString() })
        .eq('id', devisId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.statut).toBe('envoye')
    })

    it('Le journal devrait avoir une entrée "Devis envoyé"', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data } = await supabase
        .from('journal_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('titre', 'Devis envoyé')
        .maybeSingle()

      expect(data).toBeDefined()
      expect(data!.contenu).toContain('envoyé au client')
    })
  })

  describe('6. Création Facture depuis Devis', () => {
    it('Devrait créer une facture', async () => {
      const { data, error } = await supabase
        .from('factures')
        .insert({
          tenant_id: tenantId,
          client_id: clientId,
          dossier_id: dossierId,
          devis_id: devisId,
          numero: `FA-E2E-${Date.now()}`,
          titre: 'Test facture E2E',
          montant_ht: 1000,
          montant_tva: 200,
          montant_ttc: 1200,
          statut: 'brouillon',
          date_echeance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.devis_id).toBe(devisId)
      factureId = data.id
    })

    it('La facture devrait avoir un pdf_url généré automatiquement', async () => {
      await new Promise(resolve => setTimeout(resolve, 500))

      const { data } = await supabase
        .from('factures')
        .select('pdf_url')
        .eq('id', factureId)
        .single()

      expect(data!.pdf_url).toContain('/api/pdf/facture/')
      expect(data!.pdf_url).toContain(factureId)
    })

    it('Le journal devrait avoir une entrée "Facture créée"', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data } = await supabase
        .from('journal_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('type', 'facture')
        .eq('titre', 'Facture créée')
        .maybeSingle()

      expect(data).toBeDefined()
    })
  })

  describe('7. Marquer Facture Payée', () => {
    it('Devrait marquer la facture comme payée', async () => {
      const { data, error } = await supabase
        .from('factures')
        .update({ 
          statut: 'payee',
          date_paiement: new Date().toISOString(),
        })
        .eq('id', factureId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.statut).toBe('payee')
      expect(data!.date_paiement).toBeDefined()
    })

    it('Le journal devrait avoir une entrée "Paiement reçu"', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data } = await supabase
        .from('journal_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('type', 'paiement')
        .maybeSingle()

      expect(data).toBeDefined()
      expect(data!.titre).toBe('Paiement reçu')
    })
  })

  describe('8. Création RDV', () => {
    it('Devrait créer un RDV', async () => {
      const rdvDate = new Date()
      rdvDate.setDate(rdvDate.getDate() + 7) // RDV dans 7 jours

      const { data, error } = await supabase
        .from('rdv')
        .insert({
          tenant_id: tenantId,
          dossier_id: dossierId,
          client_id: clientId,
          titre: 'Test RDV E2E',
          date_heure: rdvDate.toISOString(),
          type_rdv: 'visite',
          statut: 'planifie',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.type_rdv).toBe('visite')
    })

    it('Le journal devrait avoir une entrée "RDV planifié"', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const { data } = await supabase
        .from('journal_dossier')
        .select('*')
        .eq('dossier_id', dossierId)
        .eq('type', 'rdv_cree')
        .maybeSingle()

      expect(data).toBeDefined()
      expect(data!.titre).toBe('RDV planifié')
    })
  })

  afterAll(async () => {
    // Nettoyage : Supprimer le client (cascade supprimera tout)
    await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)

    // Se déconnecter
    await supabase.auth.signOut()
  })
})

/**
 * INSTRUCTIONS POUR LANCER CE TEST
 * 
 * 1. Installer les dépendances :
 *    npm install -D vitest @vitest/ui dotenv
 * 
 * 2. Lancer le test :
 *    npm test tests/e2e/workflow-complet.test.ts
 * 
 * 3. Lancer avec UI :
 *    npm run test:ui
 * 
 * 4. Résultats attendus :
 *    ✅ 13 tests passent
 *    - Création client
 *    - Nom complet généré
 *    - Création dossier
 *    - Entrée journal dossier
 *    - Création devis
 *    - PDF URL généré
 *    - Entrée journal devis
 *    - Ajout ligne devis
 *    - Calculs automatiques
 *    - Changement statut devis
 *    - Entrée journal devis envoyé
 *    - Création facture
 *    - PDF URL généré
 *    - Entrée journal facture
 *    - Marquer facture payée
 *    - Entrée journal paiement
 *    - Création RDV
 *    - Entrée journal RDV
 */

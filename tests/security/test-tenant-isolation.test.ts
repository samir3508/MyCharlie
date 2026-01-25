/**
 * Tests de sécurité : Isolation tenant
 * Vérifie que les utilisateurs ne peuvent pas accéder aux données d'autres tenants
 */

import { createClient } from '@supabase/supabase-js'
import { describe, it, expect, beforeAll } from 'vitest'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Créer 2 clients Supabase pour simuler 2 utilisateurs
const supabaseUserA = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseUserB = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

describe('Isolation Tenant - RLS Security', () => {
  let userAId: string
  let userBId: string
  let tenantAId: string
  let tenantBId: string
  let clientAId: string

  beforeAll(async () => {
    // Créer 2 utilisateurs de test
    const emailA = `test-a-${Date.now()}@example.com`
    const emailB = `test-b-${Date.now()}@example.com`
    const password = 'TestPassword123!@#'

    // User A
    const { data: dataA, error: errorA } = await supabaseUserA.auth.signUp({
      email: emailA,
      password: password,
    })
    if (errorA) throw errorA
    userAId = dataA.user!.id

    // User B
    const { data: dataB, error: errorB } = await supabaseUserB.auth.signUp({
      email: emailB,
      password: password,
    })
    if (errorB) throw errorB
    userBId = dataB.user!.id

    // Récupérer les tenant_id
    const { data: tenantA } = await supabaseUserA
      .from('tenants')
      .select('id')
      .eq('user_id', userAId)
      .single()
    tenantAId = tenantA!.id

    const { data: tenantB } = await supabaseUserB
      .from('tenants')
      .select('id')
      .eq('user_id', userBId)
      .single()
    tenantBId = tenantB!.id
  })

  describe('Table clients', () => {
    it('User A peut créer un client', async () => {
      const { data, error } = await supabaseUserA
        .from('clients')
        .insert({
          tenant_id: tenantAId,
          nom: 'Dupont',
          prenom: 'Jean',
          email: 'jean.dupont@example.com',
          telephone: '0612345678',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.tenant_id).toBe(tenantAId)
      clientAId = data.id
    })

    it('User A peut lire son propre client', async () => {
      const { data, error } = await supabaseUserA
        .from('clients')
        .select('*')
        .eq('id', clientAId)
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data.id).toBe(clientAId)
    })

    it('User B NE PEUT PAS lire le client de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('clients')
        .select('*')
        .eq('id', clientAId)
        .maybeSingle()

      // Devrait retourner null (aucun résultat) car RLS bloque l'accès
      expect(data).toBeNull()
    })

    it('User B NE PEUT PAS modifier le client de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('clients')
        .update({ nom: 'HACKED' })
        .eq('id', clientAId)
        .select()

      // Devrait retourner un tableau vide (aucune ligne modifiée)
      expect(data).toHaveLength(0)
    })

    it('User B NE PEUT PAS supprimer le client de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('clients')
        .delete()
        .eq('id', clientAId)
        .select()

      // Devrait retourner un tableau vide (aucune ligne supprimée)
      expect(data).toHaveLength(0)
    })
  })

  describe('Table dossiers', () => {
    let dossierAId: string

    it('User A peut créer un dossier', async () => {
      const { data, error } = await supabaseUserA
        .from('dossiers')
        .insert({
          tenant_id: tenantAId,
          client_id: clientAId,
          numero: `DOS-TEST-${Date.now()}`,
          titre: 'Test dossier',
          statut: 'contact_recu',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      dossierAId = data.id
    })

    it('User B NE PEUT PAS lire le dossier de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('dossiers')
        .select('*')
        .eq('id', dossierAId)
        .maybeSingle()

      expect(data).toBeNull()
    })
  })

  describe('Table devis', () => {
    let devisAId: string

    it('User A peut créer un devis', async () => {
      const { data, error } = await supabaseUserA
        .from('devis')
        .insert({
          tenant_id: tenantAId,
          client_id: clientAId,
          numero: `DV-TEST-${Date.now()}`,
          titre: 'Test devis',
          montant_ht: 1000,
          montant_tva: 200,
          montant_ttc: 1200,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      devisAId = data.id
    })

    it('User B NE PEUT PAS lire le devis de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('devis')
        .select('*')
        .eq('id', devisAId)
        .maybeSingle()

      expect(data).toBeNull()
    })
  })

  describe('Table factures', () => {
    let factureAId: string

    it('User A peut créer une facture', async () => {
      const { data, error } = await supabaseUserA
        .from('factures')
        .insert({
          tenant_id: tenantAId,
          client_id: clientAId,
          numero: `FA-TEST-${Date.now()}`,
          titre: 'Test facture',
          montant_ht: 1000,
          montant_tva: 200,
          montant_ttc: 1200,
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      factureAId = data.id
    })

    it('User B NE PEUT PAS lire la facture de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('factures')
        .select('*')
        .eq('id', factureAId)
        .maybeSingle()

      expect(data).toBeNull()
    })
  })

  describe('Table rdv', () => {
    let rdvAId: string
    let dossierAId: string

    it('Setup - Créer un dossier pour User A', async () => {
      const { data } = await supabaseUserA
        .from('dossiers')
        .insert({
          tenant_id: tenantAId,
          client_id: clientAId,
          numero: `DOS-RDV-${Date.now()}`,
          titre: 'Test dossier RDV',
          statut: 'contact_recu',
        })
        .select()
        .single()

      dossierAId = data!.id
    })

    it('User A peut créer un RDV', async () => {
      const { data, error } = await supabaseUserA
        .from('rdv')
        .insert({
          tenant_id: tenantAId,
          dossier_id: dossierAId,
          client_id: clientAId,
          titre: 'Test RDV',
          date_heure: new Date().toISOString(),
          type_rdv: 'visite',
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      rdvAId = data.id
    })

    it('User B NE PEUT PAS lire le RDV de User A', async () => {
      const { data, error } = await supabaseUserB
        .from('rdv')
        .select('*')
        .eq('id', rdvAId)
        .maybeSingle()

      expect(data).toBeNull()
    })
  })

  describe('Nettoyage', () => {
    it('Nettoyer les données de test', async () => {
      // Supprimer les clients de test (cascade supprimera tout le reste)
      await supabaseUserA
        .from('clients')
        .delete()
        .eq('tenant_id', tenantAId)

      await supabaseUserB
        .from('clients')
        .delete()
        .eq('tenant_id', tenantBId)

      // Note : Les tenants et users de test resteront dans la base
      // Pour les supprimer, il faut passer par Supabase Dashboard
    })
  })
})

/**
 * INSTRUCTIONS POUR LANCER LES TESTS
 * 
 * 1. Installer Vitest si pas déjà fait :
 *    npm install -D vitest @vitest/ui
 * 
 * 2. Créer vitest.config.ts à la racine :
 *    import { defineConfig } from 'vitest/config'
 *    export default defineConfig({
 *      test: {
 *        globals: true,
 *        environment: 'node',
 *        setupFiles: ['./tests/setup.ts'],
 *      },
 *    })
 * 
 * 3. Créer tests/setup.ts :
 *    import { config } from 'dotenv'
 *    config({ path: '.env.local' })
 * 
 * 4. Ajouter script dans package.json :
 *    "test": "vitest",
 *    "test:ui": "vitest --ui"
 * 
 * 5. Lancer les tests :
 *    npm test tests/security/test-tenant-isolation.test.ts
 * 
 * 6. Résultat attendu :
 *    ✅ 13 tests passent
 *    ❌ 0 tests échouent
 */

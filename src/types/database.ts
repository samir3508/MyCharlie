export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents_config: {
        Row: {
          charlie_actif: boolean | null
          charlie_instructions: string | null
          charlie_nom: string | null
          charlie_ton: 'formel' | 'informel' | 'amical' | null
          created_at: string | null
          horaire_debut: string | null
          horaire_fin: string | null
          id: string
          jours_travail: string[] | null
          leo_actif: boolean | null
          leo_instructions: string | null
          leo_nom: string | null
          leo_ton: 'formel' | 'informel' | 'amical' | null
          message_hors_horaires: string | null
          notification_matin_active: boolean | null
          notification_matin_heure: string | null
          reponse_auto_hors_horaires: boolean | null
          template_devis_cree: string | null
          template_devis_envoye: string | null
          template_facture_envoyee: string | null
          template_post_visite: string | null
          template_rappel_rdv: string | null
          template_relance_paiement: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          charlie_actif?: boolean | null
          charlie_instructions?: string | null
          charlie_nom?: string | null
          charlie_ton?: 'formel' | 'informel' | 'amical' | null
          created_at?: string | null
          horaire_debut?: string | null
          horaire_fin?: string | null
          id?: string
          jours_travail?: string[] | null
          leo_actif?: boolean | null
          leo_instructions?: string | null
          leo_nom?: string | null
          leo_ton?: 'formel' | 'informel' | 'amical' | null
          message_hors_horaires?: string | null
          notification_matin_active?: boolean | null
          notification_matin_heure?: string | null
          reponse_auto_hors_horaires?: boolean | null
          template_devis_cree?: string | null
          template_devis_envoye?: string | null
          template_facture_envoyee?: string | null
          template_post_visite?: string | null
          template_rappel_rdv?: string | null
          template_relance_paiement?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          charlie_actif?: boolean | null
          charlie_instructions?: string | null
          charlie_nom?: string | null
          charlie_ton?: 'formel' | 'informel' | 'amical' | null
          created_at?: string | null
          horaire_debut?: string | null
          horaire_fin?: string | null
          id?: string
          jours_travail?: string[] | null
          leo_actif?: boolean | null
          leo_instructions?: string | null
          leo_nom?: string | null
          leo_ton?: 'formel' | 'informel' | 'amical' | null
          message_hors_horaires?: string | null
          notification_matin_active?: boolean | null
          notification_matin_heure?: string | null
          reponse_auto_hors_horaires?: boolean | null
          template_devis_cree?: string | null
          template_devis_envoye?: string | null
          template_facture_envoyee?: string | null
          template_post_visite?: string | null
          template_rappel_rdv?: string | null
          template_relance_paiement?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
      }
      tenants: {
        Row: {
          id: string
          user_id: string
          company_name: string
          siret: string | null
          address: string | null
          phone: string | null
          whatsapp_phone: string | null
          email: string | null
          logo_url: string | null
          tva_intra: string | null
          iban: string | null
          bic: string | null
          legal_mentions: string | null
          subscription_status: 'trial' | 'active' | 'cancelled' | null
          subscription_plan: 'starter' | 'pro' | 'enterprise' | null
          trial_ends_at: string | null
          n8n_workflow_id: string | null
          n8n_webhook_url: string | null
          whatsapp_connected: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          siret?: string | null
          address?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          logo_url?: string | null
          tva_intra?: string | null
          iban?: string | null
          bic?: string | null
          legal_mentions?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled' | null
          subscription_plan?: 'starter' | 'pro' | 'enterprise' | null
          trial_ends_at?: string | null
          n8n_workflow_id?: string | null
          n8n_webhook_url?: string | null
          whatsapp_connected?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          siret?: string | null
          address?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          email?: string | null
          logo_url?: string | null
          tva_intra?: string | null
          iban?: string | null
          bic?: string | null
          legal_mentions?: string | null
          subscription_status?: 'trial' | 'active' | 'cancelled' | null
          subscription_plan?: 'starter' | 'pro' | 'enterprise' | null
          trial_ends_at?: string | null
          n8n_workflow_id?: string | null
          n8n_webhook_url?: string | null
          whatsapp_connected?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          prenom: string
          nom_complet: string | null
          email: string | null
          telephone: string | null
          adresse_facturation: string | null
          adresse_chantier: string | null
          type: 'particulier' | 'professionnel' | null
          nb_devis: number | null
          nb_factures: number | null
          ca_total: number | null
          notes: string | null
          tags: string[] | null
          source: 'whatsapp' | 'instagram' | 'appel' | 'email' | 'site_web' | 'bouche_a_oreille' | 'autre' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          prenom: string
          email?: string | null
          telephone?: string | null
          adresse_facturation?: string | null
          adresse_chantier?: string | null
          type?: 'particulier' | 'professionnel' | null
          nb_devis?: number | null
          nb_factures?: number | null
          ca_total?: number | null
          notes?: string | null
          tags?: string[] | null
          source?: 'whatsapp' | 'instagram' | 'appel' | 'email' | 'site_web' | 'bouche_a_oreille' | 'autre' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          prenom?: string
          email?: string | null
          telephone?: string | null
          adresse_facturation?: string | null
          adresse_chantier?: string | null
          type?: 'particulier' | 'professionnel' | null
          nb_devis?: number | null
          nb_factures?: number | null
          ca_total?: number | null
          notes?: string | null
          tags?: string[] | null
          source?: 'whatsapp' | 'instagram' | 'appel' | 'email' | 'site_web' | 'bouche_a_oreille' | 'autre' | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      // =====================================================
      // TABLES CHARLIE - Devis & Factures
      // =====================================================
      devis: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          dossier_id: string | null
          numero: string
          titre: string | null
          description: string | null
          adresse_chantier: string | null
          delai_execution: string | null
          montant_ht: number | null
          montant_tva: number | null
          montant_ttc: number | null
          statut: 'brouillon' | 'en_preparation' | 'pret' | 'envoye' | 'accepte' | 'refuse' | 'expire' | null
          template_condition_paiement_id: string | null
          date_creation: string | null
          date_envoi: string | null
          date_envoi_prevue: string | null
          date_acceptation: string | null
          date_expiration: string | null
          pdf_url: string | null
          notes: string | null
          rappel_envoi_envoye: boolean | null
          derniere_relance_client: string | null
          nb_relances: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          dossier_id?: string | null
          numero: string
          titre?: string | null
          description?: string | null
          adresse_chantier?: string | null
          delai_execution?: string | null
          montant_ht?: number | null
          montant_tva?: number | null
          montant_ttc?: number | null
          statut?: 'brouillon' | 'en_preparation' | 'pret' | 'envoye' | 'accepte' | 'refuse' | 'expire' | null
          template_condition_paiement_id?: string | null
          date_creation?: string | null
          date_envoi?: string | null
          date_envoi_prevue?: string | null
          date_acceptation?: string | null
          date_expiration?: string | null
          pdf_url?: string | null
          notes?: string | null
          rappel_envoi_envoye?: boolean | null
          derniere_relance_client?: string | null
          nb_relances?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          dossier_id?: string | null
          numero?: string
          titre?: string | null
          description?: string | null
          adresse_chantier?: string | null
          delai_execution?: string | null
          montant_ht?: number | null
          montant_tva?: number | null
          montant_ttc?: number | null
          statut?: 'brouillon' | 'en_preparation' | 'pret' | 'envoye' | 'accepte' | 'refuse' | 'expire' | null
          template_condition_paiement_id?: string | null
          date_creation?: string | null
          date_envoi?: string | null
          date_envoi_prevue?: string | null
          date_acceptation?: string | null
          date_expiration?: string | null
          pdf_url?: string | null
          notes?: string | null
          rappel_envoi_envoye?: boolean | null
          derniere_relance_client?: string | null
          nb_relances?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      lignes_devis: {
        Row: {
          id: string
          devis_id: string
          ordre: number
          designation: string
          description_detaillee: string | null
          quantite: number
          unite: string | null
          prix_unitaire_ht: number
          tva_pct: number | null
          total_ht: number | null
          total_tva: number | null
          total_ttc: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          devis_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite?: string | null
          prix_unitaire_ht: number
          tva_pct?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          devis_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string | null
          prix_unitaire_ht?: number
          tva_pct?: number | null
          created_at?: string | null
        }
      }
      factures: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          devis_id: string | null
          dossier_id: string | null
          numero: string
          titre: string | null
          description: string | null
          montant_ht: number | null
          montant_tva: number | null
          montant_ttc: number | null
          statut: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | null
          date_emission: string | null
          date_echeance: string | null
          date_paiement: string | null
          pdf_url: string | null
          notes: string | null
          rappel_envoi_envoye: boolean | null
          derniere_relance: string | null
          nb_relances: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          devis_id?: string | null
          dossier_id?: string | null
          numero: string
          titre?: string | null
          description?: string | null
          montant_ht?: number | null
          montant_tva?: number | null
          montant_ttc?: number | null
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | null
          date_emission?: string | null
          date_echeance?: string | null
          date_paiement?: string | null
          pdf_url?: string | null
          notes?: string | null
          rappel_envoi_envoye?: boolean | null
          derniere_relance?: string | null
          nb_relances?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          devis_id?: string | null
          dossier_id?: string | null
          numero?: string
          titre?: string | null
          description?: string | null
          montant_ht?: number | null
          montant_tva?: number | null
          montant_ttc?: number | null
          statut?: 'brouillon' | 'envoyee' | 'payee' | 'en_retard' | null
          date_emission?: string | null
          date_echeance?: string | null
          date_paiement?: string | null
          pdf_url?: string | null
          notes?: string | null
          rappel_envoi_envoye?: boolean | null
          derniere_relance?: string | null
          nb_relances?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      lignes_factures: {
        Row: {
          id: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee: string | null
          quantite: number
          unite: string | null
          prix_unitaire_ht: number
          tva_pct: number | null
          total_ht: number | null
          total_tva: number | null
          total_ttc: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          facture_id: string
          ordre: number
          designation: string
          description_detaillee?: string | null
          quantite: number
          unite?: string | null
          prix_unitaire_ht: number
          tva_pct?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          facture_id?: string
          ordre?: number
          designation?: string
          description_detaillee?: string | null
          quantite?: number
          unite?: string | null
          prix_unitaire_ht?: number
          tva_pct?: number | null
          created_at?: string | null
        }
      }
      relances: {
        Row: {
          id: string
          tenant_id: string
          facture_id: string | null
          devis_id: string | null
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau: number | null
          statut: 'planifie' | 'envoye' | 'reussi' | 'echoue' | null
          date_prevue: string | null
          date_envoi: string | null
          objet: string | null
          message: string | null
          erreur: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          facture_id?: string | null
          devis_id?: string | null
          type: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau?: number | null
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue' | null
          date_prevue?: string | null
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          facture_id?: string | null
          devis_id?: string | null
          type?: 'email' | 'whatsapp' | 'sms' | 'call'
          niveau?: number | null
          statut?: 'planifie' | 'envoye' | 'reussi' | 'echoue' | null
          date_prevue?: string | null
          date_envoi?: string | null
          objet?: string | null
          message?: string | null
          erreur?: string | null
          created_at?: string | null
        }
      }
      templates_conditions_paiement: {
        Row: {
          id: string
          tenant_id: string
          nom: string
          description: string | null
          montant_min: number | null
          montant_max: number | null
          pourcentage_acompte: number | null
          pourcentage_intermediaire: number | null
          pourcentage_solde: number | null
          delai_acompte: number | null
          delai_intermediaire: number | null
          delai_solde: number | null
          is_default: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          nom: string
          description?: string | null
          montant_min?: number | null
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number | null
          delai_intermediaire?: number | null
          delai_solde?: number | null
          is_default?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          nom?: string
          description?: string | null
          montant_min?: number | null
          montant_max?: number | null
          pourcentage_acompte?: number | null
          pourcentage_intermediaire?: number | null
          pourcentage_solde?: number | null
          delai_acompte?: number | null
          delai_intermediaire?: number | null
          delai_solde?: number | null
          is_default?: boolean | null
          created_at?: string | null
        }
      }
      // =====================================================
      // TABLES LÉO - Dossiers, RDV, Fiches Visite
      // =====================================================
      dossiers: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          numero: string
          titre: string
          description: string | null
          adresse_chantier: string | null
          statut: 'contact_recu' | 'qualification' | 'rdv_a_planifier' | 'rdv_planifie' | 'rdv_confirme' | 'visite_realisee' | 'devis_en_cours' | 'devis_pret' | 'devis_envoye' | 'en_negociation' | 'signe' | 'chantier_en_cours' | 'chantier_termine' | 'perdu' | 'annule' | 'facture_a_creer' | 'facture_envoyee' | 'facture_en_retard' | 'facture_payee' | null
          source: 'whatsapp' | 'instagram' | 'appel' | 'email' | 'site_web' | 'bouche_a_oreille' | 'autre' | null
          type_travaux: string | null
          montant_estime: number | null
          priorite: 'basse' | 'normale' | 'haute' | 'urgente' | null
          date_contact: string | null
          date_souhaitee_devis: string | null
          date_cloture: string | null
          devis_cree: boolean | null
          devis_envoye: boolean | null
          derniere_relance_devis: string | null
          nb_relances_artisan: number | null
          notes: string | null
          tags: string[] | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id: string
          numero: string
          titre: string
          description?: string | null
          adresse_chantier?: string | null
          statut?: 'contact_recu' | 'qualification' | 'rdv_a_planifier' | 'rdv_planifie' | 'rdv_confirme' | 'visite_realisee' | 'devis_en_cours' | 'devis_pret' | 'devis_envoye' | 'en_negociation' | 'signe' | 'perdu' | 'annule' | 'facture_a_creer' | 'facture_envoyee' | 'facture_en_retard' | 'facture_payee' | null
          source?: 'whatsapp' | 'instagram' | 'appel' | 'email' | 'site_web' | 'bouche_a_oreille' | 'autre' | null
          type_travaux?: string | null
          montant_estime?: number | null
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente' | null
          date_contact?: string | null
          date_souhaitee_devis?: string | null
          date_cloture?: string | null
          devis_cree?: boolean | null
          devis_envoye?: boolean | null
          derniere_relance_devis?: string | null
          nb_relances_artisan?: number | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string
          numero?: string
          titre?: string
          description?: string | null
          adresse_chantier?: string | null
          statut?: 'contact_recu' | 'qualification' | 'rdv_a_planifier' | 'rdv_planifie' | 'rdv_confirme' | 'visite_realisee' | 'devis_en_cours' | 'devis_pret' | 'devis_envoye' | 'en_negociation' | 'signe' | 'perdu' | 'annule' | 'facture_a_creer' | 'facture_envoyee' | 'facture_en_retard' | 'facture_payee' | null
          source?: 'whatsapp' | 'instagram' | 'appel' | 'email' | 'site_web' | 'bouche_a_oreille' | 'autre' | null
          type_travaux?: string | null
          montant_estime?: number | null
          priorite?: 'basse' | 'normale' | 'haute' | 'urgente' | null
          date_contact?: string | null
          date_souhaitee_devis?: string | null
          date_cloture?: string | null
          devis_cree?: boolean | null
          devis_envoye?: boolean | null
          derniere_relance_devis?: string | null
          nb_relances_artisan?: number | null
          notes?: string | null
          tags?: string[] | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      rdv: {
        Row: {
          id: string
          tenant_id: string
          dossier_id: string
          client_id: string | null
          titre: string | null
          type_rdv: 'appel' | 'visite' | 'chantier' | 'reunion' | 'signature' | 'autre' | null
          date_heure: string
          duree_minutes: number | null
          adresse: string | null
          notes_acces: string | null
          statut: 'planifie' | 'confirme' | 'en_cours' | 'realise' | 'annule' | 'reporte' | null
          rappel_j1_envoye: boolean | null
          rappel_jour_j_envoye: boolean | null
          rappel_2h_envoye: boolean | null
          confirmation_client: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          dossier_id: string
          client_id?: string | null
          titre?: string | null
          type_rdv?: 'appel' | 'visite' | 'chantier' | 'reunion' | 'signature' | 'autre' | null
          date_heure: string
          duree_minutes?: number | null
          adresse?: string | null
          notes_acces?: string | null
          statut?: 'planifie' | 'confirme' | 'en_cours' | 'realise' | 'annule' | 'reporte' | null
          rappel_j1_envoye?: boolean | null
          rappel_jour_j_envoye?: boolean | null
          rappel_2h_envoye?: boolean | null
          confirmation_client?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          dossier_id?: string
          client_id?: string | null
          titre?: string | null
          type_rdv?: 'appel' | 'visite' | 'chantier' | 'reunion' | 'signature' | 'autre' | null
          date_heure?: string
          duree_minutes?: number | null
          adresse?: string | null
          notes_acces?: string | null
          statut?: 'planifie' | 'confirme' | 'en_cours' | 'realise' | 'annule' | 'reporte' | null
          rappel_j1_envoye?: boolean | null
          rappel_jour_j_envoye?: boolean | null
          rappel_2h_envoye?: boolean | null
          confirmation_client?: boolean | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      fiches_visite: {
        Row: {
          id: string
          tenant_id: string
          dossier_id: string
          rdv_id: string | null
          date_visite: string | null
          duree_visite_minutes: number | null
          constat: string | null
          constat_vocal_url: string | null
          constat_structure: Json | null
          surface_m2: number | null
          nombre_pieces: number | null
          etage: string | null
          accessibilite: string | null
          etat_general: 'bon' | 'moyen' | 'mauvais' | 'a_renover' | null
          travaux_identifies: string[] | null
          materiaux_necessaires: string[] | null
          difficultes: string | null
          estimation_heures: number | null
          estimation_cout: number | null
          photos_urls: string[] | null
          valide_par_artisan: boolean | null
          date_validation: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
          // Nouveaux champs UX
          type_visite: 'premiere_visite' | 'contre_visite' | 'reception' | null
          urgence: 'basse' | 'normale' | 'haute' | 'critique' | null
          presence_client: boolean | null
          contraintes_techniques: string | null
          contraintes_client: string | null
          preconisations: string | null
          complexite: 'simple' | 'moyenne' | 'complexe' | null
          devis_a_faire_avant: string | null
          priorite: 'basse' | 'normale' | 'haute' | null
          hauteur_plafond: number | null
          longueur: number | null
          largeur: number | null
          autres_mesures: string | null
          budget_estime: string | null
          delai_souhaite: string | null
          sous_traitance_requise: boolean | null
          evacuation_dechets: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          dossier_id: string
          rdv_id?: string | null
          date_visite?: string | null
          duree_visite_minutes?: number | null
          constat?: string | null
          constat_vocal_url?: string | null
          constat_structure?: Json | null
          surface_m2?: number | null
          nombre_pieces?: number | null
          etage?: string | null
          accessibilite?: string | null
          etat_general?: 'bon' | 'moyen' | 'mauvais' | 'a_renover' | null
          travaux_identifies?: string[] | null
          materiaux_necessaires?: string[] | null
          difficultes?: string | null
          estimation_heures?: number | null
          estimation_cout?: number | null
          photos_urls?: string[] | null
          valide_par_artisan?: boolean | null
          date_validation?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          // Nouveaux champs UX
          type_visite?: 'premiere_visite' | 'contre_visite' | 'reception' | null
          urgence?: 'basse' | 'normale' | 'haute' | 'critique' | null
          presence_client?: boolean | null
          contraintes_techniques?: string | null
          contraintes_client?: string | null
          preconisations?: string | null
          complexite?: 'simple' | 'moyenne' | 'complexe' | null
          devis_a_faire_avant?: string | null
          priorite?: 'basse' | 'normale' | 'haute' | null
          hauteur_plafond?: number | null
          longueur?: number | null
          largeur?: number | null
          autres_mesures?: string | null
          budget_estime?: string | null
          delai_souhaite?: string | null
          sous_traitance_requise?: boolean | null
          evacuation_dechets?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          dossier_id?: string
          rdv_id?: string | null
          date_visite?: string | null
          duree_visite_minutes?: number | null
          constat?: string | null
          constat_vocal_url?: string | null
          constat_structure?: Json | null
          surface_m2?: number | null
          nombre_pieces?: number | null
          etage?: string | null
          accessibilite?: string | null
          etat_general?: 'bon' | 'moyen' | 'mauvais' | 'a_renover' | null
          travaux_identifies?: string[] | null
          materiaux_necessaires?: string[] | null
          difficultes?: string | null
          estimation_heures?: number | null
          estimation_cout?: number | null
          photos_urls?: string[] | null
          valide_par_artisan?: boolean | null
          date_validation?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          // Nouveaux champs UX
          type_visite?: 'premiere_visite' | 'contre_visite' | 'reception' | null
          urgence?: 'basse' | 'normale' | 'haute' | 'critique' | null
          presence_client?: boolean | null
          contraintes_techniques?: string | null
          contraintes_client?: string | null
          preconisations?: string | null
          complexite?: 'simple' | 'moyenne' | 'complexe' | null
          devis_a_faire_avant?: string | null
          priorite?: 'basse' | 'normale' | 'haute' | null
          hauteur_plafond?: number | null
          longueur?: number | null
          largeur?: number | null
          autres_mesures?: string | null
          budget_estime?: string | null
          delai_souhaite?: string | null
          sous_traitance_requise?: boolean | null
          evacuation_dechets?: string | null
        }
      }
      journal_dossier: {
        Row: {
          id: string
          tenant_id: string
          dossier_id: string
          type: 'creation' | 'changement_statut' | 'note' | 'action_leo' | 'action_charlie' | 'rappel' | 'message_client' | 'message_artisan' | 'rdv_cree' | 'rdv_modifie' | 'visite' | 'devis' | 'facture' | 'paiement' | 'autre'
          titre: string | null
          contenu: string | null
          ancien_statut: string | null
          nouveau_statut: string | null
          metadata: Json | null
          auteur: 'systeme' | 'artisan' | 'leo' | 'charlie' | 'client' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          dossier_id: string
          type: 'creation' | 'changement_statut' | 'note' | 'action_leo' | 'action_charlie' | 'rappel' | 'message_client' | 'message_artisan' | 'rdv_cree' | 'rdv_modifie' | 'visite' | 'devis' | 'facture' | 'paiement' | 'autre'
          titre?: string | null
          contenu?: string | null
          ancien_statut?: string | null
          nouveau_statut?: string | null
          metadata?: Json | null
          auteur?: 'systeme' | 'artisan' | 'leo' | 'charlie' | 'client' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          dossier_id?: string
          type?: 'creation' | 'changement_statut' | 'note' | 'action_leo' | 'action_charlie' | 'rappel' | 'message_client' | 'message_artisan' | 'rdv_cree' | 'rdv_modifie' | 'visite' | 'devis' | 'facture' | 'paiement' | 'autre'
          titre?: string | null
          contenu?: string | null
          ancien_statut?: string | null
          nouveau_statut?: string | null
          metadata?: Json | null
          auteur?: 'systeme' | 'artisan' | 'leo' | 'charlie' | 'client' | null
          created_at?: string | null
        }
      }
      // =====================================================
      // TABLES CONVERSATIONS
      // =====================================================
      conversations: {
        Row: {
          id: string
          tenant_id: string
          client_id: string | null
          dossier_id: string | null
          whatsapp_phone: string | null
          whatsapp_name: string | null
          last_message: string | null
          last_message_at: string | null
          is_read: boolean | null
          agent_actif: 'charlie' | 'leo' | 'manuel' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          client_id?: string | null
          dossier_id?: string | null
          whatsapp_phone?: string | null
          whatsapp_name?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean | null
          agent_actif?: 'charlie' | 'leo' | 'manuel' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          client_id?: string | null
          dossier_id?: string | null
          whatsapp_phone?: string | null
          whatsapp_name?: string | null
          last_message?: string | null
          last_message_at?: string | null
          is_read?: boolean | null
          agent_actif?: 'charlie' | 'leo' | 'manuel' | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      conversation_state: {
        Row: {
          id: string
          conversation_id: string
          tenant_id: string
          current_step: 'ASK_CLIENT' | 'ASK_PRESTATIONS' | 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | 'ASK_DOSSIER_INFO' | 'ASK_RDV_DATE' | 'ASK_RDV_CONFIRM' | 'POST_VISITE' | 'ASK_FICHE_VISITE' | null
          action_type: 'create_devis' | 'create_facture' | 'search_client' | 'create_dossier' | 'planifier_rdv' | 'creer_fiche_visite' | 'relance' | null
          collected_data: Json | null
          missing_fields: string[] | null
          last_user_message: string | null
          last_agent_response: string | null
          pending_confirmation: boolean | null
          confirmation_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          tenant_id: string
          current_step?: 'ASK_CLIENT' | 'ASK_PRESTATIONS' | 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | 'ASK_DOSSIER_INFO' | 'ASK_RDV_DATE' | 'ASK_RDV_CONFIRM' | 'POST_VISITE' | 'ASK_FICHE_VISITE' | null
          action_type?: 'create_devis' | 'create_facture' | 'search_client' | 'create_dossier' | 'planifier_rdv' | 'creer_fiche_visite' | 'relance' | null
          collected_data?: Json | null
          missing_fields?: string[] | null
          last_user_message?: string | null
          last_agent_response?: string | null
          pending_confirmation?: boolean | null
          confirmation_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          tenant_id?: string
          current_step?: 'ASK_CLIENT' | 'ASK_PRESTATIONS' | 'ASK_DELAY' | 'ASK_ADDRESS' | 'CONFIRMATION' | 'READY_TO_CREATE' | 'ASK_DOSSIER_INFO' | 'ASK_RDV_DATE' | 'ASK_RDV_CONFIRM' | 'POST_VISITE' | 'ASK_FICHE_VISITE' | null
          action_type?: 'create_devis' | 'create_facture' | 'search_client' | 'create_dossier' | 'planifier_rdv' | 'creer_fiche_visite' | 'relance' | null
          collected_data?: Json | null
          missing_fields?: string[] | null
          last_user_message?: string | null
          last_agent_response?: string | null
          pending_confirmation?: boolean | null
          confirmation_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url: string | null
          media_type: string | null
          agent: 'charlie' | 'leo' | 'artisan' | 'client' | null
          statut: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: 'inbound' | 'outbound'
          message: string
          media_url?: string | null
          media_type?: string | null
          agent?: 'charlie' | 'leo' | 'artisan' | 'client' | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          direction?: 'inbound' | 'outbound'
          message?: string
          media_url?: string | null
          media_type?: string | null
          agent?: 'charlie' | 'leo' | 'artisan' | 'client' | null
          statut?: 'sent' | 'delivered' | 'read' | 'failed' | null
          created_at?: string | null
        }
      }
      notifications_matin: {
        Row: {
          id: string
          tenant_id: string
          date_notification: string | null
          heure_envoi: string | null
          nb_devis_a_envoyer: number | null
          nb_devis_a_relancer: number | null
          nb_factures_en_attente: number | null
          nb_paiements_a_suivre: number | null
          nb_rdv_du_jour: number | null
          message_envoye: string | null
          statut: 'planifie' | 'envoye' | 'erreur' | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          date_notification?: string | null
          heure_envoi?: string | null
          nb_devis_a_envoyer?: number | null
          nb_devis_a_relancer?: number | null
          nb_factures_en_attente?: number | null
          nb_paiements_a_suivre?: number | null
          nb_rdv_du_jour?: number | null
          message_envoye?: string | null
          statut?: 'planifie' | 'envoye' | 'erreur' | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          date_notification?: string | null
          heure_envoi?: string | null
          nb_devis_a_envoyer?: number | null
          nb_devis_a_relancer?: number | null
          nb_factures_en_attente?: number | null
          nb_paiements_a_suivre?: number | null
          nb_rdv_du_jour?: number | null
          message_envoye?: string | null
          statut?: 'planifie' | 'envoye' | 'erreur' | null
          created_at?: string | null
        }
      }
      n8n_chat_histories: {
        Row: {
          id: string
          tenant_id: string | null
          session_id: string
          message: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          session_id: string
          message: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          session_id?: string
          message?: Json
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_devis_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_facture_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_dossier_numero: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_user_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// =====================================================
// TYPE ALIASES - Raccourcis pratiques
// =====================================================

// Base
export type Tenant = Tables<'tenants'>
export type Client = Tables<'clients'>

// Charlie - Devis & Factures
export type Devis = Tables<'devis'>
export type LigneDevis = Tables<'lignes_devis'>
export type Facture = Tables<'factures'>
export type LigneFacture = Tables<'lignes_factures'>
export type Relance = Tables<'relances'>
export type TemplateConditionPaiement = Tables<'templates_conditions_paiement'>

// Léo - Dossiers & Visites
export type Dossier = Tables<'dossiers'>
export type Rdv = Tables<'rdv'>
export type FicheVisite = Tables<'fiches_visite'>
export type JournalDossier = Tables<'journal_dossier'>

// Conversations
export type Conversation = Tables<'conversations'>
export type ConversationState = Tables<'conversation_state'>
export type Message = Tables<'messages'>

// Config
export type AgentsConfig = Tables<'agents_config'>
export type NotificationMatin = Tables<'notifications_matin'>

// =====================================================
// STATUTS - Constantes pour les enums
// =====================================================

export const STATUTS_DOSSIER = [
  'contact_recu',
  'qualification',
  'rdv_a_planifier',
  'rdv_planifie',
  'rdv_confirme',
  'visite_realisee',
  'devis_en_cours',
  'devis_pret',
  'devis_envoye',
  'en_negociation',
  'signe',
  'chantier_en_cours',
  'chantier_termine',
  'perdu',
  'annule',
  'facture_a_creer',
  'facture_envoyee',
  'facture_en_retard',
  'facture_payee'
] as const

export const STATUTS_DEVIS = [
  'brouillon',
  'en_preparation',
  'pret',
  'envoye',
  'accepte',
  'refuse',
  'expire'
] as const

export const STATUTS_FACTURE = [
  'brouillon',
  'envoyee',
  'payee',
  'en_retard'
] as const

export const STATUTS_RDV = [
  'planifie',
  'confirme',
  'en_cours',
  'realise',
  'annule',
  'reporte'
] as const

export const TYPES_RDV = [
  'appel',
  'visite',
  'chantier',
  'reunion',
  'signature',
  'autre'
] as const

export const SOURCES_CLIENT = [
  'whatsapp',
  'instagram',
  'appel',
  'email',
  'site_web',
  'bouche_a_oreille',
  'autre'
] as const

export const PRIORITES = [
  'basse',
  'normale',
  'haute',
  'urgente'
] as const

// =====================================================
// LABELS - Pour l'affichage UI
// =====================================================

export const LABELS_STATUT_DOSSIER: Record<string, string> = {
  contact_recu: '📥 Contact reçu',
  qualification: '🔍 À qualifier',
  rdv_a_planifier: '📅 RDV à planifier',
  rdv_planifie: '📆 RDV planifié',
  rdv_confirme: '✅ RDV confirmé',
  visite_realisee: '🏠 Visite réalisée',
  devis_en_cours: '📝 Devis en préparation',
  chantier_en_cours: '🔨 Chantier en cours',
  chantier_termine: '✅ Chantier terminé',
  devis_pret: '📄 Devis prêt',
  devis_envoye: '📤 Devis envoyé',
  en_negociation: '💬 En négociation',
  signe: '🎉 Devis signé',
  perdu: '❌ Devis perdu',
  annule: '🚫 Annulé',
  facture_a_creer: '💰 Facture à créer',
  facture_envoyee: '📧 Facture envoyée',
  facture_en_retard: '⚠️ Facture en retard',
  facture_payee: '✅ Facture payée'
}

export const LABELS_STATUT_DEVIS: Record<string, string> = {
  brouillon: 'Brouillon',
  en_preparation: 'En préparation',
  pret: 'Prêt',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré'
}

export const LABELS_STATUT_FACTURE: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard'
}

export const LABELS_TYPE_RDV: Record<string, string> = {
  appel: '📞 Appel',
  visite: '🏠 Visite chantier',
  chantier: '🔧 Chantier',
  reunion: '👥 Réunion',
  signature: '✍️ Signature',
  autre: '📋 Autre'
}

export const LABELS_PRIORITE: Record<string, string> = {
  basse: '🟢 Basse',
  normale: '🔵 Normale',
  haute: '🟠 Haute',
  urgente: '🔴 Urgente'
}

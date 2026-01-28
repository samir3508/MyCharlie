'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Send, 
  Calendar,
  Euro,
  Bot
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'

export type ProchaineActionSummary = {
  action: string
  description: string
  urgence: 'urgente' | 'haute' | 'normale'
  dateLimite: Date | null
  icon: React.ReactNode
  couleur: string
  actionButton?: { label: string; href: string }
}

/** Logique partagée : résumé prochaine action pour liste + détail */
export function getProchaineActionSummary(dossier: any): ProchaineActionSummary | null {
  return calculerProchaineAction(dossier)
}

function calculerProchaineAction(dossier: any): ProchaineActionSummary | null {
    const statut = dossier.statut
    const rdv = (dossier.rdv as any[]) || []
    const devis = (dossier.devis as any[]) || []
    const factures = (dossier.factures as any[]) || []
    const journal = (dossier.journal_dossier as any[]) || []
    
    // Vérifier si des créneaux ont été envoyés récemment (dans le journal)
    // Chercher dans le journal une entrée récente (dernières 7 jours) indiquant l'envoi de créneaux
    const maintenant = new Date()
    const creneauxEnvoyes = journal.some((entry: any) => {
      if (!entry.created_at) return false
      const dateEntry = new Date(entry.created_at)
      const joursDepuis = (maintenant.getTime() - dateEntry.getTime()) / (1000 * 60 * 60 * 24)
      
      // Vérifier si l'entrée est récente (7 derniers jours) et concerne les créneaux
      return joursDepuis <= 7 && (
        (entry.titre && entry.titre.toLowerCase().includes('créneaux')) ||
        (entry.contenu && entry.contenu.toLowerCase().includes('créneaux')) ||
        (entry.type === 'action_leo' && entry.contenu && entry.contenu.includes('créneaux'))
      )
    })
    
    // Vérifier les factures en retard
    const facturesEnRetard = factures.filter((f: any) => {
      if (f.statut === 'en_retard') return true
      if (f.statut === 'envoyee' && f.date_echeance) {
        const echeance = new Date(f.date_echeance)
        return echeance < new Date() && f.statut !== 'payee'
      }
      return false
    })
    
    if (facturesEnRetard.length > 0) {
      const facture = facturesEnRetard[0]
      const echeance = facture.date_echeance ? new Date(facture.date_echeance) : null
      return {
        action: 'Relancer le paiement',
        description: `Facture ${facture.numero} en retard${echeance ? ` depuis ${formatDistanceToNow(echeance, { addSuffix: true, locale: fr })}` : ''}`,
        urgence: 'urgente' as const,
        dateLimite: echeance,
        icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
        couleur: 'bg-red-500/10 border-red-500/30 text-red-400',
        actionButton: {
          label: 'Relancer',
          href: `/factures/${facture.id}?action=relancer`
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ 0 : Gestion des phases chantier (après devis accepté)
    // Conditions de paiement : créer facture / acompte selon template, puis
    // "Lancer le chantier" seulement une fois l'acompte (ou facture comptant) payé.
    // ═══════════════════════════════════════════════════════════════════════
    const devisSigne = devis.find((d: any) => d.statut === 'accepte' || d.statut === 'signe')
    const template = devisSigne?.template_condition_paiement as { pourcentage_acompte?: number; pourcentage_solde?: number; nom?: string } | null
    const hasAcompteRequise = (template?.pourcentage_acompte ?? 0) > 0
    const factureAcompte = factures.find((f: any) => f.numero?.endsWith('-A'))
    const factureSolde = factures.find((f: any) => f.numero?.endsWith('-S'))
    const factureAcomptePayee = factureAcompte?.statut === 'payee'
    
    // Devis signé : facture / acompte d'abord, puis chantier
    if (devisSigne && statut === 'signe') {
      // 0 facture → créer facture (acompte ou comptant) selon template
      if (factures.length === 0) {
        if (hasAcompteRequise) {
          const isComptant = (template?.pourcentage_acompte ?? 0) >= 100
          return {
            action: isComptant ? 'Créer la facture' : 'Créer la facture d\'acompte',
            description: isComptant
              ? `Devis ${devisSigne.numero} signé. Créer la facture (comptant) selon les conditions de paiement "${template?.nom ?? ''}".`
              : `Devis ${devisSigne.numero} signé. Créer la facture d'acompte (${template?.pourcentage_acompte}%) selon le template "${template?.nom ?? ''}", puis lancer le chantier une fois l'acompte payé.`,
            urgence: 'haute' as const,
            dateLimite: null,
            icon: <Euro className="w-5 h-5 text-orange-400" />,
            couleur: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
            actionButton: {
              label: isComptant ? 'Créer facture' : 'Créer facture d\'acompte',
              href: `/devis/${devisSigne.id}`
            }
          }
        }
        // Template absent (ex. liste/kanban) → prudence : créer facture d'abord
        if (template == null && devisSigne) {
          return {
            action: 'Créer la facture',
            description: `Devis ${devisSigne.numero} signé. Créer la facture ou l'acompte selon les conditions de paiement du devis.`,
            urgence: 'haute' as const,
            dateLimite: null,
            icon: <Euro className="w-5 h-5 text-orange-400" />,
            couleur: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
            actionButton: {
              label: 'Voir le devis',
              href: `/devis/${devisSigne.id}`
            }
          }
        }
        // Pas d'acompte (100 % solde) → lancer le chantier directement
        return {
          action: 'Lancer le chantier',
          description: `Devis ${devisSigne.numero} signé. Aucun acompte prévu (solde en fin de chantier). Vous pouvez démarrer les travaux.`,
          urgence: 'haute' as const,
          dateLimite: null,
          icon: <FileText className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Lancer le chantier',
            href: `/dossiers/${dossier.id}?action=demarrer_chantier`
          }
        }
      }
      // Acompte créé mais pas payé
      if (hasAcompteRequise && factureAcompte && !factureAcomptePayee) {
        return {
          action: 'En attente du paiement de l\'acompte',
          description: `Facture ${factureAcompte.numero} créée. Une fois l'acompte payé, vous pourrez lancer le chantier.`,
          urgence: 'normale' as const,
          dateLimite: factureAcompte.date_echeance ? new Date(factureAcompte.date_echeance) : null,
          icon: <Clock className="w-5 h-5 text-amber-400" />,
          couleur: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          actionButton: {
            label: 'Voir la facture',
            href: `/factures/${factureAcompte.id}`
          }
        }
      }
      // Acompte payé (ou comptant payé) ou pas d'acompte → lancer le chantier
      if (factureAcomptePayee || !hasAcompteRequise) {
        return {
          action: 'Lancer le chantier',
          description: hasAcompteRequise
            ? `Acompte payé. Devis ${devisSigne.numero} – vous pouvez démarrer les travaux.`
            : `Devis ${devisSigne.numero} signé – démarrer les travaux.`,
          urgence: 'haute' as const,
          dateLimite: null,
          icon: <FileText className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Lancer le chantier',
            href: `/dossiers/${dossier.id}?action=demarrer_chantier`
          }
        }
      }
    }
    
    // Si chantier en cours → Terminer le chantier
    if (statut === 'chantier_en_cours') {
      const hasSolde = (template?.pourcentage_solde ?? 0) > 0
      return {
        action: 'Terminer le chantier',
        description: hasSolde
          ? 'Travaux en cours. Terminer le chantier, puis créer la facture de solde.'
          : 'Travaux en cours, terminer le chantier pour créer la facture.',
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
        couleur: 'bg-green-500/10 border-green-500/30 text-green-400',
        actionButton: {
          label: 'Terminer chantier',
          href: `/dossiers/${dossier.id}?action=terminer_chantier`
        }
      }
    }
    
    // Si chantier terminé : créer facture de solde (ou facture si 100 % solde)
    if (statut === 'chantier_termine') {
      const hasSoldeRequise = (template?.pourcentage_solde ?? 0) > 0
      if (hasSoldeRequise && !factureSolde) {
        return {
          action: 'Créer la facture de solde',
          description: `Chantier terminé. Créer la facture de solde (${template?.pourcentage_solde}%) selon les conditions de paiement.`,
          urgence: 'haute' as const,
          dateLimite: null,
          icon: <Euro className="w-5 h-5 text-orange-400" />,
          couleur: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          actionButton: {
            label: 'Créer facture de solde',
            href: devisSigne ? `/devis/${devisSigne.id}` : `/factures/nouveau?dossier_id=${dossier.id}`
          }
        }
      }
      if (!hasSoldeRequise && factures.length === 0) {
        return {
          action: 'Créer la facture',
          description: `Chantier terminé, créer la facture${devisSigne ? ` pour le devis ${devisSigne.numero || devisSigne.id.substring(0, 8)}` : ''}`,
          urgence: 'haute' as const,
          dateLimite: null,
          icon: <Euro className="w-5 h-5 text-orange-400" />,
          couleur: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
          actionButton: {
            label: 'Créer facture',
            href: devisSigne ? `/devis/${devisSigne.id}` : `/factures/nouveau?dossier_id=${dossier.id}`
          }
        }
      }
    }
    
    // Si devis signé, chantier terminé ou facture déjà créée → Vérifier factures en retard
    // (Cette logique est déjà gérée plus haut avec facturesEnRetard)
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ 1 : Visite réalisée (fiche de visite existe) → Créer devis
    // ═══════════════════════════════════════════════════════════════════════
    const ficheVisite = (dossier.fiches_visite as any[]) || []
    const hasFicheVisite = ficheVisite.length > 0
    
    // Si visite réalisée (statut OU fiche existe) et pas de devis → Créer devis
    if ((statut === 'visite_realisee' || hasFicheVisite) && devis.length === 0) {
      const dateVisite = hasFicheVisite && ficheVisite[0]?.created_at 
        ? new Date(ficheVisite[0].created_at) 
        : dossier.updated_at 
          ? new Date(dossier.updated_at) 
          : new Date()
      const joursDepuisVisite = Math.floor((new Date().getTime() - dateVisite.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        action: 'Créer le devis',
        description: `Visite réalisée${joursDepuisVisite > 0 ? ` il y a ${joursDepuisVisite} jour${joursDepuisVisite > 1 ? 's' : ''}` : ' aujourd\'hui'}`,
        urgence: joursDepuisVisite > 3 ? 'haute' as const : 'normale' as const,
        dateLimite: new Date(dateVisite.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 jours après la visite
        icon: <FileText className="w-5 h-5 text-amber-400" />,
        couleur: joursDepuisVisite > 3 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        actionButton: {
          label: 'Créer devis',
          href: `/devis/nouveau?dossier_id=${dossier.id}`
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ 2 : Gestion des devis (après visite réalisée)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Si statut dossier = devis_en_cours (ou devis_en_preparation) → Envoyer le devis
    // Vérifier s'il y a un devis en préparation ou en brouillon à envoyer
    if (statut === 'devis_en_cours' || statut === 'devis_en_preparation' || statut === 'devis_pret') {
      const devisAEnvoyer = devis.find((d: any) => 
        d.statut === 'en_preparation' || 
        d.statut === 'brouillon' || 
        d.statut === 'pret'
      )
      
      if (devisAEnvoyer) {
        const numeroDevis = devisAEnvoyer.numero || `DV-${devisAEnvoyer.id.substring(0, 8)}` || 'en préparation'
        return {
          action: 'Envoyer le devis',
          description: `Devis ${numeroDevis} à envoyer au client`,
          urgence: 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Envoyer',
            href: `/devis/${devisAEnvoyer.id}?action=envoyer`
          }
        }
      }
    }
    
    // Si devis envoyé → En attente de signature
    // Vérifier d'abord le statut du devis, pas seulement le statut du dossier
    const devisEnvoye = devis.find((d: any) => d.statut === 'envoye')
    if (devisEnvoye && (statut === 'devis_envoye' || statut === 'visite_realisee' || statut === 'devis_en_cours' || statut === 'devis_pret')) {
      const dateEnvoi = devisEnvoye.date_envoi ? new Date(devisEnvoye.date_envoi) : null
      const joursDepuisEnvoi = dateEnvoi 
        ? Math.floor((new Date().getTime() - dateEnvoi.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      
      if (joursDepuisEnvoi >= 7) {
        return {
          action: 'Relancer le client',
          description: `Devis ${devisEnvoye.numero} envoyé il y a ${joursDepuisEnvoi} jours - En attente de signature`,
          urgence: joursDepuisEnvoi >= 14 ? 'haute' as const : 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-purple-400" />,
          couleur: joursDepuisEnvoi >= 14 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          actionButton: {
            label: 'Relancer',
            href: `/devis/${devisEnvoye.id}?action=relancer`
          }
        }
      } else {
        return {
          action: 'En attente de signature',
          description: `Devis ${devisEnvoye.numero} envoyé${dateEnvoi ? ` le ${dateEnvoi.toLocaleDateString('fr-FR')}` : ''} - En attente de réponse du client`,
          urgence: 'normale' as const,
          dateLimite: dateEnvoi ? new Date(dateEnvoi.getTime() + 7 * 24 * 60 * 60 * 1000) : null,
          icon: <Clock className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Voir le devis',
            href: `/devis/${devisEnvoye.id}`
          }
        }
      }
    }
    
    // Si visite réalisée avec devis créé → Envoyer le devis (même en brouillon)
    if ((statut === 'visite_realisee' || hasFicheVisite) && devis.length > 0) {
      // Si devis en brouillon ou en préparation → Envoyer le devis
      const devisBrouillon = devis.find((d: any) => d.statut === 'brouillon' || d.statut === 'en_preparation')
      if (devisBrouillon) {
        return {
          action: 'Envoyer le devis',
          description: `Devis ${devisBrouillon.numero || 'en brouillon'} à envoyer au client`,
          urgence: 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Envoyer',
            href: `/devis/${devisBrouillon.id}?action=envoyer`
          }
        }
      }
      
      // Si devis prêt → Envoyer le devis
      const devisPret = devis.find((d: any) => d.statut === 'pret')
      if (devisPret) {
        return {
          action: 'Envoyer le devis',
          description: `Devis ${devisPret.numero} prêt à être envoyé`,
          urgence: 'normale' as const,
          dateLimite: null,
          icon: <Send className="w-5 h-5 text-blue-400" />,
          couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          actionButton: {
            label: 'Envoyer',
            href: `/devis/${devisPret.id}?action=envoyer`
          }
        }
      }
    }
    
    // Vérifier si devis prêt mais non envoyé (cas général, pas visite réalisée)
    const devisPret = devis.find((d: any) => d.statut === 'pret' || d.statut === 'en_preparation')
    if (devisPret && devisPret.statut === 'pret' && statut !== 'devis_envoye') {
      return {
        action: 'Envoyer le devis',
        description: `Devis ${devisPret.numero} prêt à être envoyé`,
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <Send className="w-5 h-5 text-blue-400" />,
        couleur: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        actionButton: {
          label: 'Envoyer',
          href: `/devis/${devisPret.id}?action=envoyer`
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // PRIORITÉ : Vérifier d'abord les RDV existants (planifiés/confirmés)
    // AVANT de suggérer de planifier un nouveau RDV
    // ═══════════════════════════════════════════════════════════════════════
    
    const rdvConfirme = rdv.find((r: any) => r.statut === 'confirme')
    const rdvPlanifies = rdv.filter((r: any) => r.statut === 'planifie' || r.statut === 'confirme')
    
    // Créneaux envoyés, en attente de confirmation du client
    // Cas 1 : statut rdv_a_planifier sans RDV → créneaux envoyés par email, le client n'a pas encore cliqué
    // Cas 2 : statut rdv_planifie sans RDV → ancien flux (créneaux envoyés)
    // Cas 3 : Journal indique créneaux envoyés → créneaux envoyés même si statut pas à jour (fallback)
    // Cas 4 : RDV planifié(s) existants → idem, en attente clic
    const hasCreneauxEnvoyes = statut === 'rdv_a_planifier' || statut === 'rdv_planifie' || (creneauxEnvoyes && rdv.length === 0) || rdvPlanifies.length > 0
    
    // Calculer depuis combien de temps les créneaux ont été envoyés
    const dateCreneauxEnvoyes = journal.find((entry: any) => {
      if (!entry.created_at) return false
      return (
        (entry.titre && entry.titre.toLowerCase().includes('créneaux')) ||
        (entry.contenu && entry.contenu.toLowerCase().includes('créneaux')) ||
        (entry.type === 'action_leo' && entry.contenu && entry.contenu.includes('créneaux'))
      )
    })?.created_at
    
    const joursDepuisCreneaux = dateCreneauxEnvoyes 
      ? Math.floor((maintenant.getTime() - new Date(dateCreneauxEnvoyes).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    if (hasCreneauxEnvoyes && rdv.length === 0 && !rdvConfirme && !hasFicheVisite) {
      // Si créneaux envoyés depuis +3 jours, suggérer de relancer
      const doitRelancer = joursDepuisCreneaux >= 3
      
      return {
        action: doitRelancer ? 'Relancer le client pour les créneaux' : 'En attente de confirmation du client',
        description: doitRelancer 
          ? `Créneaux envoyés il y a ${joursDepuisCreneaux} jours. Le client n'a pas encore confirmé son RDV.`
          : 'Créneaux proposés envoyés par email. En attente que le client clique sur un créneau pour confirmer son RDV.',
        urgence: doitRelancer ? 'haute' as const : 'normale' as const,
        dateLimite: dateCreneauxEnvoyes ? new Date(new Date(dateCreneauxEnvoyes).getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        icon: doitRelancer ? <AlertTriangle className="w-5 h-5 text-orange-400" /> : <Clock className="w-5 h-5 text-amber-400" />,
        couleur: doitRelancer ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        actionButton: { 
          label: doitRelancer ? 'Relancer le client' : 'Voir agenda', 
          href: doitRelancer ? `/dossiers/${dossier.id}?action=relancer_creneaux` : '/rdv' 
        }
      }
    }
    
    // RDV planifié(s) existants sans confirmation (ancien flux avec RDV créés)
    if (rdvPlanifies.length > 0 && !rdvConfirme && !hasFicheVisite) {
      const prochainRdv = rdv.find((r: any) => r.statut === 'planifie')
      const dateRdvPlanifie = prochainRdv?.created_at ? new Date(prochainRdv.created_at) : null
      const joursDepuisRdv = dateRdvPlanifie 
        ? Math.floor((maintenant.getTime() - dateRdvPlanifie.getTime()) / (1000 * 60 * 60 * 24))
        : 0
      const doitRelancerRdv = joursDepuisRdv >= 3
      
      return {
        action: doitRelancerRdv ? 'Relancer le client pour les créneaux' : 'En attente de confirmation du client',
        description: prochainRdv
          ? doitRelancerRdv
            ? `Créneaux envoyés il y a ${joursDepuisRdv} jours. RDV prévu le ${new Date(prochainRdv.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. Relancer le client.`
            : `Créneaux envoyés – RDV prévu le ${new Date(prochainRdv.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}. Le client doit cliquer pour confirmer.`
          : 'Créneaux proposés envoyés par email. En attente que le client clique sur un créneau pour confirmer son RDV.',
        urgence: doitRelancerRdv ? 'haute' as const : 'normale' as const,
        dateLimite: dateRdvPlanifie ? new Date(dateRdvPlanifie.getTime() + 3 * 24 * 60 * 60 * 1000) : null,
        icon: doitRelancerRdv ? <AlertTriangle className="w-5 h-5 text-orange-400" /> : <Clock className="w-5 h-5 text-amber-400" />,
        couleur: doitRelancerRdv ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        actionButton: prochainRdv
          ? { label: doitRelancerRdv ? 'Relancer' : 'Voir RDV', href: doitRelancerRdv ? `/dossiers/${dossier.id}?action=relancer_creneaux` : `/rdv/${prochainRdv.id}` }
          : { label: 'Agenda RDV', href: '/rdv' }
      }
    }
    
    // Vérifier si RDV à planifier (contact_recu/qualification sans créneaux envoyés)
    // ⚠️ IMPORTANT : Ne suggérer "Planifier un RDV" QUE si :
    // 1. Le statut indique qu'un RDV est nécessaire (contact_recu, qualification)
    // 2. ET qu'aucun RDV n'existe déjà
    // 3. ET que le statut n'est PAS rdv_a_planifier (car cela signifie que les créneaux ont déjà été envoyés)
    const hasAnyRdv = rdv.length > 0
    const hasRdvPlanifie = rdv.some((r: any) => r.statut === 'planifie' || r.statut === 'confirme')
    
    if ((statut === 'qualification' || statut === 'contact_recu') && !hasAnyRdv && !hasRdvPlanifie) {
      return {
        action: 'Planifier un RDV',
        description: 'Prendre contact avec le client pour planifier une visite',
        urgence: 'normale' as const,
        dateLimite: null,
        icon: <Calendar className="w-5 h-5 text-purple-400" />,
        couleur: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        actionButton: {
          label: 'Planifier RDV',
          href: `/rdv/nouveau?dossier_id=${dossier.id}`
        }
      }
    }
    
    // Vérifier si RDV confirmé (SEULEMENT si visite pas encore réalisée)
    if (rdvConfirme && !hasFicheVisite && statut !== 'visite_realisee') {
      const dateRdv = new Date(rdvConfirme.date_heure)
      const maintenant = new Date()
      
      if (dateRdv > maintenant) {
        return {
          action: 'Préparer la visite',
          description: `RDV confirmé le ${dateRdv.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`,
          urgence: 'normale' as const,
          dateLimite: dateRdv,
          icon: <Calendar className="w-5 h-5 text-green-400" />,
          couleur: 'bg-green-500/10 border-green-500/30 text-green-400',
          actionButton: {
            label: 'Voir RDV',
            href: `/rdv/${rdvConfirme.id}`
          }
        }
      }
    }
    
    // Pas d'action urgente
    return null
}

interface ProchaineActionProps {
  dossier: any
}

export function ProchaineAction({ dossier }: ProchaineActionProps) {
  const prochaineAction = calculerProchaineAction(dossier)
  
  if (!prochaineAction) {
    return (
      <Card className="border-border bg-gradient-to-br from-green-500/5 to-green-600/10 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Prochaine action
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aucune action urgente requise
          </p>
        </CardContent>
      </Card>
    )
  }
  
  const urgenceColors = {
    urgente: 'bg-red-500/10 border-red-500/30 text-red-400',
    haute: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
    normale: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
  }
  
  return (
    <Card className={`border-border ${prochaineAction.couleur}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {prochaineAction.icon}
          Prochaine action
          <Badge variant="outline" className={`ml-auto ${urgenceColors[prochaineAction.urgence]}`}>
            {prochaineAction.urgence === 'urgente' ? 'Urgent' : prochaineAction.urgence === 'haute' ? 'Important' : 'Normal'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-semibold text-sm mb-1">{prochaineAction.action}</p>
          <p className="text-xs text-muted-foreground">{prochaineAction.description}</p>
        </div>
        
        {prochaineAction.dateLimite && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3" />
            <span>
              {prochaineAction.dateLimite < new Date() 
                ? `En retard depuis ${formatDistanceToNow(prochaineAction.dateLimite, { addSuffix: true, locale: fr })}`
                : `Avant le ${prochaineAction.dateLimite.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
              }
            </span>
          </div>
        )}
        
        {prochaineAction.actionButton && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            asChild
          >
            <Link href={prochaineAction.actionButton.href}>
              {prochaineAction.actionButton.label}
            </Link>
          </Button>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Bot className="w-3 h-3" />
          <span>Suggestion automatique de Léo</span>
        </div>
      </CardContent>
    </Card>
  )
}

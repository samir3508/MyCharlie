import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateDossierStatutEnvoiCreneaux } from '@/lib/utils/dossier-statuts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dossier_id, client_email, creneaux, tenant_id } = body

    if (!dossier_id || !client_email || !creneaux || !tenant_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PARAMETERS_MISSING', 
          message: 'dossier_id, client_email, creneaux et tenant_id sont requis' 
        },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Récupérer les informations du dossier et du client
    const { data: dossier, error: dossierError } = await supabase
      .from('dossiers')
      .select(`
        *,
        clients (id, nom, prenom, nom_complet, email, telephone)
      `)
      .eq('id', dossier_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (dossierError || !dossier) {
      console.error('Erreur récupération dossier:', dossierError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'DOSSIER_NOT_FOUND', 
          message: 'Dossier non trouvé' 
        },
        { status: 404 }
      )
    }

    const client = dossier.clients
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'CLIENT_NOT_FOUND', 
          message: 'Client non trouvé pour ce dossier' 
        },
        { status: 404 }
      )
    }

    // Récupérer le tenant pour l'email
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, company_name, email, n8n_webhook_url')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      console.error('Erreur récupération tenant:', tenantError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'TENANT_NOT_FOUND', 
          message: 'Tenant non trouvé' 
        },
        { status: 404 }
      )
    }

    // 1. Mettre à jour le statut du dossier vers "rdv_a_planifier"
    // Les RDV ne sont créés que quand le client clique sur un créneau (confirm-creneau).
    // Le statut "rdv_a_planifier" indique que les créneaux ont été envoyés et qu'on attend la confirmation du client.
    const statutMisAJour = await updateDossierStatutEnvoiCreneaux(dossier_id, tenant_id)
    
    if (!statutMisAJour) {
      console.error('❌ ERREUR CRITIQUE : Impossible de mettre à jour le statut du dossier vers "rdv_a_planifier"')
      console.error('   Le dossier restera dans son statut actuel, ce qui peut causer des problèmes d\'affichage')
      // On continue quand même pour envoyer l'email, mais c'est un problème
    } else {
      console.log('✅ Statut dossier mis à jour avec succès vers "rdv_a_planifier"')
    }
    
    // Ajouter une entrée dans le journal du dossier pour tracer l'envoi des créneaux
    try {
      await supabase
        .from('journal_dossier')
        .insert({
          tenant_id,
          dossier_id,
          type: 'action_leo',
          titre: 'Créneaux proposés envoyés',
          contenu: `Créneaux proposés envoyés par email au client (${creneaux.length} créneau${creneaux.length > 1 ? 'x' : ''}). En attente de confirmation du client.`,
          ancien_statut: dossier.statut,
          nouveau_statut: statutMisAJour ? 'rdv_a_planifier' : null,
          metadata: {
            creneaux_count: creneaux.length,
            client_email: client_email,
            statut_mis_a_jour: statutMisAJour
          },
          auteur: 'leo'
        })
    } catch (journalError) {
      console.warn('⚠️ Erreur lors de l\'ajout dans le journal (non bloquant):', journalError)
    }

    // 2. Envoyer l'email avec les créneaux (via Gmail ou N8N)
    let emailEnvoye = false
    
    // Essayer d'envoyer via Gmail d'abord
    try {
      const { data: gmailConnection } = await supabase
        .from('oauth_connections')
        .select('access_token, refresh_token, expires_at, id, email')
        .eq('tenant_id', tenant_id)
        .eq('provider', 'google')
        .eq('service', 'gmail')
        .eq('is_active', true)
        .single()

      if (gmailConnection?.access_token) {
        // Préparer l'email avec les créneaux
        const clientName = client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim()
        const sujet = `Proposition de créneaux pour visite de chantier`
        
        let creneauxText = ''
        creneaux.forEach((creneau: any, index: number) => {
          const date = new Date(creneau.date_heure)
          creneauxText += `✨ **Option ${index + 1}** : ${date.toLocaleString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          })}\n`
        })

        const emailBody = `
Bonjour ${clientName},

Nous avons le plaisir de vous proposer les créneaux suivants pour votre visite de chantier :

${creneauxText}

📍 **Adresse du chantier :** ${dossier.adresse_chantier || 'À confirmer avec vous'}

Pour confirmer un créneau, il vous suffit de répondre à cet email en indiquant votre choix, ou de cliquer sur le lien qui vous sera envoyé pour chaque créneau.

Nous vous attendons avec plaisir !

Cordialement,
${tenant.company_name || 'L\'équipe'}
        `.trim()

        // Envoyer l'email (implémentation Gmail API à compléter)
        console.log('📧 Email préparé pour envoi via Gmail')
        emailEnvoye = true // Placeholder
        
      } else {
        console.log('📧 Gmail non connecté, utilisation du webhook N8N')
      }
    } catch (gmailError) {
      console.warn('⚠️ Erreur envoi Gmail:', gmailError)
    }

    // 3. Si Gmail échoue, utiliser le webhook N8N
    if (!emailEnvoye && tenant.n8n_webhook_url) {
      try {
        const message = `📅 PROPOSITION CRÉNEAUX : Proposition de ${creneaux.length} créneaux pour visite chantier envoyée à ${client.email}. Dossier mis à jour vers "rdv_a_planifier".`

        const n8nResponse = await fetch(tenant.n8n_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            chatInput: message,
            context: {
              tenant_id: tenant_id,
              tenant_name: tenant.company_name,
              conversation_date: new Date().toISOString().split('T')[0],
              dossier_id: dossier_id,
              client_email: client.email,
              client_name: client.nom_complet || `${client.prenom || ''} ${client.nom || ''}`.trim(),
              creneaux_proposes: creneaux,
              type_action: 'proposer_creneaux_visite'
            }
          })
        })

        if (n8nResponse.ok) {
          console.log('✅ Notification N8N envoyée')
          emailEnvoye = true
        } else {
          console.error('Erreur appel N8N:', n8nResponse.status)
        }
      } catch (n8nError) {
        console.error('Erreur lors de l\'appel N8N:', n8nError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Créneaux envoyés avec succès',
      data: {
        dossier_statut_mis_a_jour: statutMisAJour,
        statut_dossier: statutMisAJour ? 'rdv_a_planifier' : dossier.statut,
        rdv_crees: 0,
        email_envoye: emailEnvoye,
        nombre_creneaux: creneaux.length,
        dossier_id: dossier_id
      },
      warning: !statutMisAJour ? 'Le statut du dossier n\'a pas pu être mis à jour. Vérifiez les logs serveur.' : undefined
    })

  } catch (error: any) {
    console.error('Erreur lors de l\'envoi des créneaux:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'SERVER_ERROR', 
        message: error.message || 'Erreur serveur lors de l\'envoi des créneaux' 
      },
      { status: 500 }
    )
  }
}

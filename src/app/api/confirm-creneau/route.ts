import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Fonction pour décoder le token (même logique que dans le Code Tool)
function decodeCreneauToken(token: string, tenantId: string, clientEmail: string, creneauStart: string): boolean {
  try {
    // Reconstruire le tokenString original
    const tokenString = `${tenantId}-${clientEmail}-${creneauStart}`;
    
    // Encoder en base64 et remplacer les caractères spéciaux (comme dans le Code Tool)
    // Utiliser btoa qui est disponible dans l'environnement Next.js
    const expectedToken = btoa(unescape(encodeURIComponent(tokenString))).replace(/[+/=]/g, '');
    
    // Comparer les tokens
    return token === expectedToken;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
}

// GET - Confirmer un créneau via le lien cliquable
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const creneau = searchParams.get('creneau'); // ISO timestamp
    const email = searchParams.get('email');
    const tenantId = searchParams.get('tenant_id');

    // Validation des paramètres
    if (!token || !creneau || !email || !tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PARAMETERS_MISSING', 
          message: 'Paramètres manquants : token, creneau, email et tenant_id sont requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier le token
    if (!decodeCreneauToken(token, tenantId, email, creneau)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'INVALID_TOKEN', 
          message: 'Token invalide' 
        },
        { status: 403 }
      );
    }

    // Récupérer le tenant et son webhook n8n
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, n8n_webhook_url, company_name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('Erreur récupération tenant:', tenantError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'TENANT_NOT_FOUND', 
          message: 'Tenant non trouvé' 
        },
        { status: 404 }
      );
    }

    // Récupérer les informations du client
    const { data: client } = await supabase
      .from('clients')
      .select('id, nom_complet, nom, prenom, email, telephone, adresse_facturation')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single();

    // Récupérer les informations du créneau
    const creneauDate = new Date(creneau);
    const creneauEnd = new Date(creneauDate);
    creneauEnd.setHours(creneauEnd.getHours() + 1); // Durée par défaut : 1h

    const clientName = client?.nom_complet || email;
    const clientPhone = client?.telephone || null;
    const clientAddress = client?.adresse_facturation || null;

    // ════════════════════════════════════════════════════════════════════════════
    // 1. CRÉER LE RDV DANS SUPABASE
    // ════════════════════════════════════════════════════════════════════════════
    let rdvId: string | null = null;
    try {
      const { data: newRdv, error: rdvError } = await supabase
        .from('rdv')
        .insert({
          tenant_id: tenantId,
          client_id: client?.id || null,
          type_rdv: 'visite',
          date_heure: creneauDate.toISOString(),
          duree_minutes: 60,
          statut: 'confirme',
          notes: `Créneau confirmé par le client via email le ${new Date().toLocaleString('fr-FR')}`,
          adresse: clientAddress
        })
        .select('id')
        .single();

      if (rdvError) {
        console.error('Erreur création RDV dans Supabase:', rdvError);
      } else {
        rdvId = newRdv?.id || null;
        console.log('✅ RDV créé dans Supabase:', rdvId);
      }
    } catch (rdvErr: any) {
      console.error('Erreur lors de la création du RDV:', rdvErr);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 2. CRÉER L'ÉVÉNEMENT DANS GOOGLE CALENDAR
    // ════════════════════════════════════════════════════════════════════════════
    let calendarEventId: string | null = null;
    try {
      // Récupérer le token OAuth Google Calendar
      const { data: calendarConnection } = await supabase
        .from('oauth_connections')
        .select('access_token, refresh_token, expires_at, id')
        .eq('tenant_id', tenantId)
        .eq('provider', 'google')
        .eq('service', 'calendar')
        .eq('is_active', true)
        .single();

      if (calendarConnection?.access_token) {
        // Rafraîchir le token si nécessaire
        let accessToken = calendarConnection.access_token;
        const expiresAt = calendarConnection.expires_at ? new Date(calendarConnection.expires_at) : null;
        const now = new Date();
        
        if (expiresAt && expiresAt < now && calendarConnection.refresh_token) {
          // Rafraîchir le token via l'API
          try {
            const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'}/api/auth/google/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ connection_id: calendarConnection.id })
            });
            
            if (refreshResponse.ok) {
              const { data: updatedConnection } = await supabase
                .from('oauth_connections')
                .select('access_token')
                .eq('id', calendarConnection.id)
                .single();
              
              if (updatedConnection?.access_token) {
                accessToken = updatedConnection.access_token;
              }
            }
          } catch (refreshErr) {
            console.warn('Erreur rafraîchissement token Calendar:', refreshErr);
          }
        }

        // Créer l'événement dans Google Calendar
        const calendarEvent = {
          summary: `Visite chantier - ${clientName}`,
          description: `Visite de chantier confirmée avec ${clientName}${clientPhone ? `\nTéléphone: ${clientPhone}` : ''}${clientAddress ? `\nAdresse: ${clientAddress}` : ''}`,
          start: {
            dateTime: creneauDate.toISOString(),
            timeZone: 'Europe/Paris'
          },
          end: {
            dateTime: creneauEnd.toISOString(),
            timeZone: 'Europe/Paris'
          },
          location: clientAddress || undefined,
          attendees: email ? [{ email }] : undefined
        };

        const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(calendarEvent)
        });

        if (calendarResponse.ok) {
          const eventData = await calendarResponse.json();
          calendarEventId = eventData.id;
          console.log('✅ Événement créé dans Google Calendar:', calendarEventId);
        } else {
          const errorData = await calendarResponse.json().catch(() => ({}));
          console.error('Erreur création événement Calendar:', errorData);
        }
      } else {
        console.warn('⚠️ Google Calendar non connecté pour ce tenant');
      }
    } catch (calendarErr: any) {
      console.error('Erreur lors de la création de l\'événement Calendar:', calendarErr);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 3. ENVOYER UN EMAIL DE CONFIRMATION AU CLIENT
    // ════════════════════════════════════════════════════════════════════════════
    try {
      // Récupérer le token OAuth Gmail
      const { data: gmailConnection } = await supabase
        .from('oauth_connections')
        .select('access_token, refresh_token, expires_at, id, email')
        .eq('tenant_id', tenantId)
        .eq('provider', 'google')
        .eq('service', 'gmail')
        .eq('is_active', true)
        .single();

      if (gmailConnection?.access_token) {
        // Rafraîchir le token si nécessaire
        let accessToken = gmailConnection.access_token;
        const expiresAt = gmailConnection.expires_at ? new Date(gmailConnection.expires_at) : null;
        const now = new Date();
        
        if (expiresAt && expiresAt < now && gmailConnection.refresh_token) {
          try {
            const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'}/api/auth/google/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ connection_id: gmailConnection.id })
            });
            
            if (refreshResponse.ok) {
              const { data: updatedConnection } = await supabase
                .from('oauth_connections')
                .select('access_token')
                .eq('id', gmailConnection.id)
                .single();
              
              if (updatedConnection?.access_token) {
                accessToken = updatedConnection.access_token;
              }
            }
          } catch (refreshErr) {
            console.warn('Erreur rafraîchissement token Gmail:', refreshErr);
          }
        }

        // Créer l'email de confirmation
        const fromEmail = gmailConnection.email || 'noreply@example.com';
        const subject = `✅ Confirmation de votre visite de chantier - ${creneauDate.toLocaleDateString('fr-FR')}`;
        
        const dateFormatee = creneauDate.toLocaleString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const emailBody = `
Bonjour ${clientName},

Votre visite de chantier a été confirmée avec succès.

📅 **Date et heure :**
${dateFormatee}

📍 **Adresse :**
${clientAddress || 'À confirmer'}

Nous vous attendons à cette date et heure.

Cordialement,
${tenant.company_name}
        `.trim();

        // Créer le message MIME
        const mimeEmail = [
          `From: ${fromEmail}`,
          `To: ${email}`,
          `Subject: ${subject}`,
          `Content-Type: text/plain; charset=utf-8`,
          '',
          emailBody
        ].join('\r\n');

        // Encoder en base64 URL-safe
        const encodedEmail = Buffer.from(mimeEmail, 'utf8').toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        // Envoyer l'email via Gmail API
        const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ raw: encodedEmail })
        });

        if (gmailResponse.ok) {
          console.log('✅ Email de confirmation envoyé au client');
        } else {
          const errorData = await gmailResponse.json().catch(() => ({}));
          console.error('Erreur envoi email client:', errorData);
        }
      } else {
        console.warn('⚠️ Gmail non connecté pour ce tenant');
      }
    } catch (emailErr: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailErr);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 4. NOTIFIER L'ARTISAN VIA LE WEBHOOK N8N
    // ════════════════════════════════════════════════════════════════════════════
    // ⚠️ IMPORTANT : Utiliser le webhook du tenant s'il existe, sinon utiliser le webhook par défaut
    // Cette API ne retourne plus l'erreur N8N_NOT_CONFIGURED - elle utilise toujours un webhook
    const n8nWebhookUrl = tenant.n8n_webhook_url || 'https://n8n.srv1271213.hstgr.cloud/webhook/869b3ab3-b632-40de-acec-8f5e0312cb7d/webhook';
    
    try {
      const message = `✅ CONFIRMATION DE CRÉNEAU : Le client ${clientName} a confirmé un créneau de visite de chantier. Le rendez-vous a été créé dans Google Calendar${calendarEventId ? ` (ID: ${calendarEventId})` : ''}${rdvId ? ` et dans le système (RDV ID: ${rdvId})` : ''}.`;

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          chatInput: message,
          context: {
            tenant_id: tenantId,
            tenant_name: tenant.company_name,
            conversation_date: new Date().toISOString().split('T')[0],
            is_whatsapp: false,
            creneau_confirmation: {
              creneau_start: creneau,
              creneau_end: creneauEnd.toISOString(),
              client_email: email,
              client_id: client?.id || null,
              client_name: clientName,
              client_phone: clientPhone,
              client_address: clientAddress,
              type_rdv: 'visite',
              duree_minutes: 60,
              confirmed_at: new Date().toISOString(),
              calendar_event_id: calendarEventId,
              rdv_id: rdvId
            }
          }
        }),
      });

      if (n8nResponse.ok) {
        console.log('✅ Artisan notifié via webhook n8n');
      } else {
        console.error('Erreur appel n8n:', n8nResponse.status, await n8nResponse.text());
      }
    } catch (n8nError: any) {
      console.error('Erreur lors de l\'appel n8n:', n8nError);
    }

    // Retourner une page HTML de confirmation
    const confirmationHtml = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Créneau confirmé</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
          .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #ff6b35;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin: 10px 0;
          }
          .creneau-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .creneau-info strong {
            color: #ff6b35;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Créneau confirmé !</h1>
          <p>Merci d'avoir confirmé votre créneau.</p>
          <div class="creneau-info">
            <p><strong>Date et heure :</strong></p>
            <p>${creneauDate.toLocaleString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</p>
          </div>
          <p>Vous recevrez un email de confirmation dans quelques instants.</p>
          <p style="margin-top: 30px; color: #888; font-size: 14px;">Vous pouvez fermer cette page.</p>
        </div>
      </body>
      </html>
    `;

    return new Response(confirmationHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });

  } catch (error: any) {
    console.error('Erreur confirmation créneau:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'SERVER_ERROR', 
        message: error.message || 'Erreur serveur lors de la confirmation du créneau' 
      },
      { status: 500 }
    );
  }
}

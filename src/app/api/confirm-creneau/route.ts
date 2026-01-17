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

    if (!tenant.n8n_webhook_url) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N_NOT_CONFIGURED', 
          message: 'Webhook n8n non configuré pour ce tenant' 
        },
        { status: 500 }
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

    // Construire le message pour n8n (via le manager)
    // Le manager va router vers LÉO qui va créer le RDV
    // Format explicite pour que LÉO détecte la confirmation de créneau
    const message = `⚠️ CONFIRMATION DE CRÉNEAU : Le client ${client?.nom_complet || email} a confirmé un créneau. Crée le rendez-vous automatiquement et confirme au client et à l'artisan.`;

    // Appeler le webhook n8n
    try {
      const n8nResponse = await fetch(tenant.n8n_webhook_url, {
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
              client_name: client?.nom_complet || email,
              client_phone: client?.telephone || null,
              client_address: client?.adresse_facturation || null,
              type_rdv: 'visite', // Valeur par défaut (peut être surchargé si nécessaire)
              duree_minutes: 60, // Durée par défaut : 1h
              confirmed_at: new Date().toISOString()
            }
          }
        }),
      });

      if (!n8nResponse.ok) {
        console.error('Erreur appel n8n:', n8nResponse.status, await n8nResponse.text());
        // Continuer quand même - on affichera une page de confirmation
      }
    } catch (n8nError: any) {
      console.error('Erreur lors de l\'appel n8n:', n8nError);
      // Continuer quand même - on affichera une page de confirmation
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

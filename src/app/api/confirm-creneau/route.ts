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
      .select('id, n8n_webhook_url, company_name, email, phone, whatsapp_phone')
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
    let client: any = null;
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('id, nom_complet, nom, prenom, email, telephone, adresse_facturation')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter l'erreur si client non trouvé
    
    // Si le client existe mais n'a pas de nom/prenom, essayer de les extraire de nom_complet
    if (existingClient && (!existingClient.nom || !existingClient.prenom)) {
      if (existingClient.nom_complet) {
        const parts = existingClient.nom_complet.trim().split(/\s+/);
        if (parts.length >= 2) {
          existingClient.prenom = parts[0];
          existingClient.nom = parts.slice(1).join(' ');
        } else if (parts.length === 1) {
          existingClient.nom = parts[0];
          existingClient.prenom = '';
        }
      }
    }
    
    if (clientError) {
      console.warn('⚠️ Erreur lors de la recherche du client:', clientError);
    }
    
    if (existingClient) {
      client = existingClient;
      console.log('✅ Client trouvé:', client.id);
    } else {
      // Créer le client s'il n'existe pas (car client_id est requis pour créer un dossier)
      console.warn('⚠️ Client non trouvé pour l\'email:', email);
      console.log('📝 Création d\'un nouveau client...');
      
      // Chercher d'abord un client existant avec le même email qui a de vrais noms (nom != prenom)
      // On récupère tous les clients avec cet email et on filtre en JavaScript
      const { data: allClientsWithEmail } = await supabase
        .from('clients')
        .select('id, nom, prenom, nom_complet, email, telephone, adresse_facturation, created_at')
        .eq('tenant_id', tenantId)
        .eq('email', email)
        .order('created_at', { ascending: true });
      
      // Filtrer pour trouver un client avec de vrais noms (nom != prenom)
      const existingClientWithRealName = allClientsWithEmail?.find(c => c.nom !== c.prenom);
      
      if (existingClientWithRealName) {
        // Utiliser le client existant avec de vrais noms
        client = existingClientWithRealName;
        console.log('✅ Client existant avec vrais noms trouvé:', client.id, `${client.prenom} ${client.nom}`);
      } else {
        // Extraire nom et prénom de l'email (partie avant @)
        const emailPrefix = email.split('@')[0];
        // Essayer de séparer nom.prénom ou nom_prenom
        const nameParts = emailPrefix.split(/[._-]/);
        const prenom = nameParts[0] || 'Client';
        const nom = nameParts[1] || emailPrefix;
        
        // Si nom === prenom (doublon potentiel), laisser tel quel mais le code d'affichage gérera
        const { data: newClient, error: createClientError } = await supabase
          .from('clients')
          .insert({
            tenant_id: tenantId,
            email: email,
            nom: nom,
            prenom: prenom,
          })
          .select('id, nom_complet, nom, prenom, email, telephone, adresse_facturation')
          .single();
        
        if (createClientError) {
          console.error('❌ Erreur lors de la création du client:', createClientError);
          return NextResponse.json(
            {
              success: false,
              error: 'CLIENT_CREATION_FAILED',
              message: 'Impossible de créer le client. Le client est requis pour créer un dossier.',
              details: createClientError.message
            },
            { status: 500 }
          );
        } else if (newClient) {
          client = newClient;
          console.log('✅ Client créé avec succès:', client.id);
        } else {
          console.error('❌ Client créé mais aucune donnée retournée');
          return NextResponse.json(
            {
              success: false,
              error: 'CLIENT_CREATION_FAILED',
              message: 'Le client a été créé mais aucune donnée n\'a été retournée.'
            },
            { status: 500 }
          );
        }
      }
    }

    // Récupérer les informations du créneau
    // Le paramètre 'creneau' est un timestamp ISO (ex: "2026-01-26T16:00:00Z" ou "2026-01-26T16:00:00")
    // IMPORTANT: Le créneau est envoyé en UTC depuis le frontend, mais représente une heure locale Europe/Paris
    // Exemple: Si le client choisit 16h, le créneau peut être "2026-01-26T15:00:00Z" (UTC) = 16h Europe/Paris
    // OU "2026-01-26T16:00:00" (sans Z) qui sera interprété différemment selon le serveur
    
    // Parser le créneau et extraire les composants
    const creneauDateParsed = new Date(creneau);
    
    // Si le créneau a un Z (UTC), on doit le convertir en Europe/Paris
    // Si le créneau n'a pas de Z, on l'interprète comme étant déjà en heure locale
    const isUTC = creneau.includes('Z') || creneau.endsWith('+00:00');
    
    let creneauDateForDisplay: Date;
    let creneauDateISO: string;
    let creneauEndISO: string;
    
    // Convertir le créneau en heure Europe/Paris pour l'affichage et Google Calendar
    // Utiliser toLocaleString pour obtenir les composants en Europe/Paris
    const creneauInParis = creneauDateParsed.toLocaleString('en-US', { 
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    // Parser la date formatée (format: "MM/DD/YYYY, HH:mm:ss")
    const [datePart, timePart] = creneauInParis.split(', ');
    const [month, day, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    
    // Créer les dates ISO pour Google Calendar (en Europe/Paris)
    creneauDateISO = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const endHour = (parseInt(hour) + 1).toString().padStart(2, '0');
    creneauEndISO = `${year}-${month}-${day}T${endHour}:${minute}:${second}`;
    
    // Créer la date pour l'affichage
    creneauDateForDisplay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    
    const creneauEnd = new Date(creneauDateForDisplay);
    creneauEnd.setHours(creneauEnd.getHours() + 1);

    // Utiliser prénom et nom si disponibles ET différents (éviter doublons), sinon nom_complet valide, sinon "Client"
    let clientName = 'Client';
    if (client?.prenom && client?.nom && client.prenom !== client.nom) {
      // Nom et prénom valides et différents
      clientName = `${client.prenom} ${client.nom}`;
    } else if (client?.nom_complet) {
      // Vérifier si nom_complet est un doublon (ex: "adlbapp4 adlbapp4")
      const parts = client.nom_complet.trim().split(/\s+/);
      if (!client.nom_complet.includes('@') && 
          !(parts.length === 2 && parts[0] === parts[1])) {
        // nom_complet valide (pas un email, pas un doublon)
        clientName = client.nom_complet;
      }
      // Sinon, clientName reste "Client"
    }
    
    // Définir displayClientName et displayAddress une seule fois pour tous les usages (emails client et artisan)
    let displayClientName = clientName;
    if (client && client.prenom && client.nom) {
      if (client.prenom !== client.nom) {
        // Vrais noms
        displayClientName = `${client.prenom} ${client.nom}`;
      } else if (client.nom_complet && !client.nom_complet.includes('@')) {
        // Si doublon, essayer nom_complet si valide
        const parts = client.nom_complet.trim().split(/\s+/);
        if (parts.length >= 2 && parts[0] !== parts[1]) {
          displayClientName = client.nom_complet;
        }
      }
    }
    
    // Récupérer l'adresse si elle n'est pas fournie
    let displayAddress = client?.adresse_chantier || client?.adresse_facturation || null;
    
    const clientPhone = client?.telephone || null;
    const clientAddress = displayAddress;

    // ════════════════════════════════════════════════════════════════════════════
    // 1. CRÉER LE RDV DANS SUPABASE
    // ════════════════════════════════════════════════════════════════════════════
    let rdvId: string | null = null;
    let dossierId: string | null = null; // Déclarer au niveau supérieur pour être accessible partout
    let calendarEventId: string | null = null; // Déclarer aussi calendarEventId au niveau supérieur
    try {
      // Chercher ou créer un dossier pour ce client (OBLIGATOIRE car dossier_id est NOT NULL)
      
      console.log('🔍 Recherche d\'un dossier pour le client:', {
        clientId: client?.id,
        clientName: clientName,
        tenantId: tenantId
      });

      if (client?.id) {
        // Chercher un dossier existant pour ce client
        console.log('🔍 Recherche d\'un dossier existant pour client_id:', client.id);
        const { data: existingDossier, error: searchError } = await supabase
          .from('dossiers')
          .select('id, numero, titre, statut')
          .eq('tenant_id', tenantId)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Utiliser maybeSingle() pour éviter l'erreur si aucun résultat
        
        if (searchError) {
          console.error('❌ Erreur lors de la recherche de dossier:', searchError);
          console.error('   Code:', searchError.code);
          console.error('   Message:', searchError.message);
          console.error('   Détails:', searchError.details);
        }
        
        if (existingDossier) {
          dossierId = existingDossier.id;
          console.log('✅ Dossier existant trouvé:', {
            id: dossierId,
            numero: existingDossier.numero,
            titre: existingDossier.titre,
            statut: existingDossier.statut
          });
          
          // ═══════════════════════════════════════════════════════════════════════
          // 🔄 MISE À JOUR AUTOMATIQUE DU STATUT DU DOSSIER → rdv_confirme
          // ═══════════════════════════════════════════════════════════════════════
          if (existingDossier.statut !== 'rdv_confirme') {
            const { error: updateError } = await supabase
              .from('dossiers')
              .update({ 
                statut: 'rdv_confirme',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingDossier.id);
            
            if (updateError) {
              console.warn('⚠️ Erreur lors de la mise à jour du statut du dossier:', updateError);
            } else {
              console.log('✅ Statut du dossier mis à jour à "rdv_confirme"');
            }
          }
        } else {
          console.log('📝 Aucun dossier existant, création d\'un nouveau dossier...');
          
          // Générer le numéro de dossier
          const { data: dossierNumero, error: numeroError } = await supabase
            .rpc('generate_dossier_numero', { p_tenant_id: tenantId });
          
          if (numeroError) {
            console.warn('⚠️ Erreur génération numéro dossier, utilisation d\'un numéro temporaire:', numeroError);
          }
          
          // Créer un dossier temporaire si aucun dossier n'existe
          const { data: newDossier, error: dossierError } = await supabase
            .from('dossiers')
            .insert({
              tenant_id: tenantId,
              client_id: client.id,
              numero: dossierNumero || `DOS-${Date.now()}`,
              titre: `Visite - ${clientName || 'Client'}`,
              statut: 'rdv_confirme' as const,
              description: 'Dossier créé automatiquement lors de la confirmation d\'un créneau'
            })
            .select('id')
            .single();
          
          if (dossierError) {
            console.error('❌ Erreur création dossier temporaire:', dossierError);
            console.error('   Code:', dossierError.code);
            console.error('   Message:', dossierError.message);
            console.error('   Détails:', dossierError.details);
            console.error('   Hint:', dossierError.hint);
            console.error('   Données envoyées:', JSON.stringify({
              tenant_id: tenantId,
              client_id: client.id,
              numero: dossierNumero,
              titre: `Visite - ${clientName || 'Client'}`,
              statut: 'rdv_confirme'
            }, null, 2));
            
            // Si c'est une erreur de permissions (RLS), donner plus d'infos
            if (dossierError.code === '42501' || dossierError.message?.includes('permission') || dossierError.message?.includes('policy')) {
              console.error('   ⚠️ PROBLÈME DE PERMISSIONS SUPABASE (RLS)');
              console.error('   Vérifiez les politiques RLS sur la table "dossiers"');
            }
            
            // Si c'est une erreur de contrainte, donner plus d'infos
            if (dossierError.code === '23505') {
              console.error('   ⚠️ ERREUR DE CONTRAINTE UNIQUE');
              console.error('   Un dossier avec ce numéro existe peut-être déjà');
            }
            
            if (dossierError.code === '23502') {
              console.error('   ⚠️ ERREUR: Champ NOT NULL manquant');
              console.error('   Vérifiez que tous les champs requis sont fournis');
            }
          } else if (newDossier) {
            dossierId = newDossier.id;
            console.log('✅ Dossier temporaire créé avec succès:', dossierId);
          } else {
            console.error('❌ Dossier créé mais aucune donnée retournée');
          }
        }
      }
      
      // Si toujours pas de dossier (client non trouvé ou erreur), créer un client d'abord si nécessaire
      if (!dossierId) {
        console.warn('⚠️ Aucun dossier trouvé, vérification du client...');
        
        // Si le client n'existe pas, on ne peut pas créer de dossier (client_id est requis)
        if (!client?.id) {
          console.error('❌ CRITIQUE: Impossible de créer un dossier car le client n\'existe pas et client_id est requis');
          console.error('   Le client devrait avoir été créé ou trouvé plus tôt dans le processus');
          
          return NextResponse.json(
            {
              success: false,
              error: 'CLIENT_NOT_FOUND',
              message: 'Le client n\'a pas été trouvé et est requis pour créer un dossier.'
            },
            { status: 400 }
          );
        }
        
        // Si le client existe mais la création du dossier a échoué, réessayer
        console.warn('⚠️ Réessai de création de dossier pour le client existant...');
        
        // Générer le numéro de dossier
        let dossierNumero: string = `DOS-${Date.now()}`;
        try {
          const { data: numeroData, error: numeroError } = await supabase
            .rpc('generate_dossier_numero', { p_tenant_id: tenantId });
          
          if (numeroError) {
            console.warn('⚠️ Erreur génération numéro dossier via RPC, utilisation d\'un numéro temporaire:', numeroError);
            console.warn('   Code:', numeroError.code);
            console.warn('   Message:', numeroError.message);
          } else if (numeroData) {
            dossierNumero = numeroData;
            console.log('✅ Numéro de dossier généré:', dossierNumero);
          }
        } catch (rpcError: any) {
          console.warn('⚠️ Exception lors de l\'appel RPC generate_dossier_numero:', rpcError);
          // On continue avec le numéro temporaire
        }
        
        const dossierData = {
          tenant_id: tenantId,
          client_id: client.id, // client_id est requis, on utilise celui du client trouvé
          numero: dossierNumero,
          titre: `Visite - ${clientName || 'Client'}`,
          statut: 'rdv_confirme' as const, // Utiliser un statut valide selon le type
          description: 'Dossier créé automatiquement lors de la confirmation d\'un créneau'
        };
        
        console.log('📝 Tentative de création de dossier (réessai) avec les données:', dossierData);
        
        const { data: tempDossier, error: tempDossierError } = await supabase
          .from('dossiers')
          .insert(dossierData)
          .select('id')
          .single();
        
        if (tempDossierError) {
          console.error('❌ CRITIQUE: Impossible de créer un dossier temporaire:', tempDossierError);
          console.error('   Code:', tempDossierError.code);
          console.error('   Message:', tempDossierError.message);
          console.error('   Détails:', tempDossierError.details);
          console.error('   Hint:', tempDossierError.hint);
          console.error('   Données envoyées:', {
            tenant_id: tenantId,
            client_id: client?.id || null,
            titre: `Visite - ${clientName || 'Client'}`,
            statut: 'rdv_confirme' as const
          });
          
          // Si c'est une erreur de permissions (RLS), donner plus d'infos
          if (tempDossierError.code === '42501' || tempDossierError.message?.includes('permission') || tempDossierError.message?.includes('policy')) {
            console.error('   ⚠️ PROBLÈME DE PERMISSIONS SUPABASE (RLS)');
            console.error('   Vérifiez les politiques RLS sur la table "dossiers"');
          }
        } else if (tempDossier) {
          dossierId = tempDossier.id;
          console.log('✅ Dossier temporaire créé (sans client_id):', dossierId);
        } else {
          console.error('❌ Dossier créé mais aucune donnée retournée');
        }
      }

      // Vérifier que dossierId est bien défini avant de créer le RDV
      if (!dossierId) {
        console.error('❌ CRITIQUE: Impossible de créer un dossier, le RDV ne pourra pas être créé (dossier_id est requis et NOT NULL)');
        console.error('   Le RDV sera créé dans Google Calendar mais PAS dans Supabase');
        console.error('   ACTION REQUISE: Vérifier les permissions Supabase (RLS) ou créer un dossier manuellement');
        console.error('   Vérifiez les logs ci-dessus pour voir l\'erreur exacte de création de dossier');
        
        // Retourner une erreur avec plus de détails
        return NextResponse.json(
          {
            success: false,
            error: 'DOSSIER_CREATION_FAILED',
            message: 'Impossible de créer un dossier pour ce RDV. Le RDV ne peut pas être créé sans dossier_id.',
            details: 'Vérifiez les logs serveur pour plus d\'informations. Cela peut être dû à des permissions Supabase (RLS) ou à un champ manquant dans la table dossiers.'
          },
          { status: 500 }
        );
      } else {
        const rdvData = {
          tenant_id: tenantId,
          dossier_id: dossierId,
          client_id: client?.id || null,
          type_rdv: 'visite' as const,
          date_heure: creneauDateForDisplay.toISOString(),
          duree_minutes: 60,
          statut: 'confirme' as const,
          notes: `Créneau confirmé par le client via email le ${new Date().toLocaleString('fr-FR')}`,
          adresse: clientAddress || null
        };

        console.log('📝 Tentative de création du RDV avec les données:', {
          tenant_id: rdvData.tenant_id,
          dossier_id: rdvData.dossier_id,
          client_id: rdvData.client_id,
          date_heure: rdvData.date_heure,
          statut: rdvData.statut
        });

        console.log('🔍 [DEBUG] Avant insertion RDV - Vérification des données:', {
          tenant_id: rdvData.tenant_id,
          dossier_id: rdvData.dossier_id,
          client_id: rdvData.client_id,
          date_heure: rdvData.date_heure,
          statut: rdvData.statut,
          type_rdv: rdvData.type_rdv
        });

        const { data: newRdv, error: rdvError } = await supabase
          .from('rdv')
          .insert(rdvData)
          .select('id, date_heure, statut, titre, dossier_id, tenant_id')
          .single();

        if (rdvError) {
          console.error('❌ ERREUR CRITIQUE - Création RDV dans Supabase a ÉCHOUÉ:', rdvError);
          console.error('   Code:', rdvError.code);
          console.error('   Message:', rdvError.message);
          console.error('   Détails:', rdvError.details);
          console.error('   Hint:', rdvError.hint);
          console.error('   Données envoyées:', JSON.stringify(rdvData, null, 2));
          
          // Ne pas continuer silencieusement - retourner l'erreur
          return NextResponse.json(
            {
              success: false,
              error: 'RDV_CREATION_FAILED',
              message: 'Impossible de créer le RDV dans Supabase',
              details: rdvError.message,
              code: rdvError.code
            },
            { status: 500 }
          );
        } else if (newRdv) {
          rdvId = newRdv.id;
          console.log('✅ RDV créé avec succès dans Supabase:', {
            id: rdvId,
            tenant_id: newRdv.tenant_id,
            dossier_id: newRdv.dossier_id,
            date_heure: newRdv.date_heure,
            statut: newRdv.statut,
            titre: newRdv.titre
          });
        } else {
          console.error('❌ CRITIQUE: RDV créé mais aucune donnée retournée');
          return NextResponse.json(
            {
              success: false,
              error: 'RDV_CREATION_NO_DATA',
              message: 'Le RDV a été créé mais aucune donnée n\'a été retournée'
            },
            { status: 500 }
          );
        }
      }
    } catch (rdvErr: any) {
      console.error('❌ Erreur lors de la création du RDV:', rdvErr);
      console.error('   Stack:', rdvErr.stack);
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 2. CRÉER L'ÉVÉNEMENT DANS GOOGLE CALENDAR
    // ════════════════════════════════════════════════════════════════════════════
    // calendarEventId est déjà déclaré au niveau supérieur
    try {
      // Récupérer le token OAuth Google Calendar (avec metadata pour calendar_id)
      const { data: calendarConnection } = await supabase
        .from('oauth_connections')
        .select('access_token, refresh_token, expires_at, id, metadata')
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
        // Utiliser les dates ISO sans Z pour indiquer qu'elles sont en Europe/Paris
        const calendarEvent = {
          summary: `Visite chantier - ${clientName}`,
          description: `Visite de chantier confirmée avec ${clientName}${clientPhone ? `\nTéléphone: ${clientPhone}` : ''}${clientAddress ? `\nAdresse: ${clientAddress}` : ''}`,
          start: {
            dateTime: creneauDateISO,
            timeZone: 'Europe/Paris'
          },
          end: {
            dateTime: creneauEndISO,
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
        
        // Sujet simple sans emoji pour éviter les problèmes d'encodage UTF-8
        const dateSujet = creneauDateForDisplay.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        // Sujet sans caractères spéciaux pour éviter les problèmes d'encodage
        const subject = `Confirmation de votre visite de chantier - ${dateSujet}`;
        
        // Utiliser creneauDateForDisplay pour l'affichage (déjà en heure locale)
        const dateFormatee = creneauDateForDisplay.toLocaleString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Paris'
        });

        // displayClientName et displayAddress sont déjà définis plus haut

        const emailBody = `
Bonjour ${displayClientName},

Votre visite de chantier a été confirmée avec succès.

📅 **Date et heure :**
${dateFormatee}

📍 **Adresse :**
${displayAddress || 'À confirmer avec vous'}

Nous vous attendons à cette date et heure.

Cordialement,
${tenant.company_name ? (tenant.company_name.toLowerCase() === 'nos artisan' ? 'L\'équipe' : tenant.company_name) : 'L\'équipe'}
        `.trim();

        // Créer le message MIME avec encodage UTF-8 correct pour le sujet
        // Encoder le sujet en base64 pour éviter les problèmes d'encodage
        const encodedSubject = Buffer.from(subject, 'utf8').toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const mimeEmail = [
          `From: ${fromEmail}`,
          `To: ${email}`,
          `Subject: =?UTF-8?B?${encodedSubject}?=`,
          `Content-Type: text/plain; charset=utf-8`,
          `Content-Transfer-Encoding: 8bit`,
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
    // 4. NOTIFIER L'ARTISAN (UN SEUL ENVOI CONSOLIDÉ)
    // ════════════════════════════════════════════════════════════════════════════
    
    // 4.1. ENVOYER UN EMAIL DIRECT À L'ARTISAN (si email disponible)
    let artisanEmailSent = false;
    if (tenant?.email) {
      try {
        // Récupérer la connexion Gmail pour envoyer l'email
        const { data: gmailConnection } = await supabase
          .from('oauth_connections')
          .select('id, email, access_token, refresh_token, expires_at')
          .eq('tenant_id', tenantId)
          .eq('provider', 'google')
          .eq('service', 'gmail')
          .eq('is_active', true)
          .single();

        if (gmailConnection?.access_token) {
          let accessToken = gmailConnection.access_token;
          
          // Rafraîchir le token si nécessaire
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
              console.warn('Erreur rafraîchissement token Gmail pour artisan:', refreshErr);
            }
          }

          // Créer l'email de notification pour l'artisan
          const fromEmail = gmailConnection.email || 'noreply@example.com';
          // Utiliser displayClientName défini plus haut, avec fallback sur clientName
          const artisanClientName = displayClientName || clientName || 'Client';
          // Sujet sans emoji pour éviter les problèmes d'encodage
          const artisanSubject = `Nouveau RDV confirmé - ${artisanClientName} - ${creneauDateForDisplay.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Paris' })}`;
          
          // Utiliser creneauDateForDisplay pour l'affichage (déjà en heure locale)
          const dateFormateeArtisan = creneauDateForDisplay.toLocaleString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
          });

          const artisanEmailBody = `
Bonjour,

Un nouveau rendez-vous a été confirmé par un client.

📋 **INFORMATIONS DU RENDEZ-VOUS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 **Client :** ${artisanClientName || displayClientName || clientName || 'Client'}
📧 **Email :** ${email}
${clientPhone ? `📞 **Téléphone :** ${clientPhone}` : ''}

📅 **Date et heure :** ${dateFormateeArtisan}
${displayAddress ? `📍 **Adresse :** ${displayAddress}` : '📍 **Adresse :** À confirmer avec le client'}
⏱️ **Durée :** 60 minutes

${calendarEventId ? `📆 **Google Calendar :** Événement créé (ID: ${calendarEventId})` : ''}
${rdvId ? `🆔 **RDV ID :** ${rdvId}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Vous pouvez consulter ce rendez-vous dans votre agenda MyCharlie.

Cordialement,
Système MyCharlie
          `.trim();

          // Créer le message MIME
          const mimeEmailArtisan = [
            `From: ${fromEmail}`,
            `To: ${tenant.email}`,
            `Subject: ${artisanSubject}`,
            `Content-Type: text/plain; charset=utf-8`,
            '',
            artisanEmailBody
          ].join('\r\n');

          // Encoder en base64 URL-safe
          const encodedEmailArtisan = Buffer.from(mimeEmailArtisan, 'utf8').toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

          // Envoyer l'email via Gmail API
          const artisanEmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: encodedEmailArtisan })
          });

          if (artisanEmailResponse.ok) {
            console.log('✅ Email de notification envoyé à l\'artisan');
            artisanEmailSent = true;
          } else {
            const errorData = await artisanEmailResponse.json().catch(() => ({}));
            console.error('Erreur envoi email artisan:', errorData);
          }
        }
      } catch (artisanEmailErr: any) {
        console.error('Erreur lors de l\'envoi de l\'email à l\'artisan:', artisanEmailErr);
      }
    }

    // 4.2. NOTIFIER VIA LE WEBHOOK N8N (uniquement si l'email n'a pas été envoyé)
    if (!artisanEmailSent) {
      const n8nWebhookUrl = tenant.n8n_webhook_url || 'https://n8n.srv1271213.hstgr.cloud/webhook/869b3ab3-b632-40de-acec-8f5e0312cb7d/webhook';
      
      try {
        const message = `✅ CONFIRMATION DE CRÉNEAU : Le client ${displayClientName} a confirmé un créneau de visite de chantier. Le rendez-vous a été créé dans Google Calendar${calendarEventId ? ` (ID: ${calendarEventId})` : ''}${rdvId ? ` et dans le système (RDV ID: ${rdvId})` : ''}.`;

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
                client_name: displayClientName || clientName || 'Client',
                client_phone: clientPhone,
                client_address: displayAddress,
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
          console.log('✅ Artisan notifié via webhook n8n (email non disponible)');
        } else {
          console.error('Erreur appel n8n:', n8nResponse.status, await n8nResponse.text());
        }
      } catch (n8nError: any) {
        console.error('Erreur lors de l\'appel n8n:', n8nError);
      }
    } else {
      console.log('📧 Email déjà envoyé à l\'artisan, pas d\'appel webhook n8n nécessaire');
    }

    // ════════════════════════════════════════════════════════════════════════════
    // 5. CRÉER UNE NOTIFICATION DANS L'APPLICATION (avec délai pour éviter les doublons)
    // ════════════════════════════════════════════════════════════════════════════
    
    // Attendre 2 secondes pour éviter les doublons de notification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://mycharlie.fr'}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          type: 'rdv_confirme',
          titre: `Nouveau RDV confirmé - ${displayClientName}`,
          message: `Le client ${displayClientName} a confirmé un rendez-vous le ${creneauDateForDisplay.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}${displayAddress ? ` à ${displayAddress}` : ''}.`,
          data: {
            rdv_id: rdvId,
            client_id: client?.id,
            client_name: displayClientName || clientName || 'Client',
            client_email: email,
            client_phone: clientPhone,
            date_heure: creneau,
            adresse: displayAddress,
            calendar_event_id: calendarEventId,
            dossier_id: dossierId
          }
        })
      });

      if (notificationResponse.ok) {
        console.log('✅ Notification créée dans l\'application');
      } else {
        console.warn('⚠️ Erreur création notification:', await notificationResponse.text());
      }
    } catch (notificationErr: any) {
      console.error('Erreur lors de la création de la notification:', notificationErr);
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
            <p>${creneauDateForDisplay.toLocaleString('fr-FR', { 
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

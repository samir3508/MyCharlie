import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST - Vérifier les réponses email et déclencher le workflow n8n
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tenant_id, max_results } = body;

    if (!tenant_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'TENANT_ID_REQUIRED', 
          message: 'tenant_id est requis' 
        },
        { status: 400 }
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
      .eq('id', tenant_id)
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

    // Appeler le Code Tool n8n pour vérifier les réponses email
    // Le Code Tool appellera automatiquement le webhook n8n quand une confirmation est trouvée
    const n8nWebhookUrl = tenant.n8n_webhook_url || 'https://n8n.srv1129094.hstgr.cloud/webhook/Leo';
    
    // Construire le message pour appeler check-email-replies via le Code Tool
    const message = `Vérifie les réponses email aux créneaux proposés. Max résultats: ${max_results || 10}`;

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          chatInput: message,
          context: {
            tenant_id: tenant_id,
            tenant_name: tenant.company_name,
            conversation_date: new Date().toISOString().split('T')[0],
            is_whatsapp: false,
            check_email_replies: {
              max_results: max_results || 10,
              action: 'check-email-replies'
            }
          }
        }),
      });

      if (!n8nResponse.ok) {
        console.error('Erreur appel n8n:', n8nResponse.status, await n8nResponse.text());
        return NextResponse.json(
          { 
            success: false, 
            error: 'N8N_ERROR', 
            message: 'Erreur lors de l\'appel du workflow n8n' 
          },
          { status: 500 }
        );
      }

      const n8nData = await n8nResponse.json().catch(() => ({}));

      return NextResponse.json({
        success: true,
        message: 'Vérification des réponses email effectuée',
        data: n8nData,
        tenant_id: tenant_id
      });

    } catch (n8nError: any) {
      console.error('Erreur lors de l\'appel n8n:', n8nError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N_CONNECTION_ERROR', 
          message: n8nError.message || 'Erreur de connexion au workflow n8n' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erreur vérification réponses email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'SERVER_ERROR', 
        message: error.message || 'Erreur serveur lors de la vérification des réponses email' 
      },
      { status: 500 }
    );
  }
}

// GET - Vérifier les réponses email (pour les appels directs ou cron jobs)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenant_id = searchParams.get('tenant_id');
    const max_results = parseInt(searchParams.get('max_results') || '10', 10);

    if (!tenant_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'TENANT_ID_REQUIRED', 
          message: 'tenant_id est requis en paramètre (ex: ?tenant_id=xxx)' 
        },
        { status: 400 }
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
      .eq('id', tenant_id)
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

    // Appeler le Code Tool n8n pour vérifier les réponses email
    const n8nWebhookUrl = tenant.n8n_webhook_url || 'https://n8n.srv1129094.hstgr.cloud/webhook/Leo';
    
    const message = `Vérifie les réponses email aux créneaux proposés. Max résultats: ${max_results}`;

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          chatInput: message,
          context: {
            tenant_id: tenant_id,
            tenant_name: tenant.company_name,
            conversation_date: new Date().toISOString().split('T')[0],
            is_whatsapp: false,
            check_email_replies: {
              max_results: max_results,
              action: 'check-email-replies'
            }
          }
        }),
      });

      if (!n8nResponse.ok) {
        console.error('Erreur appel n8n:', n8nResponse.status, await n8nResponse.text());
        return NextResponse.json(
          { 
            success: false, 
            error: 'N8N_ERROR', 
            message: 'Erreur lors de l\'appel du workflow n8n' 
          },
          { status: 500 }
        );
      }

      const n8nData = await n8nResponse.json().catch(() => ({}));

      return NextResponse.json({
        success: true,
        message: 'Vérification des réponses email effectuée',
        data: n8nData,
        tenant_id: tenant_id
      });

    } catch (n8nError: any) {
      console.error('Erreur lors de l\'appel n8n:', n8nError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N_CONNECTION_ERROR', 
          message: n8nError.message || 'Erreur de connexion au workflow n8n' 
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Erreur vérification réponses email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'SERVER_ERROR', 
        message: error.message || 'Erreur serveur lors de la vérification des réponses email' 
      },
      { status: 500 }
    );
  }
}

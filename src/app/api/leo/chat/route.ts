import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mcpClient } from '@/lib/mcp/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Augmenté à 120 secondes pour laisser plus de temps à N8N

// Constantes
const MAX_MESSAGE_LENGTH = 5000
const MAX_HISTORY_LENGTH = 20

// Fonction pour convertir les URLs relatives en URLs absolues
function convertToAbsoluteUrls(text: string, request: NextRequest): string {
  const host = request.headers.get('host') || 'mycharlie.fr'
  const protocol = 'https'
  const baseUrl = `${protocol}://${host}`
  
  return text
    // Remplacer les URLs localhost en URLs de production
    .replace(/http:\/\/localhost:3000\//g, `${baseUrl}/`)
    // Remplacer les URLs relatives de PDF
    .replace(/\/api\/pdf\/devis\/([a-f0-9-]{36})/g, `${baseUrl}/api/pdf/devis/$1`)
    .replace(/\/api\/pdf\/facture\/([a-f0-9-]{36})/g, `${baseUrl}/api/pdf/facture/$1`)
    // Remplacer les URLs relatives des pages
    .replace(/\/devis\/([a-f0-9-]{36})/g, `${baseUrl}/devis/$1`)
    .replace(/\/factures\/([a-f0-9-]{36})/g, `${baseUrl}/factures/$1`)
    // Remplacer les URLs de signature
    .replace(/\/sign\/([a-f0-9-]{36})/g, `${baseUrl}/sign/$1`)
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)

  console.log(`🚀 [Chat API ${requestId}] Request started`)

  try {
    // Parser le body avec gestion d'erreur
    let body: { message?: string; conversationId?: string; tenantId?: string }
    try {
      body = await req.json()
    } catch (e) {
      console.error(`❌ [Chat API ${requestId}] Invalid JSON body`)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { message, conversationId } = body

    // Validation du message
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      )
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
        { status: 400 }
      )
    }

    console.log(`📨 [Chat API ${requestId}] Message: "${trimmedMessage.substring(0, 50)}..."`)

    // Authentification
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error(`❌ [Chat API ${requestId}] Auth error:`, authError?.message)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, company_name, email')
      .eq('user_id', user.id)
      .single()

    if (tenantError || !tenant) {
      console.error(`❌ [Chat API ${requestId}] Tenant not found:`, tenantError?.message)
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    console.log(`👤 [Chat API ${requestId}] Tenant: ${tenant.company_name}`)

    // Fonction helper pour obtenir la date du jour (YYYY-MM-DD) en heure locale
    const getTodayDate = () => {
      const now = new Date()
      // Utiliser la date locale, pas UTC, pour éviter les problèmes de fuseau horaire
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}` // Format: YYYY-MM-DD (heure locale)
    }

    const todayDate = getTodayDate()

    // Gérer conversation : une conversation par jour, peu importe le canal (app ou WhatsApp)
    let activeConversationId = conversationId

    if (!activeConversationId) {
      // Chercher la conversation du jour (peu importe le canal)
      // On utilise whatsapp_phone comme identifiant de date : format "YYYY-MM-DD"
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('whatsapp_phone', todayDate) // Utiliser la date comme identifiant
        .single()

      if (existingConv) {
        activeConversationId = existingConv.id
        console.log(`✅ [Chat API ${requestId}] Found today's conversation: ${activeConversationId}`)
      } else {
        // Créer une nouvelle conversation pour aujourd'hui
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            tenant_id: tenant.id,
            whatsapp_phone: todayDate, // Stocker la date dans whatsapp_phone
            last_message: trimmedMessage.substring(0, 100),
            last_message_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (convError || !newConv) {
          console.error(`❌ [Chat API ${requestId}] Failed to create conversation:`, convError?.message)
          return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
          )
        }

        activeConversationId = newConv.id
        console.log(`📝 [Chat API ${requestId}] Created new conversation for today: ${activeConversationId}`)
      }
    }

    console.log(`💬 [Chat API ${requestId}] Conversation: ${activeConversationId}`)

    // Récupérer historique (limité)
    const { data: historyMessages } = await supabase
      .from('messages')
      .select('direction, message, created_at')
      .eq('conversation_id', activeConversationId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_LENGTH)

    const history = (historyMessages || [])
      .reverse()
      .map((msg) => ({
        role: msg.direction === 'outbound' ? 'user' : 'assistant',
        content: msg.message,
        timestamp: msg.created_at,
      })) as Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>

    console.log(`📜 [Chat API ${requestId}] History: ${history.length} messages`)

    // Sauvegarder message utilisateur AVANT d'appeler LÉO
    const { data: insertedUserMessage, error: insertUserMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeConversationId,
        direction: 'outbound',
        message: trimmedMessage,
        message_type: 'text',
      })
      .select()
      .single()

    if (insertUserMsgError) {
      console.error(`❌ [Chat API ${requestId}] Failed to save user message:`, insertUserMsgError.message)
      console.error(`❌ [Chat API ${requestId}] Conversation ID used:`, activeConversationId)
      // On continue quand même, ce n'est pas bloquant
    } else {
      console.log(`✅ [Chat API ${requestId}] User message saved to DB:`, {
        id: insertedUserMessage?.id,
        conversation_id: insertedUserMessage?.conversation_id,
        direction: insertedUserMessage?.direction,
        created_at: insertedUserMessage?.created_at
      })
    }

    // Appeler LÉO via MCP
    console.log(`🤖 [Chat API ${requestId}] Calling LÉO...`)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:176',message:'Before calling mcpClient.chat',data:{messageLength:trimmedMessage.length,tenantId:tenant.id,conversationId:activeConversationId,historyLength:history.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    let leoResponse: string
    let actions: any[] = []

    try {
      const chatParams = {
        message: trimmedMessage,
        tenantId: tenant.id,
        tenantName: tenant.company_name,
        tenantEmail: tenant.email || user.email || '',
        conversationId: activeConversationId,
        history: history,
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:189',message:'Calling mcpClient.chat with params',data:{chatParams:JSON.stringify(chatParams)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      
      const mcpResponse = await mcpClient.chat(chatParams)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:194',message:'Received mcpResponse',data:{hasResult:!!mcpResponse.result,hasResponse:!!mcpResponse.result?.response,responseLength:mcpResponse.result?.response?.length||0,hasActions:!!mcpResponse.result?.actions,actionsCount:mcpResponse.result?.actions?.length||0,actions:JSON.stringify(mcpResponse.result?.actions||[]),fullResponse:JSON.stringify(mcpResponse).substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      leoResponse = mcpResponse.result?.response || ''
      actions = mcpResponse.result?.actions || []
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:198',message:'Extracted response and actions',data:{leoResponseLength:leoResponse.length,leoResponsePreview:leoResponse.substring(0,200),actionsCount:actions.length,actionsFull:JSON.stringify(actions),actionsDetails:actions.map((a:any,i:number)=>({index:i,name:a.name||a.tool||'unknown',args:a.args||a.input||{},sql:a.args?.sql||a.input?.sql||'no sql'})).map((d:any,i:number)=>({...d,argsPreview:JSON.stringify(d.args).substring(0,500),sqlPreview:d.sql.substring(0,500)||'no sql'}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Vérifier que la réponse n'est pas vide
      if (!leoResponse.trim()) {
        console.warn(`⚠️ [Chat API ${requestId}] Empty response from MCP, using fallback`)
        leoResponse = generateLocalResponse(trimmedMessage, { tenant_name: tenant.company_name })
      }

      console.log(`✅ [Chat API ${requestId}] LÉO responded (${leoResponse.length} chars)`)
      if (leoResponse.length < 50) {
        console.warn(`⚠️ [Chat API ${requestId}] Response seems too short: "${leoResponse}"`)
      }
      
      // Convertir les URLs localhost vers production dans la réponse LÉO
      leoResponse = convertToAbsoluteUrls(leoResponse, req)
      
      // Convertir les URLs dans les actions aussi
      actions = actions.map(action => ({
        ...action,
        args: action.args ? JSON.parse(JSON.stringify(action.args).replace(/http:\/\/localhost:3000\//g, 'https://mycharlie.fr/')) : action.args
      }))

      // Sauvegarder réponse LÉO IMMÉDIATEMENT après réception
      console.log(`💾 [Chat API ${requestId}] Saving LÉO response to database...`)
      const { error: insertLeoMsgError, data: insertedMessage } = await supabase
        .from('messages')
        .insert({
          conversation_id: activeConversationId,
          direction: 'inbound',
          message: leoResponse,
          message_type: 'text',
        })
        .select()
        .single()

      if (insertLeoMsgError) {
        console.error(`❌ [Chat API ${requestId}] Failed to save LÉO response:`, insertLeoMsgError.message)
        console.error(`❌ [Chat API ${requestId}] Error details:`, JSON.stringify(insertLeoMsgError, null, 2))
        console.error(`❌ [Chat API ${requestId}] Conversation ID used:`, activeConversationId)
      } else {
        console.log(`✅ [Chat API ${requestId}] LÉO response saved to DB:`, {
          id: insertedMessage?.id,
          conversation_id: insertedMessage?.conversation_id,
          direction: insertedMessage?.direction,
          message_length: insertedMessage?.message?.length,
          created_at: insertedMessage?.created_at
        })
      }
      
    } catch (mcpError: any) {
      console.error(`❌ [Chat API ${requestId}] MCP Error:`, {
        message: mcpError.message,
        name: mcpError.name,
        stack: mcpError.stack?.substring(0, 500),
        cause: mcpError.cause,
      })
      
      // Fallback: Réponse locale
      leoResponse = generateLocalResponse(trimmedMessage, { tenant_name: tenant.company_name })
      console.warn(`⚠️ [Chat API ${requestId}] Using local fallback response: "${leoResponse.substring(0, 100)}"`)
      
      // Sauvegarder aussi la réponse de fallback
      const { error: insertFallbackError } = await supabase.from('messages').insert({
        conversation_id: activeConversationId,
        direction: 'inbound',
        message: leoResponse,
        message_type: 'text',
      })
      
      if (insertFallbackError) {
        console.error(`❌ [Chat API ${requestId}] Failed to save fallback response:`, insertFallbackError.message)
      }
    }

    // Mettre à jour conversation
    await supabase
      .from('conversations')
      .update({
        last_message: leoResponse.substring(0, 100),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', activeConversationId)

    // Convertir les URLs relatives en URLs absolues pour WhatsApp
    const responseWithAbsoluteUrls = convertToAbsoluteUrls(leoResponse, req)
    
    const processingTime = Date.now() - startTime
    console.log(`✅ [Chat API ${requestId}] Done in ${processingTime}ms`)

    return NextResponse.json({
      success: true,
      response: responseWithAbsoluteUrls,
      conversationId: activeConversationId,
      actions: actions,
      metadata: {
        processing_time: processingTime,
        request_id: requestId,
      },
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [Chat API ${requestId}] Unhandled error:`, error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        request_id: requestId,
        processing_time: processingTime,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const health = await mcpClient.healthCheck()

    const isHealthy = health.status === 'ok'

    return NextResponse.json({
      status: isHealthy ? 'ok' : 'error',
      mcp_url: process.env.NEXT_PUBLIC_MCP_SERVER_URL || process.env.MCP_N8N_URL,
      latency: health.latency,
      error: health.error,
      note: health.error?.includes('not supported') 
        ? 'Serveur accessible mais méthode ping non supportée (normal)' 
        : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ [Health Check] Error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    )
  }
}

// Fonction de réponse locale (fallback si MCP non disponible)
// Retourne une réponse minimale - LÉO doit répondre via MCP/N8N
function generateLocalResponse(message: string, context: { tenant_name: string }): string {
  return 'Désolé, je ne peux pas répondre pour le moment. Veuillez vérifier la connexion avec LÉO.'
}

/**
 * Client MCP pour communiquer avec l'agent LÉO sur N8N
 * Version améliorée avec meilleure gestion des erreurs et timeouts
 */

// Constantes
const DEFAULT_TIMEOUT = 90000 // 90 secondes (pour laisser plus de temps à N8N de répondre)
const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // 1 seconde entre les retries

/**
 * Parse Server-Sent Events (SSE) response from N8N MCP server
 */
function parseSSEResponse(text: string): any {
  console.log('🔄 [SSE Parser] Parsing response...')
  
  const lines = text.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Chercher la ligne qui commence par "data:"
    if (trimmedLine.startsWith('data:')) {
      const jsonString = trimmedLine.substring(5).trim()
      
      if (!jsonString) continue
      
      console.log('📦 [SSE Parser] Found data:', jsonString.substring(0, 100) + '...')
      
      try {
        return JSON.parse(jsonString)
      } catch (e) {
        console.error('❌ [SSE Parser] Parse error:', e)
        continue // Essayer la ligne suivante
      }
    }
  }
  
  // Si aucune ligne "data:" trouvée, essayer de parser tout le texte comme JSON
  console.log('⚠️ [SSE Parser] No data: line found, trying direct JSON parse')
  
  try {
    return JSON.parse(text)
  } catch (e) {
    console.error('❌ [SSE Parser] Failed to parse as JSON:', text.substring(0, 200))
    throw new Error('Invalid response format from MCP server')
  }
}

interface MCPChatRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params: {
    message: string
    context: {
      tenant_id: string
      tenant_name: string
      tenant_email: string
      supabase_url: string
      supabase_key: string
      conversation_id?: string
      history?: Array<{
        role: 'user' | 'assistant'
        content: string
        timestamp: string
      }>
      timestamp: string
      channel: 'web' | 'whatsapp'
    }
  }
}

interface MCPChatResponse {
  jsonrpc: '2.0'
  id: number
  result?: {
    response: string
    thinking?: string
    actions?: Array<{
      type: string
      data: any
    }>
  }
  error?: {
    code: number
    message: string
  }
}

interface ChatParams {
  message: string
  tenantId: string
  tenantName: string
  tenantEmail: string
  conversationId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>
}

/**
 * Fonction utilitaire pour attendre
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class MCPClient {
  private baseUrl: string
  private webhookUrl: string | null
  private useWebhook: boolean
  private timeout: number

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MCP_SERVER_URL || process.env.MCP_N8N_URL || ''
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || null
    this.useWebhook = !!this.webhookUrl
    this.timeout = parseInt(process.env.MCP_REQUEST_TIMEOUT || String(DEFAULT_TIMEOUT))

    if (!this.baseUrl && !this.webhookUrl) {
      console.warn('⚠️ [MCP Client] No MCP or Webhook URL configured')
    } else if (this.useWebhook) {
      console.log('✅ [MCP Client] Webhook mode:', this.webhookUrl?.substring(0, 50) + '...')
    } else {
      console.log('✅ [MCP Client] MCP mode:', this.baseUrl?.substring(0, 50) + '...')
    }
  }

  async chat(params: ChatParams): Promise<MCPChatResponse> {
    // Utiliser le webhook si configuré
    if (this.useWebhook && this.webhookUrl) {
      return this.chatViaWebhook(params)
    }

    // Sinon, utiliser MCP JSON-RPC
    if (!this.baseUrl) {
      throw new Error('MCP Server URL not configured. Please set NEXT_PUBLIC_MCP_SERVER_URL or N8N_WEBHOOK_URL in .env.local')
    }

    return this.chatViaMCP(params)
  }

  /**
   * Chat via MCP JSON-RPC
   */
  private async chatViaMCP(params: ChatParams, attempt = 1): Promise<MCPChatResponse> {
    const requestId = Date.now()
    const method = process.env.N8N_MCP_METHOD || 'chat'
    const token = process.env.N8N_MCP_TOKEN

    const payload: MCPChatRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method: method,
      params: {
        message: params.message,
        context: {
          tenant_id: params.tenantId,
          tenant_name: params.tenantName,
          tenant_email: params.tenantEmail,
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          conversation_id: params.conversationId,
          history: params.history || [],
          timestamp: new Date().toISOString(),
          channel: 'web',
        },
      },
    }

    console.log(`🔑 [MCP Client] Attempt ${attempt}/${MAX_RETRIES + 1}`)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ [MCP Client] HTTP error:', response.status, errorText)
        
        // Retry sur erreurs serveur (5xx)
        if (response.status >= 500 && attempt <= MAX_RETRIES) {
          console.log(`⏳ [MCP Client] Retrying in ${RETRY_DELAY}ms...`)
          await sleep(RETRY_DELAY)
          return this.chatViaMCP(params, attempt + 1)
        }
        
        throw new Error(`MCP Server error (${response.status}): ${errorText}`)
      }

      const responseText = await response.text()
      console.log('📥 [MCP Client] Response:', responseText.substring(0, 200))

      const data = parseSSEResponse(responseText)

      if (data.error) {
        throw new Error(`MCP Error [${data.error.code}]: ${data.error.message}`)
      }

      return data

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏱️ [MCP Client] Timeout')
        
        // Retry sur timeout
        if (attempt <= MAX_RETRIES) {
          console.log(`⏳ [MCP Client] Retrying after timeout...`)
          await sleep(RETRY_DELAY)
          return this.chatViaMCP(params, attempt + 1)
        }
        
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      
      throw error
    }
  }

  /**
   * Chat via Webhook HTTP standard (plus simple et fiable)
   */
  private async chatViaWebhook(params: ChatParams, attempt = 1): Promise<MCPChatResponse> {
    if (!this.webhookUrl) {
      throw new Error('Webhook URL not configured')
    }

    console.log(`🌐 [MCP Client] Webhook attempt ${attempt}/${MAX_RETRIES + 1}`)

    // Get base URL for PDF links
    // Pour WhatsApp, on doit utiliser l'IP locale au lieu de localhost
    // Vérifier si on doit utiliser l'IP locale (pour WhatsApp ou dev local)
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                  process.env.NEXT_PUBLIC_SITE_URL || 
                  'https://app.myleo.fr' // Fallback
    
    // Si baseUrl contient localhost et qu'on a une IP locale configurée, l'utiliser
    if (baseUrl.includes('localhost') && process.env.NEXT_PUBLIC_LOCAL_IP) {
      baseUrl = baseUrl.replace('localhost', process.env.NEXT_PUBLIC_LOCAL_IP)
      console.log(`📱 [MCP Client] Using local IP for WhatsApp: ${baseUrl}`)
    }
    
    // Déterminer le canal (web ou whatsapp) en fonction du contexte
    // Si c'est un message venant de WhatsApp, le canal sera 'whatsapp'
    // Pour l'instant, on détecte via une variable d'environnement ou on peut le passer en paramètre
    const channel: 'web' | 'whatsapp' = (process.env.WHATSAPP_MODE === 'true' || 
                                         process.env.NEXT_PUBLIC_LOCAL_IP) ? 'whatsapp' : 'web'

    const payload = {
      message: params.message,
      chatInput: params.message, // Format N8N Chat Trigger
      context: {
        tenant_id: params.tenantId,
        tenant_name: params.tenantName,
        tenant_email: params.tenantEmail,
        conversation_id: params.conversationId,
        history: params.history || [],
        timestamp: new Date().toISOString(),
        channel: channel,
        base_url: baseUrl, // URL de base pour générer les liens PDF complets (accessible depuis WhatsApp)
      },
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:259',message:'Sending payload to N8N webhook',data:{webhookUrl:this.webhookUrl?.substring(0,50)+'...',payload:JSON.stringify(payload).substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      console.log(`📤 [MCP Client] Sending request to webhook: ${this.webhookUrl}`)
      console.log(`📤 [MCP Client] Payload preview:`, {
        messageLength: payload.message?.length || 0,
        hasContext: !!payload.context,
        tenantId: payload.context?.tenant_id,
        conversationId: payload.context?.conversation_id,
      })

      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      console.log(`📥 [MCP Client] Response status: ${response.status} ${response.statusText}`)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:272',message:'Received response from N8N',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ [MCP Client] Webhook error:', response.status, errorText)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:277',message:'N8N webhook error',data:{status:response.status,errorText:errorText.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        
        // Retry sur erreurs serveur
        if (response.status >= 500 && attempt <= MAX_RETRIES) {
          console.log(`⏳ [MCP Client] Retrying webhook in ${RETRY_DELAY}ms...`)
          await sleep(RETRY_DELAY)
          return this.chatViaWebhook(params, attempt + 1)
        }
        
        throw new Error(`Webhook error (${response.status}): ${errorText}`)
      }

      // Lire la réponse brute d'abord pour debug
      const responseTextRaw = await response.text()
      console.log('📦 [MCP Client] Raw response (first 500 chars):', responseTextRaw.substring(0, 500))
      
      let responseData: any
      try {
        responseData = JSON.parse(responseTextRaw)
      } catch (parseError) {
        // Si ce n'est pas du JSON, c'est peut-être une string plain
        console.warn('⚠️ [MCP Client] Response is not valid JSON, treating as plain text')
        responseData = { response: responseTextRaw }
      }
      
      console.log('✅ [MCP Client] Webhook response received', {
        isArray: Array.isArray(responseData),
        dataType: typeof responseData,
        keys: responseData && typeof responseData === 'object' ? Object.keys(responseData) : [],
        hasResponse: typeof responseData?.response === 'string',
        responseLength: typeof responseData?.response === 'string' ? responseData.response.length : 0,
      })
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:291',message:'Parsed N8N response data',data:{isArray:Array.isArray(responseData),dataType:typeof responseData,hasResponse:typeof responseData?.response==='string',hasOutput:typeof responseData?.output==='string',hasMessage:typeof responseData?.message==='string',hasActions:!!responseData?.actions,actionsCount:responseData?.actions?.length||0,actionsFull:JSON.stringify(responseData?.actions||[]),actionsDetails:responseData?.actions?.map((a:any,i:number)=>({index:i,name:a.name||a.tool||'unknown',args:a.args||a.input||{},sql:a.args?.sql||a.input?.sql||'no sql',error:a.error||null})).map((d:any,i:number)=>({...d,argsPreview:JSON.stringify(d.args).substring(0,1000),sqlPreview:(d.sql||'').substring(0,1000),errorPreview:d.error?JSON.stringify(d.error).substring(0,500):null})),fullResponse:JSON.stringify(responseData).substring(0,5000)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
      // #endregion

      // Normaliser la réponse
      const data = Array.isArray(responseData) ? responseData[0] : responseData
      
      let responseText = ''
      
      // Chercher dans différents formats possibles (ordre d'importance)
      if (typeof data?.response === 'string' && data.response.trim()) {
        responseText = data.response
        console.log('✅ [MCP Client] Found response in data.response')
      } else if (typeof data?.output === 'string' && data.output.trim()) {
        responseText = data.output
        console.log('✅ [MCP Client] Found response in data.output')
      } else if (typeof data?.message === 'string' && data.message.trim()) {
        responseText = data.message
        console.log('✅ [MCP Client] Found response in data.message')
      } else if (typeof data?.text === 'string' && data.text.trim()) {
        responseText = data.text
        console.log('✅ [MCP Client] Found response in data.text')
      } else if (data && typeof data === 'object') {
        // Si c'est un objet mais qu'on n'a pas trouvé de champ texte, chercher récursivement
        // ou essayer de parser si c'est une string JSON stringifiée
        const stringified = JSON.stringify(data)
        if (stringified.startsWith('"{') && stringified.endsWith('}"')) {
          // Cas où JSON.stringify() a été utilisé dans N8N (double stringification)
          try {
            const parsed = JSON.parse(data)
            if (typeof parsed?.response === 'string') {
              responseText = parsed.response
              console.log('✅ [MCP Client] Found response after parsing double-stringified JSON')
            } else {
              responseText = stringified
              console.warn('⚠️ [MCP Client] Using stringified object as fallback')
            }
          } catch {
            responseText = stringified
            console.warn('⚠️ [MCP Client] Using stringified object as fallback (parse failed)')
          }
        } else {
          responseText = stringified
          console.warn('⚠️ [MCP Client] Using stringified object as fallback')
        }
      } else if (typeof data === 'string') {
        responseText = data
        console.log('✅ [MCP Client] Response is plain string')
      }
      
      if (!responseText || !responseText.trim()) {
        console.error('❌ [MCP Client] No valid response text found!', {
          dataType: typeof data,
          dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
          dataPreview: JSON.stringify(data).substring(0, 200),
        })
        throw new Error('Empty response from N8N webhook')
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fe9dfe82-6840-48ba-a23f-3a5c652bdf20',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:310',message:'Extracted response text from N8N',data:{responseTextLength:responseText.length,responseTextPreview:responseText.substring(0,500),hasActions:!!responseData.actions,actionsCount:responseData.actions?.length||0,actionsFull:JSON.stringify(responseData.actions||[]),actionsWithSQL:responseData.actions?.filter((a:any)=>(a.args?.sql||a.input?.sql)).map((a:any,i:number)=>({index:i,sql:(a.args?.sql||a.input?.sql||'').substring(0,1000),name:a.name||a.tool||'unknown',error:a.error||null}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      
      console.log('💬 [MCP Client] Extracted:', responseText.substring(0, 100))

      return {
        jsonrpc: '2.0',
        id: Date.now(),
        result: {
          response: responseText,
          actions: responseData.actions || [],
        },
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏱️ [MCP Client] Webhook timeout')
        
        if (attempt <= MAX_RETRIES) {
          console.log(`⏳ [MCP Client] Retrying webhook after timeout...`)
          await sleep(RETRY_DELAY)
          return this.chatViaWebhook(params, attempt + 1)
        }
        
        throw new Error(`Request timeout after ${this.timeout}ms`)
      }
      
      throw error
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'error'; latency?: number; error?: string }> {
    // Pour le webhook, considérer comme ok si configuré
    if (this.useWebhook && this.webhookUrl) {
      return { status: 'ok', latency: 0 }
    }

    if (!this.baseUrl) {
      return { status: 'error', error: 'MCP Server URL not configured' }
    }

    const start = Date.now()
    const token = process.env.N8N_MCP_TOKEN

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout pour health check

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 999,
          method: 'ping',
          params: {},
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const latency = Date.now() - start

      // 200, 406 (ping non supporté) = serveur accessible
      if (response.ok || response.status === 406) {
        return { 
          status: 'ok', 
          latency,
          error: response.status === 406 ? 'Ping not supported but server reachable' : undefined
        }
      }

      return { 
        status: 'error', 
        error: `HTTP ${response.status}`,
        latency 
      }

    } catch (error) {
      console.error('❌ [MCP Client] Health check failed:', error)
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Export a singleton instance
export const mcpClient = new MCPClient()

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/founder-kpis
 * KPIs fondateur : artisans (tenants), usage (clients, devis, factures, dossiers, RDV, agents IA).
 *
 * Auth (au choix) :
 * - Bearer : Authorization: Bearer <FOUNDER_API_KEY> (pour app séparée type MyCharlie Backoffice)
 * - Session : connecté avec email dans FOUNDER_EMAILS (usage dans MyCharlie)
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FOUNDER_API_KEY?.trim()
    const authHeader = request.headers.get('Authorization')
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

    let allowed = false
    if (apiKey && bearer && bearer === apiKey) {
      allowed = true
    } else {
      const supabase = await createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.email) {
        const founderEmails = (process.env.FOUNDER_EMAILS || '')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        if (founderEmails.includes(user.email.toLowerCase())) allowed = true
      }
    }

    if (!allowed) {
      if (bearer) {
        return NextResponse.json({ error: 'Clé API invalide' }, { status: 401 })
      }
      const supabase = await createServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const founderEmails = (process.env.FOUNDER_EMAILS || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
      if (!founderEmails.length) {
        return NextResponse.json(
          { error: 'FOUNDER_EMAILS non configuré' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Accès réservé aux fondateurs', email: user.email },
        { status: 403 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const [
      { data: tenants },
      { data: clientsData },
      { data: devisData },
      { data: facturesData },
      { data: dossiersData },
      { data: rdvData },
      { data: agentData },
    ] = await Promise.all([
      supabaseAdmin
        .from('tenants')
        .select('id, company_name, subscription_status, subscription_plan, trial_ends_at, whatsapp_connected, created_at')
        .order('created_at', { ascending: false }),
      supabaseAdmin.from('clients').select('tenant_id'),
      supabaseAdmin.from('devis').select('tenant_id, created_at'),
      supabaseAdmin.from('factures').select('tenant_id, created_at'),
      supabaseAdmin.from('dossiers').select('tenant_id, created_at'),
      supabaseAdmin.from('rdv').select('tenant_id, created_at'),
      supabaseAdmin.from('n8n_chat_histories').select('tenant_id, created_at'),
    ])

    const toArr = <T>(x: T[] | null): T[] => x || []
    const countByTenant = (arr: { tenant_id: string | null }[]) => {
      const m: Record<string, number> = {}
      for (const r of arr) {
        const id = r.tenant_id || ''
        if (!id) continue
        m[id] = (m[id] || 0) + 1
      }
      return m
    }
    const lastByTenant = (arr: { tenant_id: string | null; created_at: string | null }[]) => {
      const m: Record<string, string> = {}
      for (const r of arr) {
        const id = r.tenant_id || ''
        const at = r.created_at || ''
        if (!id || !at) continue
        if (!m[id] || at > m[id]) m[id] = at
      }
      return m
    }

    const clientsMap = countByTenant(toArr(clientsData))
    const devisMap = countByTenant(toArr(devisData))
    const facturesMap = countByTenant(toArr(facturesData))
    const dossiersMap = countByTenant(toArr(dossiersData))
    const rdvMap = countByTenant(toArr(rdvData))
    const agentMap = countByTenant(toArr(agentData))

    const devisLast = lastByTenant(toArr(devisData))
    const facturesLast = lastByTenant(toArr(facturesData))
    const dossiersLast = lastByTenant(toArr(dossiersData))
    const rdvLast = lastByTenant(toArr(rdvData))
    const agentLast = lastByTenant(toArr(agentData))

    const getLastActivity = (tid: string) => {
      const dates = [devisLast[tid], facturesLast[tid], dossiersLast[tid], rdvLast[tid], agentLast[tid]].filter(Boolean) as string[]
      return dates.length ? dates.sort().reverse()[0]! : null
    }

    const byPlan: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    let trialEndingSoon = 0
    let whatsappConnected = 0
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    for (const t of toArr(tenants)) {
      const plan = t.subscription_plan || 'starter'
      byPlan[plan] = (byPlan[plan] || 0) + 1
      const status = t.subscription_status || 'trial'
      byStatus[status] = (byStatus[status] || 0) + 1
      if (t.whatsapp_connected) whatsappConnected++
      if (t.subscription_status === 'trial' && t.trial_ends_at) {
        const end = new Date(t.trial_ends_at)
        if (end <= in7Days && end >= now) trialEndingSoon++
      }
    }

    const usage = toArr(tenants).map((t) => ({
      tenantId: t.id,
      companyName: t.company_name || 'Sans nom',
      subscriptionPlan: t.subscription_plan || 'starter',
      subscriptionStatus: t.subscription_status || 'trial',
      trialEndsAt: t.trial_ends_at,
      whatsappConnected: !!t.whatsapp_connected,
      createdAt: t.created_at,
      clients: clientsMap[t.id] || 0,
      devis: devisMap[t.id] || 0,
      factures: facturesMap[t.id] || 0,
      dossiers: dossiersMap[t.id] || 0,
      rdv: rdvMap[t.id] || 0,
      agentMessages: agentMap[t.id] || 0,
      lastActivity: getLastActivity(t.id),
    }))

    return NextResponse.json({
      kpis: {
        tenantsTotal: toArr(tenants).length,
        byPlan,
        byStatus,
        trialEndingSoon,
        whatsappConnected,
      },
      usage,
    })
  } catch (e: unknown) {
    console.error('[founder-kpis]', e)
    return NextResponse.json(
      { error: 'Internal server error', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

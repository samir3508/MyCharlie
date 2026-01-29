import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const MS_7J = 7 * 24 * 60 * 60 * 1000
const MS_14J = 14 * 24 * 60 * 60 * 1000
const MS_30J = 30 * 24 * 60 * 60 * 1000

/**
 * GET /api/admin/founder-kpis
 * KPIs fondateur : artisans, usage, activation, alertes, adoption agents/fonctionnalités.
 *
 * Auth : Bearer FOUNDER_API_KEY ou session (email dans FOUNDER_EMAILS).
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
    const countByTenantLast7d = (arr: { tenant_id: string | null; created_at: string | null }[], now: Date) => {
      const m: Record<string, number> = {}
      const cut = new Date(now.getTime() - MS_7J).toISOString()
      for (const r of arr) {
        const id = r.tenant_id || ''
        const at = r.created_at || ''
        if (!id || !at || at < cut) continue
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

    const now = new Date()
    const in7Days = new Date(now.getTime() + MS_7J)

    const clientsMap = countByTenant(toArr(clientsData))
    const devisMap = countByTenant(toArr(devisData))
    const devis7jMap = countByTenantLast7d(toArr(devisData), now)
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

    const total = toArr(tenants).length
    let activated = 0
    let actifs7j = 0
    let actifs30j = 0
    let inactifs14j = 0
    let withAgents = 0
    const adoptionDevis = { count: 0, pct: 0 }
    const adoptionFactures = { count: 0, pct: 0 }
    const adoptionDossiers = { count: 0, pct: 0 }
    const adoptionRdv = { count: 0, pct: 0 }
    const adoptionAgents = { count: 0, pct: 0, totalMessages: 0 }

    const usage = toArr(tenants).map((t) => {
      const clients = clientsMap[t.id] || 0
      const devis = devisMap[t.id] || 0
      const devis7j = devis7jMap[t.id] || 0
      const factures = facturesMap[t.id] || 0
      const dossiers = dossiersMap[t.id] || 0
      const rdv = rdvMap[t.id] || 0
      const agentMessages = agentMap[t.id] || 0
      const lastActivity = getLastActivity(t.id)

      const isActivated = clients >= 1 && devis >= 1 && agentMessages >= 1
      if (isActivated) activated++

      let isActif7j = false
      let isActif30j = false
      let isInactif14j = false
      if (lastActivity) {
        const d = new Date(lastActivity).getTime()
        const t7 = now.getTime() - MS_7J
        const t30 = now.getTime() - MS_30J
        const t14 = now.getTime() - MS_14J
        isActif7j = d >= t7
        isActif30j = d >= t30
        isInactif14j = d < t14
      } else {
        isInactif14j = true
      }
      if (isActif7j) actifs7j++
      if (isActif30j) actifs30j++
      if (isInactif14j) inactifs14j++

      if (agentMessages >= 1) withAgents++
      adoptionAgents.totalMessages += agentMessages
      if (devis >= 1) adoptionDevis.count++
      if (factures >= 1) adoptionFactures.count++
      if (dossiers >= 1) adoptionDossiers.count++
      if (rdv >= 1) adoptionRdv.count++

      const trialEndsAt = t.trial_ends_at ? new Date(t.trial_ends_at) : null
      const isTrialChaud = t.subscription_status === 'trial' && trialEndsAt && trialEndsAt <= in7Days && trialEndsAt >= now
      const aUtilise = clients >= 1 || devis >= 1 || agentMessages >= 1
      const usageFaible = clients < 2 && devis < 2 && agentMessages < 5
      const riskReasons: string[] = []
      if (!t.whatsapp_connected) riskReasons.push('WhatsApp non connecté')
      if (devis7j === 0 && aUtilise) riskReasons.push('0 devis sur 7j')
      if (isInactif14j && aUtilise) riskReasons.push('Inactif 14j+')
      if (isTrialChaud && usageFaible) riskReasons.push('Trial fin <7j + usage faible')
      const isAtRisk = riskReasons.length > 0

      return {
        tenantId: t.id,
        companyName: t.company_name || 'Sans nom',
        subscriptionPlan: t.subscription_plan || 'starter',
        subscriptionStatus: t.subscription_status || 'trial',
        trialEndsAt: t.trial_ends_at,
        whatsappConnected: !!t.whatsapp_connected,
        createdAt: t.created_at,
        clients,
        devis,
        devisLast7j: devis7j,
        factures,
        dossiers,
        rdv,
        agentMessages,
        lastActivity,
        isActivated,
        isActif7j,
        isActif30j,
        isInactif14j,
        isTrialChaud,
        isAtRisk,
        riskReasons,
      }
    })

    adoptionAgents.count = withAgents
    adoptionAgents.pct = total ? Math.round((withAgents / total) * 100) : 0
    adoptionDevis.pct = total ? Math.round((adoptionDevis.count / total) * 100) : 0
    adoptionFactures.pct = total ? Math.round((adoptionFactures.count / total) * 100) : 0
    adoptionDossiers.pct = total ? Math.round((adoptionDossiers.count / total) * 100) : 0
    adoptionRdv.pct = total ? Math.round((adoptionRdv.count / total) * 100) : 0

    const activationRate = total ? Math.round((activated / total) * 100) : 0
    const clientsRisque = usage.filter((u) => u.isAtRisk)
    const trialsChauds = usage.filter((u) => u.isTrialChaud)
    const inactifs = usage.filter((u) => u.isInactif14j)

    return NextResponse.json({
      kpis: {
        tenantsTotal: total,
        byPlan,
        byStatus,
        trialEndingSoon,
        whatsappConnected,
        activationRate,
        activated,
        actifs7j,
        actifs30j,
        inactifs14j,
        adoptionAgents: { pct: adoptionAgents.pct, count: adoptionAgents.count, totalMessages: adoptionAgents.totalMessages },
        adoptionFonctionnalites: {
          devis: adoptionDevis,
          factures: adoptionFactures,
          dossiers: adoptionDossiers,
          rdv: adoptionRdv,
          agents: adoptionAgents,
        },
      },
      alertes: {
        clientsRisque,
        trialsChauds,
        inactifs,
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

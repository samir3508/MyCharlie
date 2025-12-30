# 🤖 Intégration LEO pour les Relances WhatsApp

## Vue d'ensemble

Cette documentation explique comment intégrer LEO (agent IA WhatsApp) pour envoyer des relances automatiques ou manuelles avec notifications.

## Architecture

```
Frontend (Relances Page) 
  ↓
API Route: /api/relances/send
  ↓
LEO via N8N (WhatsApp)
  ↓
Supabase (historique des relances)
  ↓
Notifications (Toast + Badge)
```

## Étape 1: Créer l'API Route pour envoyer une relance via LEO

### Fichier: `src/app/api/relances/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSupabasePublic } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { facture_id, method, tenant_id, template_relance_id } = body

    // Vérifier que la facture existe
    const supabasePublic = getSupabasePublic()
    const { data: facture, error: factureError } = await supabasePublic
      .from('factures')
      .select(`
        *,
        clients (
          nom_complet,
          telephone,
          email
        )
      `)
      .eq('id', facture_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (factureError || !facture) {
      return NextResponse.json(
        { error: 'Facture introuvable' },
        { status: 404 }
      )
    }

    // Si méthode = WhatsApp, utiliser LEO
    if (method === 'whatsapp') {
      const clientPhone = facture.clients?.telephone
      if (!clientPhone) {
        return NextResponse.json(
          { error: 'Numéro de téléphone manquant pour le client' },
          { status: 400 }
        )
      }

      // Récupérer le template de relance
      let templateMessage = 'Bonjour, je vous contacte concernant votre facture...'
      if (template_relance_id) {
        const { data: template } = await supabasePublic
          .from('templates_relances')
          .select('*')
          .eq('id', template_relance_id)
          .single()
        
        if (template) {
          // Construire le message depuis le template
          templateMessage = buildRelanceMessage(template, facture)
        }
      }

      // Appeler LEO via l'API N8N
      const leoResponse = await sendViaLEO({
        tenant_id,
        phone: clientPhone,
        message: templateMessage,
        facture_id,
        facture_numero: facture.numero,
        montant: facture.montant_ttc,
      })

      // Enregistrer la relance dans la base de données
      const { data: relance } = await supabasePublic
        .from('relances')
        .insert({
          tenant_id,
          facture_id,
          type: 'facture_en_retard',
          methode: 'whatsapp',
          statut: 'envoye',
          date_envoi: new Date().toISOString(),
          message: templateMessage,
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        relance,
        leo_response: leoResponse,
      })
    }

    // Pour email, utiliser l'edge function existante
    const supabaseAdmin = getSupabasePublic()
    const { data, error } = await supabaseAdmin.functions.invoke('send-relance', {
      body: {
        tenant_id,
        facture_id,
        method: 'email',
        recipient_email: facture.clients?.email,
      },
    })

    if (error) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error sending relance:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction pour envoyer via LEO/N8N
async function sendViaLEO({
  tenant_id,
  phone,
  message,
  facture_id,
  facture_numero,
  montant,
}: {
  tenant_id: string
  phone: string
  message: string
  facture_id: string
  facture_numero: string
  montant: number
}) {
  // Appeler votre webhook N8N qui envoie via WhatsApp
  const N8N_WEBHOOK_URL = process.env.N8N_RELANCE_WEBHOOK_URL
  
  if (!N8N_WEBHOOK_URL) {
    throw new Error('N8N webhook URL non configurée')
  }

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id,
      phone,
      message,
      facture_id,
      facture_numero,
      montant,
      type: 'relance',
    }),
  })

  if (!response.ok) {
    throw new Error(`N8N webhook error: ${response.statusText}`)
  }

  return await response.json()
}

// Fonction pour construire le message depuis le template
function buildRelanceMessage(template: any, facture: any): string {
  // Remplacer les variables du template
  let message = template.contenu || ''
  
  message = message.replace('{{numero_facture}}', facture.numero)
  message = message.replace('{{montant}}', facture.montant_ttc.toFixed(2) + ' €')
  message = message.replace('{{date_echeance}}', facture.date_echeance || 'N/A')
  message = message.replace('{{client_nom}}', facture.clients?.nom_complet || '')
  
  return message
}
```

## Étape 2: Créer une Edge Function Supabase pour LEO Relances (Optionnel)

Si vous préférez utiliser une Edge Function au lieu d'une API route:

### Fichier: `supabase/functions/leo-send-relance/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tenant_id, facture_id, phone, message } = await req.json()

    // Appeler N8N pour envoyer via WhatsApp
    const N8N_WEBHOOK_URL = Deno.env.get('N8N_RELANCE_WEBHOOK_URL')
    
    const n8nResponse = await fetch(N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id,
        phone,
        message,
        facture_id,
      }),
    })

    if (!n8nResponse.ok) {
      throw new Error('N8N error')
    }

    // Enregistrer la relance
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabaseClient.from('relances').insert({
      tenant_id,
      facture_id,
      type: 'facture_en_retard',
      methode: 'whatsapp',
      statut: 'envoye',
      date_envoi: new Date().toISOString(),
      message,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

## Étape 3: Modifier l'interface Relances pour appeler l'API

### Dans `src/app/(dashboard)/relances/page.tsx`

Ajouter la fonction pour envoyer via WhatsApp:

```typescript
const handleSendRelance = async (relanceId: string, factureId: string, method: 'email' | 'whatsapp') => {
  try {
    const { tenant } = useAuth()
    if (!tenant?.id) return

    const response = await fetch('/api/relances/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_id: tenant.id,
        facture_id: factureId,
        method,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      toast.error(data.error || 'Erreur lors de l\'envoi')
      return
    }

    toast.success(`Relance envoyée par ${method === 'whatsapp' ? 'WhatsApp' : 'email'}`)
    
    // Rafraîchir les données
    queryClient.invalidateQueries(['relances', tenant.id])
  } catch (error) {
    toast.error('Erreur lors de l\'envoi de la relance')
  }
}
```

Puis modifier les boutons WhatsApp:

```typescript
<Button 
  size="sm" 
  variant="outline" 
  className="border-gray-700 text-gray-300 hover:bg-[#262626]"
  onClick={() => handleSendRelance(r.id, r.facture_id, 'whatsapp')}
>
  <MessageSquare className="w-4 h-4 mr-1" />
  WhatsApp
</Button>
```

## Étape 4: Configuration N8N Webhook

Dans N8N, créez un workflow qui:

1. **Reçoit le webhook** avec les données de relance
2. **Formate le message** pour WhatsApp
3. **Envoie via WhatsApp API** (Twilio, WhatsApp Business API, etc.)
4. **Retourne une réponse** de succès/erreur

### Exemple de workflow N8N:

```
Webhook → Function (format message) → WhatsApp Node → HTTP Response
```

### Message formaté pour LEO:

```json
{
  "to": "+33612345678",
  "message": "Bonjour {{client_nom}}, je vous contacte concernant votre facture {{numero_facture}} d'un montant de {{montant}} € qui était due le {{date_echeance}}. Pourriez-vous nous confirmer le règlement? Merci."
}
```

## Étape 5: Notifications en temps réel

Pour ajouter des notifications en temps réel:

### Option A: Polling (simple)

```typescript
// Dans le composant Relances
useEffect(() => {
  const interval = setInterval(() => {
    queryClient.invalidateQueries(['relances', tenant?.id])
  }, 30000) // Toutes les 30 secondes

  return () => clearInterval(interval)
}, [tenant?.id])
```

### Option B: Supabase Realtime (avancé)

```typescript
useEffect(() => {
  if (!tenant?.id) return

  const channel = supabase
    .channel('relances-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'relances',
      filter: `tenant_id=eq.${tenant.id}`,
    }, (payload) => {
      toast.success('Nouvelle relance envoyée')
      queryClient.invalidateQueries(['relances', tenant.id])
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [tenant?.id])
```

## Étape 6: Badge de notifications

Ajouter un badge sur l'icône de relances dans la sidebar:

```typescript
// Dans app-sidebar.tsx
const { data: pendingRelances } = useQuery({
  queryKey: ['relances-pending', tenant?.id],
  queryFn: async () => {
    const { count } = await supabase
      .from('relances')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('statut', 'planifie')
    
    return count || 0
  },
  enabled: !!tenant?.id,
})

// Dans le menu item
<SidebarMenuItem>
  <SidebarMenuButton asChild>
    <Link href="/relances">
      <Bell className="h-5 w-5" />
      <span>Relances</span>
      {pendingRelances > 0 && (
        <Badge className="ml-auto">{pendingRelances}</Badge>
      )}
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
```

## Variables d'environnement nécessaires

Ajouter dans `.env.local`:

```env
N8N_RELANCE_WEBHOOK_URL=https://votre-n8n.com/webhook/relance-whatsapp
```

## Résumé du flux

1. **Utilisateur clique sur "WhatsApp"** dans la page Relances
2. **Frontend appelle** `/api/relances/send` avec `method: 'whatsapp'`
3. **API Route récupère** la facture et le client
4. **API Route appelle** N8N webhook avec le message formaté
5. **N8N envoie** le message via WhatsApp
6. **Supabase enregistre** la relance dans la table `relances`
7. **Frontend affiche** une notification de succès
8. **Badge se met à jour** si des relances sont planifiées

## Prochaines étapes

- [ ] Implémenter l'API route
- [ ] Connecter les boutons WhatsApp
- [ ] Configurer le webhook N8N
- [ ] Ajouter les notifications
- [ ] Tester l'envoi end-to-end

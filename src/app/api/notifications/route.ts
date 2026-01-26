import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// GET - Récupérer les notifications pour le tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unread_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Récupérer le tenant de l'utilisateur
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Récupérer les notifications
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('lu', false)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Erreur récupération notifications:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Compter les notifications non lues
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('lu', false)

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0
    })
  } catch (error: any) {
    console.error('Erreur API notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Créer une notification
export async function POST(request: NextRequest) {
  try {
    // Pas besoin de vérifier l'utilisateur pour POST, on utilise service role
    const body = await request.json()
    const { tenant_id, type, titre, message, data } = body

    if (!tenant_id || !type || !titre || !message) {
      return NextResponse.json(
        { error: 'tenant_id, type, titre et message sont requis' },
        { status: 400 }
      )
    }

    // Vérifier si une notification similaire existe déjà pour éviter les doublons
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier les doublons : même type, même titre, même tenant_id, créée il y a moins de 30 secondes
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString()
    
    const { data: existingNotification, error: checkError } = await supabaseAdmin
      .from('notifications')
      .select('id, created_at')
      .eq('tenant_id', tenant_id)
      .eq('type', type)
      .eq('titre', titre)
      .gte('created_at', thirtySecondsAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.warn('⚠️ Erreur lors de la vérification des doublons:', checkError)
    }

    // Si une notification similaire existe déjà, ne pas en créer une nouvelle
    if (existingNotification) {
      console.log(`📝 Notification similaire déjà existante (ID: ${existingNotification.id}), création ignorée`)
      return NextResponse.json({ 
        success: true, 
        message: 'Notification déjà existante',
        notification: existingNotification
      })
    }

    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        tenant_id,
        type,
        titre,
        message,
        data: data || {},
        lu: false
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création notification:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notification })
  } catch (error: any) {
    console.error('Erreur API notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Marquer une notification comme lue
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notification_id, mark_all_read } = body

    // Récupérer le tenant de l'utilisateur
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (mark_all_read) {
      // Marquer toutes les notifications comme lues
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('tenant_id', tenant.id)
        .eq('lu', false)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' })
    } else if (notification_id) {
      // Marquer une notification spécifique comme lue
      const { error } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', notification_id)
        .eq('tenant_id', tenant.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'notification_id ou mark_all_read requis' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Erreur API notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

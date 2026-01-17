'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Calendar, 
  HardDrive, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  ExternalLink,
  Trash2,
  Settings,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface OAuthConnection {
  id: string
  provider: string
  service: string
  email: string | null
  account_name: string | null
  profile_picture: string | null
  is_active: boolean
  last_used_at: string | null
  last_error: string | null
  created_at: string
  expires_at: string | null
}

const GOOGLE_SERVICES = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Envoyez des devis et factures depuis votre adresse email professionnelle',
    icon: Mail,
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    color: 'text-red-500'
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Synchronisez vos RDV et visites avec Google Calendar',
    icon: Calendar,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ],
    color: 'text-blue-500'
  },
  {
    id: 'drive',
    name: 'Google Drive',
    description: 'Stockez vos documents (devis PDF, photos de chantier) sur Drive',
    icon: HardDrive,
    scopes: [
      'https://www.googleapis.com/auth/drive.file'
    ],
    color: 'text-yellow-500'
  }
]

// Configuration Google OAuth
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/api/auth/google/callback`
  : ''

export default function IntegrationsPage() {
  const { tenant } = useAuth()
  const [connections, setConnections] = useState<OAuthConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingService, setConnectingService] = useState<string | null>(null)
  const supabase = getSupabaseClient()

  // Charger les connexions existantes
  const loadConnections = useCallback(async () => {
    if (!tenant?.id) return
    
    setLoading(true)
    try {
      // Essayer d'abord avec le client Supabase direct
      const { data, error } = await supabase
        .from('oauth_connections')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erreur chargement connexions (client direct):', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2)
        })
        
        // Si erreur de permissions, essayer via l'API
        if (error.code === 'PGRST116' || error.message?.includes('permission') || error.message?.includes('RLS')) {
          console.log('Tentative via API route...')
          try {
            const response = await fetch(`/api/oauth/connections?tenant_id=${tenant.id}`)
            if (response.ok) {
              const result = await response.json()
              setConnections(result.connections || [])
              return
            } else {
              const errorData = await response.json()
              console.error('Erreur API route:', errorData)
            }
          } catch (apiErr) {
            console.error('Erreur lors de l\'appel API:', apiErr)
          }
        }
        
        // Si ce n'est pas une erreur de permissions, afficher un toast
        if (error.code !== 'PGRST116' && !error.message?.includes('permission')) {
          toast.error('Erreur lors du chargement des connexions')
        }
        
        // Dans tous les cas, initialiser avec un tableau vide
        setConnections([])
      } else {
        setConnections(data || [])
      }
    } catch (err) {
      console.error('Erreur inattendue:', err)
      // Essayer via l'API en dernier recours
      try {
        const response = await fetch(`/api/oauth/connections?tenant_id=${tenant.id}`)
        if (response.ok) {
          const result = await response.json()
          setConnections(result.connections || [])
          return
        }
      } catch (apiErr) {
        console.error('Erreur lors de l\'appel API (fallback):', apiErr)
      }
      toast.error('Erreur lors du chargement des connexions')
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [tenant?.id, supabase])

  // Rafraîchir le token
  const refreshToken = useCallback(async (connectionId: string, silent = false) => {
    if (!silent) {
      toast.info('Rafraîchissement du token...')
    }
    
    try {
      const response = await fetch('/api/auth/google/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId })
      })

      if (response.ok) {
        if (!silent) {
          toast.success('Token rafraîchi avec succès')
        }
        await loadConnections()
        return true
      } else {
        const errorData = await response.json()
        if (!silent) {
          toast.error('Erreur lors du rafraîchissement')
        }
        console.error('Erreur rafraîchissement:', errorData)
        return false
      }
    } catch (error) {
      if (!silent) {
        toast.error('Erreur réseau')
      }
      console.error('Erreur réseau rafraîchissement:', error)
      return false
    }
  }, [loadConnections])

  // Charger les connexions existantes au chargement
  useEffect(() => {
    if (tenant?.id) {
      loadConnections()
    }
  }, [tenant?.id, loadConnections])

  // Rafraîchir automatiquement les tokens expirés ou qui vont bientôt expirer
  useEffect(() => {
    if (!tenant?.id || connections.length === 0) return

    const checkAndRefreshTokens = async () => {
      for (const connection of connections) {
        if (!connection.expires_at) continue

        const expiresAt = new Date(connection.expires_at)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        const fiveMinutes = 5 * 60 * 1000 // 5 minutes en millisecondes

        // Si le token expire dans moins de 5 minutes ou est déjà expiré, le rafraîchir
        if (timeUntilExpiry < fiveMinutes) {
          console.log(`🔄 Rafraîchissement automatique du token pour ${connection.service}...`)
          try {
            await refreshToken(connection.id, true) // Rafraîchissement silencieux
          } catch (error) {
            console.error(`Erreur rafraîchissement automatique pour ${connection.service}:`, error)
          }
        }
      }
    }

    // Vérifier immédiatement
    checkAndRefreshTokens()

    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkAndRefreshTokens, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [connections, tenant?.id, refreshToken])

  // Initier la connexion OAuth Google
  const connectGoogle = (service: typeof GOOGLE_SERVICES[0]) => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Configuration Google OAuth manquante. Contactez l\'administrateur.')
      console.error('GOOGLE_CLIENT_ID manquant. Vérifiez NEXT_PUBLIC_GOOGLE_CLIENT_ID dans .env')
      return
    }

    if (!tenant?.id) {
      toast.error('Aucun tenant trouvé. Veuillez vous reconnecter.')
      return
    }

    if (!REDIRECT_URI) {
      toast.error('URL de redirection non configurée.')
      console.error('REDIRECT_URI non disponible (window.location.origin)')
      return
    }

    setConnectingService(service.id)

    // Construire l'URL d'autorisation Google
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: service.scopes.join(' '),
      access_type: 'offline', // Pour obtenir un refresh_token
      prompt: 'consent', // Forcer le consentement pour obtenir refresh_token
      state: JSON.stringify({
        tenant_id: tenant.id,
        service: service.id
      })
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    
    console.log('Redirection vers Google OAuth:', {
      authUrl,
      redirectUri: REDIRECT_URI,
      tenantId: tenant.id,
      service: service.id
    })
    
    // Ouvrir dans une popup ou rediriger
    window.location.href = authUrl
  }

  // Déconnecter un service
  const disconnectService = async (connectionId: string, serviceName: string) => {
    if (!confirm(`Voulez-vous vraiment déconnecter ${serviceName} ?`)) return

    const { error } = await supabase
      .from('oauth_connections')
      .delete()
      .eq('id', connectionId)

    if (error) {
      toast.error('Erreur lors de la déconnexion')
    } else {
      toast.success(`${serviceName} déconnecté`)
      loadConnections()
    }
  }


  // Vérifier si un service est connecté
  const getConnection = (service: string) => {
    return connections.find(c => c.service === service && c.provider === 'google')
  }

  // Vérifier si le token est expiré
  const isTokenExpired = (connection: OAuthConnection) => {
    if (!connection.expires_at) return false
    return new Date(connection.expires_at) < new Date()
  }

  // Vérifier si le token expire bientôt (dans moins de 5 minutes)
  const isTokenExpiringSoon = (connection: OAuthConnection) => {
    if (!connection.expires_at) return false
    const expiresAt = new Date(connection.expires_at)
    const now = new Date()
    const fiveMinutes = 5 * 60 * 1000 // 5 minutes en millisecondes
    return (expiresAt.getTime() - now.getTime()) < fiveMinutes
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Intégrations</h1>
        <p className="text-muted-foreground mt-2">
          Connectez vos services Google pour envoyer des emails depuis votre adresse professionnelle
        </p>
      </div>

      {/* Avertissement si pas de configuration */}
      {!GOOGLE_CLIENT_ID && (
        <Card className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Configuration requise
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  Pour activer les intégrations Google, l'administrateur doit configurer 
                  les identifiants OAuth dans la Google Cloud Console.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des services */}
      <div className="space-y-4">
        {GOOGLE_SERVICES.map(service => {
          const connection = getConnection(service.id)
          const isConnected = !!connection
          const isExpired = connection ? isTokenExpired(connection) : false
          const Icon = service.icon

          return (
            <Card key={service.id} className={isConnected ? 'border-green-200 dark:border-green-800' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${service.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {service.name}
                        {isConnected && (
                          <Badge 
                            variant={isExpired ? 'destructive' : isTokenExpiringSoon(connection!) ? 'secondary' : 'default'} 
                            className="text-xs"
                          >
                            {isExpired ? 'Token expiré' : isTokenExpiringSoon(connection!) ? 'Expire bientôt' : 'Connecté'}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        {(isExpired || isTokenExpiringSoon(connection)) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => refreshToken(connection.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Rafraîchir
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => disconnectService(connection.id, service.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => connectGoogle(service)}
                        disabled={!GOOGLE_CLIENT_ID || connectingService === service.id}
                      >
                        {connectingService === service.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Connexion...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connecter
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {isConnected && connection && (
                <CardContent className="pt-0">
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-3">
                      {connection.profile_picture && (
                        <img 
                          src={connection.profile_picture} 
                          alt="" 
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">{connection.account_name || connection.email}</p>
                        <p className="text-muted-foreground">{connection.email}</p>
                      </div>
                    </div>
                    {connection.last_used_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Dernière utilisation : {new Date(connection.last_used_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                    {connection.last_error && (
                      <p className="text-xs text-red-600 mt-2">
                        Erreur : {connection.last_error}
                      </p>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Section d'aide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Comment ça marche ?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
            <p>Cliquez sur "Connecter" pour le service souhaité (Gmail, Calendar, Drive)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
            <p>Connectez-vous avec votre compte Google professionnel</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
            <p>Autorisez l'accès aux services demandés</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">4</div>
            <p>
              <strong>C'est prêt !</strong> Les emails de devis et factures seront envoyés depuis votre adresse professionnelle
            </p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">
              <strong>🔒 Sécurité :</strong> Nous ne stockons jamais votre mot de passe Google. 
              Nous utilisons OAuth2, le standard de sécurité de l'industrie.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

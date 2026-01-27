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
// ⚠️ IMPORTANT : Forcer l'URL de production, ne jamais utiliser localhost en production
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${process.env.NEXT_PUBLIC_APP_URL || (window.location.hostname === 'localhost' ? window.location.origin : 'https://mycharlie.fr')}/api/auth/google/callback`
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
        const responseData = await response.json().catch(() => ({}))
        
        // Si l'API retourne "Token encore valide", c'est un succès, pas une erreur
        if (responseData.message === 'Token encore valide' || responseData.success === true) {
          if (!silent) {
            console.log('ℹ️ Token encore valide, pas besoin de rafraîchissement')
          }
          // Recharger les connexions pour avoir les données à jour
          await loadConnections()
          return true
        }
        
        if (!silent) {
          toast.success('Token rafraîchi avec succès')
        }
        await loadConnections()
        return true
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        
        // Si erreur 400, c'est probablement que le token n'a pas besoin d'être rafraîchi
        // ou qu'il y a un problème avec le refresh_token
        if (response.status === 400) {
          // Ne pas afficher d'erreur si c'est un rafraîchissement silencieux
          if (silent) {
            // En mode silencieux, ne pas logger d'erreur pour les 400
            // C'est normal si le token est encore valide ou si le refresh_token est invalide
            // Ne rien logger pour éviter le spam dans la console
            return false
          } else {
            // En mode non-silencieux, informer l'utilisateur mais pas de façon alarmante
            if (errorData.error === 'Pas de refresh_token disponible') {
              toast.warning('Impossible de rafraîchir : refresh_token manquant')
            } else if (errorData.details?.error === 'invalid_grant' || errorData.details?.error === 'invalid_client') {
              // Refresh token invalide - suggérer de reconnecter
              toast.warning('Token invalide. Veuillez reconnecter Google Calendar/Gmail.', {
                duration: 5000
              })
            } else if (errorData.message?.includes('encore valide') || errorData.message?.includes('pas encore expiré')) {
              // Token encore valide - pas d'erreur à afficher
              return true
            } else {
              // Autre erreur 400 - logger en mode debug seulement
              console.debug('⚠️ Erreur 400 lors du rafraîchissement:', errorData)
            }
          }
        } else {
          // Pour les autres erreurs (401, 500, etc.), logger l'erreur
          if (!silent) {
            toast.error('Erreur lors du rafraîchissement')
            console.error('Erreur rafraîchissement:', errorData)
          } else {
            // En mode silencieux, logger seulement en mode debug pour éviter le spam
            console.debug('Erreur rafraîchissement (silencieux):', errorData)
          }
        }
        return false
      }
    } catch (error) {
      // Erreur réseau - ne pas afficher d'erreur si c'est silencieux
      if (!silent) {
        toast.error('Erreur réseau')
        console.error('Erreur réseau rafraîchissement:', error)
      } else {
        // En mode silencieux, ne rien logger pour éviter le spam dans la console
        // Les erreurs réseau peuvent être temporaires et ne nécessitent pas d'action immédiate
      }
      return false
    }
  }, [loadConnections])

  // Charger les connexions existantes au chargement
  useEffect(() => {
    if (tenant?.id) {
      loadConnections()
    }
  }, [tenant?.id, loadConnections])

  // Rafraîchir automatiquement les tokens toutes les heures pour éviter les déconnexions
  // Les tokens Google OAuth expirent après 1 heure, on les rafraîchit préventivement
  useEffect(() => {
    if (!tenant?.id || connections.length === 0) return

    // Map pour suivre les rafraîchissements en cours et éviter les doublons
    const refreshingTokens = new Set<string>()
    // Map pour suivre la dernière fois qu'un token a été rafraîchi (pour éviter les rafraîchissements trop fréquents)
    const lastRefreshTime = new Map<string, number>()
    const ONE_HOUR = 60 * 60 * 1000 // 1 heure en millisecondes
    const MIN_REFRESH_INTERVAL = 50 * 60 * 1000 // 50 minutes minimum entre deux rafraîchissements (pour éviter les doublons)

    const checkAndRefreshTokens = async () => {
      for (const connection of connections) {
        // Éviter les rafraîchissements multiples simultanés
        if (refreshingTokens.has(connection.id)) {
          continue
        }

        const now = Date.now()
        const lastRefresh = lastRefreshTime.get(connection.id) || 0
        const timeSinceLastRefresh = now - lastRefresh

        // Vérifier si le token doit être rafraîchi :
        // 1. Si ça fait plus d'1 heure depuis le dernier rafraîchissement
        // 2. OU si le token est expiré ou va expirer bientôt
        const needsRefresh = timeSinceLastRefresh >= ONE_HOUR

        // Vérifier aussi si le token est expiré ou va expirer bientôt
        let isExpired = false
        let isExpiringSoon = false
        if (connection.expires_at) {
          const expiresAt = new Date(connection.expires_at)
          const timeUntilExpiry = expiresAt.getTime() - now
          const refreshBuffer = 15 * 60 * 1000 // 15 minutes de buffer
          isExpired = timeUntilExpiry <= 0
          isExpiringSoon = timeUntilExpiry > 0 && timeUntilExpiry < refreshBuffer
        }

        // Rafraîchir si :
        // - Ça fait plus d'1 heure depuis le dernier rafraîchissement (rafraîchissement préventif)
        // - OU le token est expiré
        // - OU le token expire dans moins de 15 minutes
        // ET si on n'a pas rafraîchi récemment (éviter les rafraîchissements trop fréquents)
        if ((needsRefresh || isExpired || isExpiringSoon) && timeSinceLastRefresh >= MIN_REFRESH_INTERVAL) {
          refreshingTokens.add(connection.id)
          lastRefreshTime.set(connection.id, now) // Marquer comme rafraîchi maintenant
          
          try {
            const success = await refreshToken(connection.id, true) // Rafraîchissement silencieux
            if (success) {
              // Mettre à jour le temps de rafraîchissement après succès
              lastRefreshTime.set(connection.id, Date.now())
            }
          } catch (error) {
            // En cas d'erreur, on peut réessayer plus tard
            // Ne pas mettre à jour lastRefreshTime pour permettre un nouvel essai
            // Ne pas logger d'erreur en mode silencieux - les erreurs 400 sont normales
            // (token encore valide ou refresh_token invalide nécessitant une reconnexion)
          } finally {
            // Retirer de la liste des rafraîchissements en cours après un délai
            setTimeout(() => {
              refreshingTokens.delete(connection.id)
            }, 60000) // 1 minute de cooldown
          }
        }
      }
    }

    // Vérifier immédiatement au chargement (pour les tokens qui n'ont jamais été rafraîchis)
    checkAndRefreshTokens()

    // Vérifier toutes les heures pour rafraîchir préventivement
    const interval = setInterval(checkAndRefreshTokens, ONE_HOUR)

    return () => {
      clearInterval(interval)
    }
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

  // Token révoqué/expiré : l'utilisateur doit reconnecter (pas juste rafraîchir)
  const needsReconnect = (connection: OAuthConnection) => {
    if (!connection.last_error) return false
    const msg = connection.last_error.toLowerCase()
    return (
      msg.includes('reconnectez') ||
      msg.includes('expired or revoked') ||
      msg.includes('token has been') ||
      msg.includes('invalide') ||
      msg.includes('révoqué') ||
      (connection.is_active === false && !!connection.last_error)
    )
  }

  // Reconnecter = déconnecter puis relancer OAuth (sans confirmation)
  const reconnectService = async (connectionId: string, service: typeof GOOGLE_SERVICES[0]) => {
    toast.info('Reconnexion en cours… Redirection vers Google.')
    const { error } = await supabase
      .from('oauth_connections')
      .delete()
      .eq('id', connectionId)
    if (error) {
      toast.error('Erreur lors de la déconnexion')
      return
    }
    loadConnections()
    connectGoogle(service)
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
                            variant={
                              needsReconnect(connection!) ? 'destructive' 
                              : isExpired ? 'destructive' 
                              : isTokenExpiringSoon(connection!) ? 'secondary' 
                              : 'default'
                            } 
                            className="text-xs"
                          >
                            {needsReconnect(connection!) ? 'À reconnecter' : isExpired ? 'Token expiré' : isTokenExpiringSoon(connection!) ? 'Expire bientôt' : 'Connecté'}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        {needsReconnect(connection) ? (
                          <Button
                            size="sm"
                            onClick={() => reconnectService(connection.id, service)}
                            disabled={!GOOGLE_CLIENT_ID || connectingService === service.id}
                          >
                            {connectingService === service.id ? (
                              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-1" />
                            )}
                            Reconnecter
                          </Button>
                        ) : (isExpired || isTokenExpiringSoon(connection)) && (
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
                      <div className="mt-2 p-2 rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">
                          {needsReconnect(connection)
                            ? 'Votre accès Google a expiré ou a été révoqué.'
                            : 'Erreur'}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          {needsReconnect(connection)
                            ? 'Cliquez sur Reconnecter ci-dessus pour rétablir la liaison avec Google Calendar/Gmail.'
                            : connection.last_error}
                        </p>
                      </div>
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

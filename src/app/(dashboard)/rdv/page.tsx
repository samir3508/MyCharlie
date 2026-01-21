'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar, 
  Plus, 
  Clock, 
  MapPin, 
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  XCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Home,
  Video,
  FileSignature,
  MoreHorizontal
} from 'lucide-react'
import { useRdvList, useRdvToday, useRdvUpcoming, useRdvMonth, useCreateRdv, useUpdateRdv } from '@/lib/hooks/use-rdv'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useDossiers } from '@/lib/hooks/use-dossiers'
import { useAuth } from '@/lib/hooks/use-auth'
import { RefreshCw, Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TYPES_RDV, STATUTS_RDV } from '@/types/database'
import Link from 'next/link'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { RDV_COLUMNS } from '@/lib/utils/export'
import { toast } from 'sonner'

const typeRdvIcons: Record<string, React.ReactNode> = {
  appel: <Phone className="w-4 h-4" />,
  visite: <Home className="w-4 h-4" />,
  chantier: <Home className="w-4 h-4" />,
  reunion: <Video className="w-4 h-4" />,
  signature: <FileSignature className="w-4 h-4" />,
  autre: <Calendar className="w-4 h-4" />,
}

const statutColors: Record<string, string> = {
  planifie: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  confirme: 'bg-green-500/10 text-green-400 border-green-500/30',
  en_cours: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  realise: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  annule: 'bg-red-500/10 text-red-400 border-red-500/30',
  reporte: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
}

type ViewMode = 'today' | 'week' | 'month'

export default function RdvPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('today')
  const [syncing, setSyncing] = useState(false)
  
  const { tenant } = useAuth()
  const { data: allRdv, isLoading, refetch: refetchRdv, error: allRdvError } = useRdvList()
  
  // Rafraîchir automatiquement toutes les 30 secondes
  useEffect(() => {
    if (!tenant?.id) return
    
    const interval = setInterval(() => {
      console.log('🔄 Rafraîchissement automatique des RDV...')
      refetchRdv()
    }, 30000) // 30 secondes
    
    return () => clearInterval(interval)
  }, [tenant?.id, refetchRdv])
  const { data: todayRdv, error: todayError } = useRdvToday()
  const { data: upcomingRdv, error: upcomingError } = useRdvUpcoming(7)
  const currentDate = new Date()
  const { data: monthRdv, error: monthError } = useRdvMonth(currentDate.getFullYear(), currentDate.getMonth() + 1)
  const { data: dossiers } = useDossiers()
  const createRdv = useCreateRdv()
  const updateRdv = useUpdateRdv()

  // Debug: Log des données pour comprendre pourquoi l'agenda est vide
  useEffect(() => {
    // Vérifier si au moins un hook a trouvé des RDV
    const hasAnyRdv = (allRdv && allRdv.length > 0) || 
                      (upcomingRdv && upcomingRdv.length > 0) || 
                      (monthRdv && monthRdv.length > 0) ||
                      (todayRdv && todayRdv.length > 0)
    
    console.log('📅 [RDV Page Debug]', {
      tenantId: tenant?.id,
      allRdvCount: allRdv?.length || 0,
      todayRdvCount: todayRdv?.length || 0,
      upcomingRdvCount: upcomingRdv?.length || 0,
      monthRdvCount: monthRdv?.length || 0,
      isLoading,
      hasAnyRdv,
      errors: {
        allRdv: allRdvError,
        today: todayError,
        upcoming: upcomingError,
        month: monthError
      }
    })

    // Si des RDV sont trouvés, ne pas afficher de message d'erreur
    if (hasAnyRdv) {
      console.log('✅ Des RDV sont trouvés par au moins un hook, pas besoin de debug')
      return // Sortir immédiatement si des RDV sont trouvés
    }

    // Si aucun RDV trouvé dans AUCUN hook après chargement, appeler l'API de débogage
    // MAIS seulement après un délai pour laisser le temps aux hooks de se charger
    if (tenant?.id && !isLoading) {
      const timeoutId = setTimeout(() => {
        // Vérifier à nouveau avant d'appeler l'API (les hooks peuvent avoir chargé entre temps)
        const stillNoRdv = (!allRdv || allRdv.length === 0) && 
                           (!upcomingRdv || upcomingRdv.length === 0) && 
                           (!monthRdv || monthRdv.length === 0) &&
                           (!todayRdv || todayRdv.length === 0)
        
        if (stillNoRdv) {
          console.log('🔍 Aucun RDV trouvé dans aucun hook après délai, appel de l\'API de débogage...')
          fetch(`/api/debug/rdv?tenant_id=${tenant.id}`)
            .then(res => res.json())
            .then(data => {
              console.log('🔍 [Debug API] Résultats:', data)
              if (data.success && data.all_rdv && data.all_rdv.length > 0) {
                // Vérifier une dernière fois si des RDV sont maintenant disponibles
                const finalCheck = (allRdv && allRdv.length > 0) || 
                                  (upcomingRdv && upcomingRdv.length > 0) || 
                                  (monthRdv && monthRdv.length > 0) ||
                                  (todayRdv && todayRdv.length > 0)
                
                if (!finalCheck) {
                  console.warn('⚠️ Des RDV existent dans Supabase mais ne sont pas récupérés par les hooks !')
                  console.warn('   RDV trouvés:', data.all_rdv)
                  console.warn('   Statistiques:', data.stats)
                  console.warn('   Vérifiez les filtres de date et de statut dans les hooks')
                  // Ne PAS afficher le toast automatiquement - seulement dans la console
                  // L'utilisateur peut utiliser le bouton Debug s'il veut plus d'infos
                } else {
                  console.log('✅ Des RDV sont maintenant disponibles après vérification')
                }
              } else if (data.success && data.all_rdv && data.all_rdv.length === 0) {
                console.log('ℹ️ Aucun RDV dans Supabase pour ce tenant')
              }
            })
            .catch(err => {
              console.error('Erreur appel API debug:', err)
            })
        }
      }, 3000) // Attendre 3 secondes pour que les hooks se chargent complètement
      
      return () => clearTimeout(timeoutId)
    }
  }, [tenant?.id, allRdv, todayRdv, upcomingRdv, monthRdv, isLoading, allRdvError, todayError, upcomingError, monthError])

  // Fonction pour synchroniser avec Google Calendar
  const handleSyncCalendar = async () => {
    if (!tenant?.id) {
      toast.error('Tenant non trouvé')
      return
    }

    try {
      setSyncing(true)
      const response = await fetch(`/api/calendar/sync?tenant_id=${tenant.id}`)
      const data = await response.json()

      if (data.success) {
        toast.success(
          `Synchronisation réussie : ${data.stats.synced} nouveau(x), ${data.stats.updated} mis à jour`
        )
        // Rafraîchir les données
        refetchRdv()
      } else {
        throw new Error(data.message || 'Erreur lors de la synchronisation')
      }
    } catch (error: any) {
      console.error('Erreur synchronisation:', error)
      toast.error(error.message || 'Erreur lors de la synchronisation avec Google Calendar')
    } finally {
      setSyncing(false)
    }
  }

  const [formData, setFormData] = useState({
    dossier_id: '',
    titre: '',
    type_rdv: 'visite',
    date_heure: '',
    duree_minutes: 60,
    adresse: '',
    notes: '',
  })

  const handleCreateRdv = async () => {
    if (!formData.dossier_id || !formData.date_heure) return
    
    try {
      await createRdv.mutateAsync({
        dossier_id: formData.dossier_id,
        titre: formData.titre || 'Nouveau RDV',
        type_rdv: formData.type_rdv as any,
        date_heure: new Date(formData.date_heure).toISOString(),
        duree_minutes: formData.duree_minutes,
        adresse: formData.adresse || null,
        notes: formData.notes || null,
        statut: 'planifie',
      })
      setShowCreateForm(false)
      setFormData({
        dossier_id: '',
        titre: '',
        type_rdv: 'visite',
        date_heure: '',
        duree_minutes: 60,
        adresse: '',
        notes: '',
      })
    } catch (error) {
      console.error('Erreur création RDV:', error)
    }
  }

  const handleMarkAsRealise = (rdvId: string) => {
    updateRdv.mutate({ id: rdvId, statut: 'realise' })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Grouper les RDV par jour (pour la vue 7 jours)
  type RdvItem = NonNullable<typeof upcomingRdv>[number]
  const groupedRdv: Record<string, RdvItem[]> = useMemo(() => {
    if (!upcomingRdv || upcomingRdv.length === 0) {
      console.log('[RdvPage] Aucun RDV à grouper pour la vue 7 jours')
      return {}
    }
    
    const grouped = upcomingRdv.reduce((acc: Record<string, RdvItem[]>, rdv: RdvItem) => {
      const date = new Date(rdv.date_heure).toDateString()
      if (!acc[date]) acc[date] = []
      acc[date].push(rdv)
      return acc
    }, {} as Record<string, RdvItem[]>)
    
    console.log('[RdvPage] RDV groupés par jour:', Object.keys(grouped).length, 'jours')
    return grouped
  }, [upcomingRdv])

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!allRdv) return []
    return allRdv.map(rdv => ({
      titre: rdv.titre || '',
      date_heure: rdv.date_heure ? new Date(rdv.date_heure).toLocaleString('fr-FR') : '',
      type_rdv: rdv.type_rdv || '',
      client_nom: (() => {
        const client = rdv.clients;
        if (!client) return '';
        // Priorité 1: Utiliser nom et prenom si disponibles ET différents
        if (client.prenom && client.nom && client.prenom !== client.nom) {
          return `${client.prenom} ${client.nom}`;
        }
        // Priorité 2: Si doublon, ne pas afficher
        if (client.prenom && client.nom && client.prenom === client.nom) {
          return 'Client';
        }
        // Priorité 3: Utiliser nom_complet si valide (vérifier doublons)
        if (client.nom_complet) {
          const parts = client.nom_complet.trim().split(/\s+/);
          if (client.nom_complet.includes('@') || (parts.length === 2 && parts[0] === parts[1])) {
            return 'Client';
          }
          return client.nom_complet;
        }
        return 'Client';
      })(),
      dossier_numero: rdv.dossiers?.numero || '',
      adresse: rdv.adresse || '',
      statut: rdv.statut || '',
    }))
  }, [allRdv])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Agenda RDV
              </h1>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                <Bot className="w-3 h-3 mr-1" />
                Léo
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Planifiez et suivez vos rendez-vous
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportDropdown 
            data={exportData}
            columns={RDV_COLUMNS}
            filename="rdv"
            title="Export Rendez-vous"
            label="Exporter"
          />
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayRdv?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Aujourd'hui</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingRdv?.length || 0}</p>
              <p className="text-xs text-muted-foreground">7 prochains jours</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {allRdv?.filter(r => r.statut === 'confirme').length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Confirmés</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {allRdv?.filter(r => r.statut === 'planifie').length || 0}
              </p>
              <p className="text-xs text-muted-foreground">À confirmer</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets de vue avec Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
            <TabsTrigger value="week">7 jours</TabsTrigger>
            <TabsTrigger value="month">Mois</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCalendar}
            disabled={syncing || !tenant?.id}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} />
            {syncing ? 'Synchronisation...' : 'Synchroniser Google Calendar'}
          </Button>
        </div>

        {/* Main Content */}
        <TabsContent value="today" className="mt-0">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* RDV du jour */}
            <Card className="lg:col-span-1 border-border">
              <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
                Aujourd'hui
              </CardTitle>
            </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))
            ) : todayError ? (
              <div className="text-center py-8 text-red-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">Erreur lors du chargement</p>
                <p className="text-xs text-muted-foreground mt-1">{todayError.message}</p>
              </div>
            ) : todayRdv && todayRdv.length > 0 ? (
              todayRdv.map((rdv, index) => (
                <motion.div
                  key={rdv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/rdv/${rdv.id}`}>
                    <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                        {typeRdvIcons[rdv.type_rdv || 'autre']}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{rdv.titre || rdv.dossiers?.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(rdv.date_heure)} • {rdv.duree_minutes}min
                        </p>
                        {(() => {
                          const client = rdv.clients || (rdv.dossiers as any)?.clients;
                          if (client) {
                            let displayName = 'Client';
                            if (client.prenom && client.nom && client.prenom !== client.nom) {
                              displayName = `${client.prenom} ${client.nom}`;
                            } else if (client.prenom && client.nom && client.prenom === client.nom) {
                              displayName = 'Client';
                            } else if (client.nom_complet) {
                              const parts = client.nom_complet.trim().split(/\s+/);
                              if (client.nom_complet.includes('@') || (parts.length === 2 && parts[0] === parts[1])) {
                                displayName = 'Client';
                              } else if (parts.length >= 2 && parts[0] !== parts[1]) {
                                displayName = `${parts[0]} ${parts.slice(1).join(' ')}`;
                              } else if (parts.length === 1) {
                                displayName = parts[0];
                              } else {
                                displayName = client.nom_complet;
                              }
                            }
                            return (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {displayName}
                                </span>
                                {rdv.dossiers?.numero && (
                                  <>
                                    <span className="text-muted-foreground/60">•</span>
                                    <span className="font-medium text-purple-400">{rdv.dossiers.numero}</span>
                                  </>
                                )}
                              </p>
                            );
                          }
                          return null;
                        })()}
                        </div>
                      </div>
                      <Badge variant="outline" className={statutColors[rdv.statut || 'planifie']}>
                        {rdv.statut}
                      </Badge>
                    </div>
                    {rdv.adresse && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{rdv.adresse}</span>
                      </div>
                    )}
                    {rdv.statut !== 'realise' && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="mt-2 w-full text-xs hover:bg-green-500/10 hover:text-green-400"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleMarkAsRealise(rdv.id)
                        }}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Marquer comme réalisé
                      </Button>
                    )}
                    </div>
                  </Link>
                </motion.div>
              ))
              ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun RDV aujourd'hui</p>
                <Button 
                  variant="link" 
                  className="text-orange-400 mt-2"
                  onClick={() => setShowCreateForm(true)}
                >
                  Planifier un RDV
                </Button>
              </div>
            )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week" className="mt-0">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-purple-500" />
              </div>
              7 prochains jours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-16" />
                  </div>
                ))}
              </div>
            ) : upcomingError ? (
              <div className="text-center py-12 text-red-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                <p>Erreur lors du chargement des RDV</p>
                <p className="text-sm text-muted-foreground mt-1">{upcomingError.message}</p>
              </div>
            ) : Object.keys(groupedRdv).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedRdv).map(([date, rdvs], dayIndex) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIndex * 0.1 }}
                  >
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                      {formatDate(rdvs[0].date_heure)}
                    </h3>
                    <div className="space-y-2">
                      {rdvs.map((rdv, index) => (
                        <div
                          key={rdv.id}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg border transition-colors group",
                            (rdv as any).source === 'google_calendar'
                              ? "bg-blue-50/50 border-blue-200/50 hover:border-blue-300"
                              : "bg-card/50 border-border/50 hover:border-purple-500/30"
                          )}
                        >
                          <div className="flex-shrink-0 text-center">
                            <p className="text-lg font-bold text-purple-400">
                              {formatTime(rdv.date_heure)}
                            </p>
                            <p className="text-xs text-muted-foreground">{rdv.duree_minutes}min</p>
                          </div>
                          <div className="h-12 w-px bg-border" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400">
                                {typeRdvIcons[rdv.type_rdv || 'autre']}
                              </span>
                              <p className="font-medium truncate">
                                {(() => {
                                  // Afficher le titre du RDV ou du dossier, en nettoyant seulement les vrais doublons
                                  const titre = rdv.titre || rdv.dossiers?.titre || '';
                                  if (titre.includes(' - ')) {
                                    const parts = titre.split(' - ');
                                    if (parts.length === 2) {
                                      const clientPart = parts[1].trim();
                                      const nameParts = clientPart.split(/\s+/);
                                      // Si c'est un doublon évident (ex: "adlbapp4 adlbapp4"), remplacer par le nom du client
                                      if (nameParts.length === 2 && nameParts[0] === nameParts[1] && nameParts[0].length < 15) {
                                        // Essayer d'utiliser le nom du client si disponible
                                        const client = rdv.clients || (rdv.dossiers as any)?.clients;
                                        if (client && client.prenom && client.nom && client.prenom !== client.nom) {
                                          return `${parts[0]} - ${client.prenom} ${client.nom}`;
                                        }
                                        return `${parts[0]} - Client`;
                                      }
                                    }
                                  }
                                  return titre;
                                })()}
                              </p>
                              {(rdv as any).source === 'google_calendar' && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                  Google Calendar
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {(() => {
                                // Essayer d'abord le client direct, puis via le dossier
                                const client = rdv.clients || (rdv.dossiers as any)?.clients;
                                // Debug: log les données client pour comprendre
                                if (process.env.NODE_ENV === 'development' && client) {
                                  console.log('[RDV Client Debug]', {
                                    rdvId: rdv.id,
                                    hasDirectClient: !!rdv.clients,
                                    hasDossierClient: !!(rdv.dossiers as any)?.clients,
                                    client: {
                                      id: client.id,
                                      nom: client.nom,
                                      prenom: client.prenom,
                                      nom_complet: client.nom_complet,
                                      isDoublon: client.nom === client.prenom
                                    }
                                  });
                                }
                                if (client) {
                                  let displayName = 'Client';
                                  
                                  // Priorité 1: Utiliser nom et prenom si disponibles ET différents (vrais noms)
                                  if (client.prenom && client.nom && client.prenom !== client.nom) {
                                    displayName = `${client.prenom} ${client.nom}`;
                                  } 
                                  // Priorité 2: Si nom === prenom (doublon), essayer nom_complet si valide
                                  else if (client.prenom && client.nom && client.prenom === client.nom) {
                                    // C'est un doublon, vérifier si nom_complet est valide
                                    if (client.nom_complet) {
                                      const parts = client.nom_complet.trim().split(/\s+/);
                                      if (!client.nom_complet.includes('@') && 
                                          parts.length >= 2 && parts[0] !== parts[1]) {
                                        // nom_complet valide avec deux mots différents
                                        displayName = client.nom_complet;
                                      } else {
                                        displayName = 'Client';
                                      }
                                    } else {
                                      displayName = 'Client';
                                    }
                                  }
                                  // Priorité 3: Si pas de nom/prenom, utiliser nom_complet (mais vérifier les doublons)
                                  else if (client.nom_complet) {
                                    const parts = client.nom_complet.trim().split(/\s+/);
                                    if (client.nom_complet.includes('@') || 
                                        (parts.length === 2 && parts[0] === parts[1])) {
                                      // C'est probablement un email ou un doublon
                                      displayName = 'Client';
                                    } else if (parts.length >= 2 && parts[0] !== parts[1]) {
                                      // Si nom_complet contient plusieurs mots différents, utiliser comme prénom nom
                                      displayName = client.nom_complet;
                                    } else if (parts.length === 1) {
                                      displayName = parts[0];
                                    } else {
                                      displayName = client.nom_complet;
                                    }
                                  }
                                  
                                  return (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{displayName}</span>
                                      </div>
                                      {rdv.dossiers?.numero && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground/60">•</span>
                                          <span className="font-medium text-purple-400">{rdv.dossiers.numero}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {rdv.adresse && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">{rdv.adresse}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={statutColors[rdv.statut || 'planifie']}>
                            {rdv.statut?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun RDV prévu dans les 7 prochains jours</p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Planifier un RDV
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

          <TabsContent value="month" className="mt-0">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-purple-500" />
              </div>
              Vue mensuelle - {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-16" />
                  </div>
                ))}
              </div>
            ) : monthError ? (
              <div className="text-center py-12 text-red-400">
                <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                <p>Erreur lors du chargement des RDV</p>
                <p className="text-sm text-muted-foreground mt-1">{monthError.message}</p>
              </div>
            ) : monthRdv && monthRdv.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(
                  monthRdv.reduce((acc: Record<string, typeof monthRdv>, rdv) => {
                    const date = new Date(rdv.date_heure).toDateString()
                    if (!acc[date]) acc[date] = []
                    acc[date].push(rdv)
                    return acc
                  }, {} as Record<string, typeof monthRdv>)
                ).map(([date, rdvs], dayIndex) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: dayIndex * 0.05 }}
                  >
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 capitalize">
                      {formatDate(rdvs[0].date_heure)}
                    </h3>
                    <div className="space-y-2">
                      {rdvs.map((rdv, index) => (
                        <div
                          key={rdv.id}
                          className={cn(
                            "flex items-center gap-4 p-3 rounded-lg border transition-colors group",
                            (rdv as any).source === 'google_calendar'
                              ? "bg-blue-50/50 border-blue-200/50 hover:border-blue-300"
                              : "bg-card/50 border-border/50 hover:border-purple-500/30"
                          )}
                        >
                          <div className="flex-shrink-0 text-center">
                            <p className="text-lg font-bold text-purple-400">
                              {formatTime(rdv.date_heure)}
                            </p>
                            <p className="text-xs text-muted-foreground">{rdv.duree_minutes}min</p>
                          </div>
                          <div className="h-12 w-px bg-border" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400">
                                {typeRdvIcons[rdv.type_rdv || 'autre']}
                              </span>
                              <p className="font-medium truncate">
                                {(() => {
                                  // Afficher le titre du RDV ou du dossier, en nettoyant seulement les vrais doublons
                                  const titre = rdv.titre || rdv.dossiers?.titre || '';
                                  if (titre.includes(' - ')) {
                                    const parts = titre.split(' - ');
                                    if (parts.length === 2) {
                                      const clientPart = parts[1].trim();
                                      const nameParts = clientPart.split(/\s+/);
                                      // Si c'est un doublon évident (ex: "adlbapp4 adlbapp4"), remplacer par le nom du client
                                      if (nameParts.length === 2 && nameParts[0] === nameParts[1] && nameParts[0].length < 15) {
                                        // Essayer d'utiliser le nom du client si disponible
                                        const client = rdv.clients || (rdv.dossiers as any)?.clients;
                                        if (client && client.prenom && client.nom && client.prenom !== client.nom) {
                                          return `${parts[0]} - ${client.prenom} ${client.nom}`;
                                        }
                                        return `${parts[0]} - Client`;
                                      }
                                    }
                                  }
                                  return titre;
                                })()}
                              </p>
                              {(rdv as any).source === 'google_calendar' && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                  Google Calendar
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {(() => {
                                // Essayer d'abord le client direct, puis via le dossier
                                const client = rdv.clients || (rdv.dossiers as any)?.clients;
                                // Debug: log les données client pour comprendre
                                if (process.env.NODE_ENV === 'development' && client) {
                                  console.log('[RDV Client Debug]', {
                                    rdvId: rdv.id,
                                    hasDirectClient: !!rdv.clients,
                                    hasDossierClient: !!(rdv.dossiers as any)?.clients,
                                    client: {
                                      id: client.id,
                                      nom: client.nom,
                                      prenom: client.prenom,
                                      nom_complet: client.nom_complet,
                                      isDoublon: client.nom === client.prenom
                                    }
                                  });
                                }
                                if (client) {
                                  let displayName = 'Client';
                                  
                                  // Priorité 1: Utiliser nom et prenom si disponibles ET différents (vrais noms)
                                  if (client.prenom && client.nom && client.prenom !== client.nom) {
                                    displayName = `${client.prenom} ${client.nom}`;
                                  } 
                                  // Priorité 2: Si nom === prenom (doublon), essayer nom_complet si valide
                                  else if (client.prenom && client.nom && client.prenom === client.nom) {
                                    // C'est un doublon, vérifier si nom_complet est valide
                                    if (client.nom_complet) {
                                      const parts = client.nom_complet.trim().split(/\s+/);
                                      if (!client.nom_complet.includes('@') && 
                                          parts.length >= 2 && parts[0] !== parts[1]) {
                                        // nom_complet valide avec deux mots différents
                                        displayName = client.nom_complet;
                                      } else {
                                        displayName = 'Client';
                                      }
                                    } else {
                                      displayName = 'Client';
                                    }
                                  }
                                  // Priorité 3: Si pas de nom/prenom, utiliser nom_complet (mais vérifier les doublons)
                                  else if (client.nom_complet) {
                                    const parts = client.nom_complet.trim().split(/\s+/);
                                    if (client.nom_complet.includes('@') || 
                                        (parts.length === 2 && parts[0] === parts[1])) {
                                      // C'est probablement un email ou un doublon
                                      displayName = 'Client';
                                    } else if (parts.length >= 2 && parts[0] !== parts[1]) {
                                      // Si nom_complet contient plusieurs mots différents, utiliser comme prénom nom
                                      displayName = client.nom_complet;
                                    } else if (parts.length === 1) {
                                      displayName = parts[0];
                                    } else {
                                      displayName = client.nom_complet;
                                    }
                                  }
                                  
                                  return (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>{displayName}</span>
                                      </div>
                                      {rdv.dossiers?.numero && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-muted-foreground/60">•</span>
                                          <span className="font-medium text-purple-400">{rdv.dossiers.numero}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                              {rdv.adresse && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">{rdv.adresse}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={statutColors[rdv.statut || 'planifie']}>
                            {rdv.statut?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun RDV prévu ce mois-ci</p>
                <Button 
                  className="mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Planifier un RDV
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>

      {/* Create RDV Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Nouveau rendez-vous
            </DialogTitle>
            <DialogDescription>
              Planifiez un nouveau rendez-vous pour un dossier
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Dossier *</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, dossier_id: value })}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  {dossiers?.map((dossier) => (
                    <SelectItem key={dossier.id} value={dossier.id}>
                      {dossier.numero} - {dossier.titre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de RDV</Label>
              <Select 
                value={formData.type_rdv}
                onValueChange={(value) => setFormData({ ...formData, type_rdv: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_RDV.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {typeRdvIcons[type]}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date et heure *</Label>
                <Input
                  type="datetime-local"
                  value={formData.date_heure}
                  onChange={(e) => setFormData({ ...formData, date_heure: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Durée (min)</Label>
                <Input
                  type="number"
                  value={formData.duree_minutes}
                  onChange={(e) => setFormData({ ...formData, duree_minutes: parseInt(e.target.value) })}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse du RDV"
                className="bg-background border-border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateRdv}
                disabled={!formData.dossier_id || !formData.date_heure || createRdv.isPending}
                className="bg-gradient-to-r from-purple-500 to-purple-600"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Créer le RDV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

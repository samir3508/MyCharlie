'use client'

import { useState, useMemo } from 'react'
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
import { useRdvList, useRdvToday, useRdvUpcoming, useCreateRdv, useUpdateRdv } from '@/lib/hooks/use-rdv'
import { useDossiers } from '@/lib/hooks/use-dossiers'
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

export default function RdvPage() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const { data: allRdv, isLoading } = useRdvList()
  const { data: todayRdv } = useRdvToday()
  const { data: upcomingRdv } = useRdvUpcoming(7)
  const { data: dossiers } = useDossiers()
  const createRdv = useCreateRdv()
  const updateRdv = useUpdateRdv()

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

  // Grouper les RDV par jour
  type RdvItem = NonNullable<typeof upcomingRdv>[number]
  const groupedRdv: Record<string, RdvItem[]> = upcomingRdv?.reduce((acc: Record<string, RdvItem[]>, rdv: RdvItem) => {
    const date = new Date(rdv.date_heure).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(rdv)
    return acc
  }, {} as Record<string, RdvItem[]>) || {}

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!allRdv) return []
    return allRdv.map(rdv => ({
      titre: rdv.titre || '',
      date_heure: rdv.date_heure ? new Date(rdv.date_heure).toLocaleString('fr-FR') : '',
      type_rdv: rdv.type_rdv || '',
      client_nom: rdv.clients?.nom_complet || '',
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

      {/* Main Content */}
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
            ) : todayRdv && todayRdv.length > 0 ? (
              todayRdv.map((rdv, index) => (
                <motion.div
                  key={rdv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
                >
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
                      onClick={() => handleMarkAsRealise(rdv.id)}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Marquer comme réalisé
                    </Button>
                  )}
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

        {/* Planning 7 jours */}
        <Card className="lg:col-span-2 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-purple-500" />
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
                          className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-purple-500/30 transition-colors group"
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
                              <p className="font-medium truncate">{rdv.titre || rdv.dossiers?.titre}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {rdv.clients && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="w-3 h-3" />
                                  {rdv.clients.nom_complet}
                                </div>
                              )}
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
      </div>

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

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ClipboardList, 
  Plus, 
  Search,
  Calendar,
  MapPin,
  User,
  Camera,
  FileText,
  Ruler,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Bot,
  Filter,
  Clock,
  CalendarDays,
  FileX,
  Mic
} from 'lucide-react'
import { useFichesVisite, useCreateFicheVisite } from '@/lib/hooks/use-fiches-visite'
import { useDossiers } from '@/lib/hooks/use-dossiers'
import { useDevis } from '@/lib/hooks/use-devis'
import { useAuth } from '@/lib/hooks/use-auth'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { toast } from 'sonner'

type FilterType = 'tous' | 'aujourdhui' | 'semaine' | 'sans_devis' | 'avec_vocal' | 'urgent'

const FILTERS: { key: FilterType; label: string; icon: React.ReactNode }[] = [
  { key: 'tous', label: 'Tous', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'aujourdhui', label: "Aujourd'hui", icon: <Clock className="w-4 h-4" /> },
  { key: 'semaine', label: 'Cette semaine', icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'sans_devis', label: 'Sans devis', icon: <FileX className="w-4 h-4" /> },
  { key: 'avec_vocal', label: 'Avec vocal', icon: <Mic className="w-4 h-4" /> },
  { key: 'urgent', label: 'Urgents', icon: <AlertTriangle className="w-4 h-4" /> },
]

const URGENCE_CONFIG = {
  basse: { label: 'Basse', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' },
  normale: { label: 'Normale', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  haute: { label: 'Haute', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  critique: { label: 'Critique', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

export default function FichesVisitePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('tous')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const { tenant } = useAuth()
  const { data: fiches, isLoading } = useFichesVisite()
  const { data: dossiers } = useDossiers()
  const { data: devis } = useDevis(tenant?.id)
  const createFiche = useCreateFicheVisite()

  const [formData, setFormData] = useState({
    dossier_id: '',
    date_visite: new Date().toISOString().split('T')[0],
    type_visite: 'premiere_visite',
    urgence: 'normale',
    constat: '',
  })

  // Calculer les devis liés aux dossiers
  const dossierDevisMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    if (devis) {
      devis.forEach((d: any) => {
        if (d.dossier_id) {
          map[d.dossier_id] = true
        }
      })
    }
    return map
  }, [devis])

  // Filtrer les fiches
  const filteredFiches = useMemo(() => {
    if (!fiches) return []
    
    let result = fiches

    // Filtre par recherche
    if (searchQuery) {
      result = result.filter(f => 
        f.constat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.dossiers?.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.dossiers?.clients?.nom_complet?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtre par type
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    switch (activeFilter) {
      case 'aujourdhui':
        result = result.filter(f => {
          if (!f.date_visite) return false
          const ficheDate = new Date(f.date_visite)
          ficheDate.setHours(0, 0, 0, 0)
          return ficheDate.getTime() === today.getTime()
        })
        break
      case 'semaine':
        result = result.filter(f => {
          if (!f.date_visite) return false
          const ficheDate = new Date(f.date_visite)
          return ficheDate >= weekStart && ficheDate < weekEnd
        })
        break
      case 'sans_devis':
        result = result.filter(f => !dossierDevisMap[f.dossier_id])
        break
      case 'avec_vocal':
        result = result.filter(f => f.constat_vocal_url)
        break
      case 'urgent':
        result = result.filter(f => f.urgence === 'haute' || f.urgence === 'critique')
        break
    }

    return result
  }, [fiches, searchQuery, activeFilter, dossierDevisMap])

  const handleCreateFiche = async () => {
    if (!formData.dossier_id) {
      toast.error('Veuillez sélectionner un dossier')
      return
    }
    
    try {
      const newFiche = await createFiche.mutateAsync({
        dossier_id: formData.dossier_id,
        date_visite: formData.date_visite || null,
        type_visite: formData.type_visite,
        urgence: formData.urgence,
        constat: formData.constat || null,
      })
      
      toast.success('Fiche de visite créée avec succès')
      setShowCreateForm(false)
      setFormData({
        dossier_id: '',
        date_visite: new Date().toISOString().split('T')[0],
        type_visite: 'premiere_visite',
        urgence: 'normale',
        constat: '',
      })
    } catch (error: any) {
      console.error('Erreur création fiche:', error)
      toast.error(error?.message || 'Erreur lors de la création de la fiche de visite')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Stats
  const stats = useMemo(() => {
    if (!fiches) return { total: 0, complete: 0, sansDevis: 0, urgent: 0 }
    return {
      total: fiches.length,
      complete: fiches.filter(f => f.constat && f.preconisations).length,
      sansDevis: fiches.filter(f => !dossierDevisMap[f.dossier_id]).length,
      urgent: fiches.filter(f => f.urgence === 'haute' || f.urgence === 'critique').length,
    }
  }, [fiches, dossierDevisMap])

  // Colonnes pour l'export
  const FICHE_COLUMNS = [
    { key: 'date_visite', header: 'Date visite', width: 15 },
    { key: 'dossier_numero', header: 'Dossier', width: 15 },
    { key: 'client_nom', header: 'Client', width: 25 },
    { key: 'type_visite', header: 'Type', width: 15 },
    { key: 'urgence', header: 'Urgence', width: 10 },
    { key: 'constat', header: 'Constat', width: 40 },
    { key: 'preconisations', header: 'Préconisations', width: 30 },
    { key: 'complexite', header: 'Complexité', width: 12 },
    { key: 'budget_estime', header: 'Budget estimé', width: 15 },
  ]

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!fiches) return []
    return fiches.map(fiche => ({
      date_visite: fiche.date_visite ? new Date(fiche.date_visite).toLocaleDateString('fr-FR') : '',
      dossier_numero: fiche.dossiers?.numero || '',
      client_nom: fiche.dossiers?.clients?.nom_complet || '',
      type_visite: fiche.type_visite || 'premiere_visite',
      urgence: fiche.urgence || 'normale',
      constat: fiche.constat || '',
      preconisations: fiche.preconisations || '',
      complexite: fiche.complexite || '',
      budget_estime: fiche.budget_estime || '',
    }))
  }, [fiches])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Fiches de visite
              </h1>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                <Bot className="w-3 h-3 mr-1" />
                Léo
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Documentez vos visites terrain
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ExportDropdown 
            data={exportData}
            columns={FICHE_COLUMNS}
            filename="fiches_visite"
            title="Export Fiches de visite"
            label="Exporter"
          />
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle fiche
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total fiches</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.complete}</p>
              <p className="text-xs text-muted-foreground">Complètes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <FileX className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.sansDevis}</p>
              <p className="text-xs text-muted-foreground">Sans devis</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-xs text-muted-foreground">Urgents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une fiche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        
        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                activeFilter === filter.key && 'bg-amber-500 hover:bg-amber-600'
              )}
            >
              {filter.icon}
              <span className="ml-1 hidden sm:inline">{filter.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Fiches Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredFiches.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFiches.map((fiche, index) => {
            const urgenceConfig = URGENCE_CONFIG[(fiche.urgence as keyof typeof URGENCE_CONFIG) || 'normale']
            const hasDevis = dossierDevisMap[fiche.dossier_id]
            
            return (
              <motion.div
                key={fiche.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-border hover:border-amber-500/30 transition-all duration-200 group h-full">
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-amber-500/20">
                          <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-xs font-semibold">
                            {fiche.dossiers?.clients?.nom_complet 
                              ? getInitials(fiche.dossiers.clients.nom_complet) 
                              : '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm line-clamp-1">
                            {fiche.dossiers?.clients?.nom_complet || 'Client inconnu'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fiche.dossiers?.numero}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {fiche.date_visite ? formatDate(fiche.date_visite) : '-'}
                        </Badge>
                        <Badge variant="outline" className={cn("text-xs", urgenceConfig.color)}>
                          {urgenceConfig.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Titre dossier */}
                    <p className="font-medium text-sm line-clamp-1">
                      {fiche.dossiers?.titre}
                    </p>

                    {/* Constat */}
                    {fiche.constat && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Description
                        </p>
                        <p className="text-sm line-clamp-2">{fiche.constat}</p>
                      </div>
                    )}

                    {/* Infos */}
                    <div className="flex flex-wrap gap-2">
                      {fiche.surface_m2 && (
                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-0">
                          <Ruler className="w-3 h-3 mr-1" />
                          {fiche.surface_m2}m²
                        </Badge>
                      )}
                      {fiche.constat_vocal_url && (
                        <Badge variant="secondary" className="text-xs bg-purple-500/10 text-purple-400 border-0">
                          <Mic className="w-3 h-3 mr-1" />
                          Vocal
                        </Badge>
                      )}
                      {fiche.complexite && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-400 border-0 capitalize">
                          {fiche.complexite}
                        </Badge>
                      )}
                      {/* Statut devis */}
                      <Badge variant="secondary" className={cn(
                        "text-xs border-0",
                        hasDevis 
                          ? "bg-green-500/10 text-green-400" 
                          : "bg-orange-500/10 text-orange-400"
                      )}>
                        <FileText className="w-3 h-3 mr-1" />
                        {hasDevis ? '✓ Devis' : '✗ Sans devis'}
                      </Badge>
                    </div>

                    {/* Adresse */}
                    {fiche.dossiers?.adresse_chantier && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="line-clamp-1">{fiche.dossiers.adresse_chantier}</span>
                      </div>
                    )}

                    {/* Action */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full mt-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      asChild
                    >
                      <Link href={`/fiches-visite/${fiche.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Voir la fiche
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">
              {activeFilter !== 'tous' 
                ? 'Aucune fiche ne correspond à ce filtre' 
                : 'Aucune fiche de visite'}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une fiche
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              Nouvelle fiche de visite
            </DialogTitle>
            <DialogDescription>
              Créez rapidement une fiche, vous pourrez la compléter après
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Dossier *</Label>
              <Select 
                value={formData.dossier_id} 
                onValueChange={(value) => setFormData({ ...formData, dossier_id: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Sélectionner un dossier" />
                </SelectTrigger>
                <SelectContent>
                  {dossiers && dossiers.length > 0 ? (
                    dossiers.map((dossier) => (
                      <SelectItem key={dossier.id} value={dossier.id}>
                        {dossier.numero} - {dossier.titre}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                      Aucun dossier disponible
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de visite</Label>
                <Input
                  type="date"
                  value={formData.date_visite}
                  onChange={(e) => setFormData({ ...formData, date_visite: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Type de visite</Label>
                <Select 
                  value={formData.type_visite} 
                  onValueChange={(value) => setFormData({ ...formData, type_visite: value })}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premiere_visite">🏠 Première visite</SelectItem>
                    <SelectItem value="contre_visite">🔄 Contre-visite</SelectItem>
                    <SelectItem value="reception">✅ Réception</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Urgence</Label>
              <Select 
                value={formData.urgence} 
                onValueChange={(value) => setFormData({ ...formData, urgence: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">🟢 Basse</SelectItem>
                  <SelectItem value="normale">🔵 Normale</SelectItem>
                  <SelectItem value="haute">🟠 Haute</SelectItem>
                  <SelectItem value="critique">🔴 Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Description du besoin
              </Label>
              <Textarea
                value={formData.constat}
                onChange={(e) => setFormData({ ...formData, constat: e.target.value })}
                placeholder="Décrivez brièvement ce que le client veut faire..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleCreateFiche}
                disabled={!formData.dossier_id || createFiche.isPending}
                className="bg-gradient-to-r from-amber-500 to-amber-600"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Créer la fiche
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
  Bot
} from 'lucide-react'
import { useFichesVisite, useCreateFicheVisite } from '@/lib/hooks/use-fiches-visite'
import { useDossiers } from '@/lib/hooks/use-dossiers'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { toast } from 'sonner'

export default function FichesVisitePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const { data: fiches, isLoading } = useFichesVisite()
  const { data: dossiers } = useDossiers()
  const createFiche = useCreateFicheVisite()

  const [formData, setFormData] = useState({
    dossier_id: '',
    date_visite: new Date().toISOString().split('T')[0],
    constat: '',
    mesures: '',
    materiaux_necessaires: '',
    problemes_detectes: '',
    recommandations: '',
    estimation_duree: '',
  })

  const filteredFiches = fiches?.filter(f => 
    f.constat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.dossiers?.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.dossiers?.clients?.nom_complet?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreateFiche = async () => {
    if (!formData.dossier_id) {
      toast.error('Veuillez sélectionner un dossier')
      return
    }
    
    try {
      // Convertir materiaux_necessaires en tableau si nécessaire
      const materiauxArray = formData.materiaux_necessaires
        ? formData.materiaux_necessaires.split(',').map(m => m.trim()).filter(m => m.length > 0)
        : null

      await createFiche.mutateAsync({
        dossier_id: formData.dossier_id,
        date_visite: formData.date_visite || null,
        constat: formData.constat || null,
        difficultes: formData.problemes_detectes || null,
        notes: formData.recommandations || null,
        estimation_heures: formData.estimation_duree ? parseInt(formData.estimation_duree) : null,
        materiaux_necessaires: materiauxArray,
      })
      
      toast.success('Fiche de visite créée avec succès')
      setShowCreateForm(false)
      setFormData({
        dossier_id: '',
        date_visite: new Date().toISOString().split('T')[0],
        constat: '',
        mesures: '',
        materiaux_necessaires: '',
        problemes_detectes: '',
        recommandations: '',
        estimation_duree: '',
      })
    } catch (error: any) {
      console.error('Erreur création fiche:', error)
      toast.error(error?.message || 'Erreur lors de la création de la fiche de visite')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Colonnes pour l'export
  const FICHE_COLUMNS = [
    { key: 'numero', header: 'Numéro', width: 15 },
    { key: 'date_visite', header: 'Date visite', width: 15 },
    { key: 'dossier_titre', header: 'Dossier', width: 25 },
    { key: 'client_nom', header: 'Client', width: 25 },
    { key: 'constat', header: 'Constat', width: 40 },
    { key: 'mesures', header: 'Mesures', width: 30 },
    { key: 'problemes_detectes', header: 'Problèmes', width: 30 },
    { key: 'recommandations', header: 'Recommandations', width: 30 },
  ]

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!fiches) return []
    return fiches.map(fiche => ({
      numero: fiche.dossiers?.numero || '',
      date_visite: fiche.date_visite ? new Date(fiche.date_visite).toLocaleDateString('fr-FR') : '',
      constat: fiche.constat || '',
      mesures: '',
      problemes_detectes: fiche.difficultes || '',
      recommandations: fiche.notes || '',
      dossier_titre: fiche.dossiers?.titre || '',
      client_nom: fiche.dossiers?.clients?.nom_complet || '',
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
              <p className="text-2xl font-bold">{fiches?.length || 0}</p>
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
              <p className="text-2xl font-bold">
                {fiches?.filter(f => f.constat && f.notes).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Complètes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {fiches?.filter(f => f.difficultes).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Avec problèmes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {fiches?.filter(f => f.photos_urls && f.photos_urls.length > 0).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Avec photos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une fiche..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-border"
        />
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
          {filteredFiches.map((fiche, index) => (
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
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                      <Calendar className="w-3 h-3 mr-1" />
                      {fiche.date_visite ? formatDate(fiche.date_visite) : '-'}
                    </Badge>
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
                        Constat
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
                    {fiche.materiaux_necessaires && fiche.materiaux_necessaires.length > 0 && (
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-400 border-0">
                        <Wrench className="w-3 h-3 mr-1" />
                        Matériaux
                      </Badge>
                    )}
                    {fiche.difficultes && (
                      <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-400 border-0">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Difficultés
                      </Badge>
                    )}
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
          ))}
        </div>
      ) : (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">Aucune fiche de visite</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer une fiche
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              Nouvelle fiche de visite
            </DialogTitle>
            <DialogDescription>
              Documentez votre visite terrain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
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
                        Aucun dossier disponible. Créez d'abord un dossier.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {!dossiers || dossiers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Vous devez créer un dossier avant de créer une fiche de visite
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date de visite</Label>
                <Input
                  type="date"
                  value={formData.date_visite}
                  onChange={(e) => setFormData({ ...formData, date_visite: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Constat
              </Label>
              <Textarea
                value={formData.constat}
                onChange={(e) => setFormData({ ...formData, constat: e.target.value })}
                placeholder="Décrivez ce que vous avez constaté lors de la visite..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-500" />
                Mesures
              </Label>
              <Textarea
                value={formData.mesures}
                onChange={(e) => setFormData({ ...formData, mesures: e.target.value })}
                placeholder="Dimensions, surfaces, etc."
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-green-500" />
                Matériaux nécessaires
              </Label>
              <Textarea
                value={formData.materiaux_necessaires}
                onChange={(e) => setFormData({ ...formData, materiaux_necessaires: e.target.value })}
                placeholder="Liste des matériaux à prévoir..."
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Problèmes détectés
              </Label>
              <Textarea
                value={formData.problemes_detectes}
                onChange={(e) => setFormData({ ...formData, problemes_detectes: e.target.value })}
                placeholder="Points d'attention, difficultés..."
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Recommandations</Label>
              <Textarea
                value={formData.recommandations}
                onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                placeholder="Vos recommandations..."
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>Estimation durée travaux</Label>
              <Input
                value={formData.estimation_duree}
                onChange={(e) => setFormData({ ...formData, estimation_duree: e.target.value })}
                placeholder="Ex: 3-4 jours"
                className="bg-background border-border"
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

'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FolderKanban, 
  Plus, 
  Search, 
  LayoutGrid, 
  List,
  Trophy,
  TrendingUp,
  Clock,
  Target,
  Bot,
  Filter
} from 'lucide-react'
import { useDossiers, useDossiersStats, useUpdateDossier } from '@/lib/hooks/use-dossiers'
import { DossierKanban } from '@/components/dossiers/dossier-kanban'
import { DossierForm } from '@/components/dossiers/dossier-form'
import { ExportDropdown } from '@/components/ui/export-dropdown'
import { DOSSIER_COLUMNS } from '@/lib/utils/export'
import { toast } from 'sonner'

export default function DossiersPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const { data: dossiers, isLoading } = useDossiers()
  const { data: stats } = useDossiersStats()
  const updateDossier = useUpdateDossier()

  const filteredDossiers = dossiers?.filter(d => 
    d.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.clients?.nom_complet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.numero.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleUpdateStatut = (dossierId: string, newStatut: string) => {
    updateDossier.mutate({ id: dossierId, statut: newStatut as any })
  }

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(montant)
  }

  const tauxConversion = stats && stats.total > 0 
    ? Math.round((stats.signes / stats.total) * 100) 
    : 0

  // Données préparées pour l'export
  const exportData = useMemo(() => {
    if (!dossiers) return []
    return dossiers.map(d => ({
      numero: d.numero || '',
      titre: d.titre || '',
      client_nom: d.clients?.nom_complet || '',
      statut: d.statut || '',
      priorite: d.priorite || '',
      montant_estime: d.montant_estime || 0,
      date_creation: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '',
    }))
  }, [dossiers])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Dossiers
              </h1>
              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
                <Bot className="w-3 h-3 mr-1" />
                Léo
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Du premier contact à la signature du devis
            </p>
          </div>
        </div>
        {/* Boutons toujours visibles sous le titre */}
        <div className="flex flex-col sm:flex-row gap-2">
          <ExportDropdown 
            data={exportData}
            columns={DOSSIER_COLUMNS}
            filename="dossiers"
            title="Export Dossiers"
            label="Exporter"
          />
          <Button 
            onClick={() => setShowCreateForm(true)}
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-xl shadow-orange-500/30 text-white font-bold h-12 gap-2 px-8"
          >
            <Plus className="w-5 h-5" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.enCours || 0}</p>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.signes || 0}</p>
                  <p className="text-xs text-muted-foreground">Signés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatMontant(stats?.montantGagne || 0)}</p>
                  <p className="text-xs text-muted-foreground">CA gagné</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{tauxConversion}%</p>
                  <p className="text-xs text-muted-foreground">Taux conversion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="border-border">
            <Filter className="w-4 h-4" />
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80">
              <Skeleton className="h-16 rounded-t-xl" />
              <Skeleton className="h-96 rounded-b-xl" />
            </div>
          ))}
        </div>
      ) : viewMode === 'kanban' ? (
        <DossierKanban 
          dossiers={filteredDossiers as any} 
          onUpdateStatut={handleUpdateStatut}
        />
      ) : (
        <Card className="border-border">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {filteredDossiers.map((dossier) => (
                <div key={dossier.id} className="p-4 hover:bg-card/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">{dossier.titre}</p>
                        <p className="text-sm text-muted-foreground">
                          {dossier.clients?.nom_complet} • {dossier.numero}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {dossier.montant_estime && (
                        <span className="font-semibold text-orange-400">
                          {formatMontant(dossier.montant_estime)}
                        </span>
                      )}
                      <Badge variant="outline">
                        {dossier.statut?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDossiers.length === 0 && (
                <div className="p-12 text-center">
                  <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucun dossier trouvé</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un dossier
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form Dialog */}
      <DossierForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      />
    </div>
  )
}

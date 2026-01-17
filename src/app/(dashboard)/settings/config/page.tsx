'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Bell, 
  Mail, 
  FileText,
  Save,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function ConfigPage() {
  const { tenant } = useAuth()
  const supabase = getSupabaseClient()
  
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState({
    // Relances
    relance_auto_enabled: true,
    relance_delay_j1: 3,
    relance_delay_j2: 7,
    relance_delay_j3: 14,
    relance_max_per_devis: 3,
    
    // Emails
    email_signature: '',
    email_footer: '',
    
    // Devis/Factures
    devis_validite_jours: 30,
    facture_delai_paiement: 30,
    tva_default: 20,
    
    // Notifications
    notif_nouveau_devis: true,
    notif_devis_signe: true,
    notif_paiement_recu: true,
    notif_relance_auto: true,
  })

  useEffect(() => {
    setMounted(true)
    // Charger les paramètres existants
    if (tenant?.id) {
      loadConfig()
    }
  }, [tenant?.id])

  const loadConfig = async () => {
    // TODO: Charger depuis la table tenant_settings
    // Pour l'instant on utilise les valeurs par défaut
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      // TODO: Sauvegarder dans tenant_settings
      toast.success('Paramètres sauvegardés')
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-[#FF4D00]" />
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-2">
          Configurez le comportement de votre application
        </p>
      </div>

      {!mounted ? (
        <div className="space-y-6">
          <div className="grid w-full grid-cols-4 gap-2 bg-muted rounded-lg p-1">
            <div className="h-9 bg-muted-foreground/20 rounded-md animate-pulse" />
            <div className="h-9 bg-muted-foreground/20 rounded-md animate-pulse" />
            <div className="h-9 bg-muted-foreground/20 rounded-md animate-pulse" />
            <div className="h-9 bg-muted-foreground/20 rounded-md animate-pulse" />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="relances" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="relances" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Relances
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

        {/* Relances */}
        <TabsContent value="relances">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de relance automatique</CardTitle>
              <CardDescription>
                Configurez les délais et le comportement des relances automatiques pour les devis non signés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Activer les relances automatiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyer automatiquement des rappels pour les devis en attente
                  </p>
                </div>
                <Switch 
                  checked={config.relance_auto_enabled}
                  onCheckedChange={(v) => setConfig({...config, relance_auto_enabled: v})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>1ère relance (jours)</Label>
                  <Input 
                    type="number"
                    value={config.relance_delay_j1}
                    onChange={(e) => setConfig({...config, relance_delay_j1: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Après envoi du devis</p>
                </div>
                <div className="space-y-2">
                  <Label>2ème relance (jours)</Label>
                  <Input 
                    type="number"
                    value={config.relance_delay_j2}
                    onChange={(e) => setConfig({...config, relance_delay_j2: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Après la 1ère relance</p>
                </div>
                <div className="space-y-2">
                  <Label>3ème relance (jours)</Label>
                  <Input 
                    type="number"
                    value={config.relance_delay_j3}
                    onChange={(e) => setConfig({...config, relance_delay_j3: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-muted-foreground">Après la 2ème relance</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nombre max de relances par devis</Label>
                <Input 
                  type="number"
                  value={config.relance_max_per_devis}
                  onChange={(e) => setConfig({...config, relance_max_per_devis: parseInt(e.target.value)})}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails */}
        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des emails</CardTitle>
              <CardDescription>
                Personnalisez vos emails automatiques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Signature email</Label>
                <Textarea 
                  placeholder="Cordialement,
[Votre nom]
[Votre entreprise]"
                  value={config.email_signature}
                  onChange={(e) => setConfig({...config, email_signature: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Pied de page légal</Label>
                <Textarea 
                  placeholder="Mentions légales, SIRET, etc."
                  value={config.email_footer}
                  onChange={(e) => setConfig({...config, email_footer: e.target.value})}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des documents</CardTitle>
              <CardDescription>
                Configurez les valeurs par défaut pour les devis et factures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Validité devis (jours)</Label>
                  <Input 
                    type="number"
                    value={config.devis_validite_jours}
                    onChange={(e) => setConfig({...config, devis_validite_jours: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Délai paiement facture (jours)</Label>
                  <Input 
                    type="number"
                    value={config.facture_delai_paiement}
                    onChange={(e) => setConfig({...config, facture_delai_paiement: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>TVA par défaut (%)</Label>
                  <Input 
                    type="number"
                    value={config.tva_default}
                    onChange={(e) => setConfig({...config, tva_default: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Choisissez quand vous souhaitez être notifié
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Nouveau devis créé</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification quand un devis est créé par l'IA
                  </p>
                </div>
                <Switch 
                  checked={config.notif_nouveau_devis}
                  onCheckedChange={(v) => setConfig({...config, notif_nouveau_devis: v})}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Devis signé</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification quand un client signe un devis
                  </p>
                </div>
                <Switch 
                  checked={config.notif_devis_signe}
                  onCheckedChange={(v) => setConfig({...config, notif_devis_signe: v})}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Paiement reçu</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification quand une facture est payée
                  </p>
                </div>
                <Switch 
                  checked={config.notif_paiement_recu}
                  onCheckedChange={(v) => setConfig({...config, notif_paiement_recu: v})}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label>Relance automatique envoyée</Label>
                  <p className="text-sm text-muted-foreground">
                    Notification quand une relance automatique est envoyée
                  </p>
                </div>
                <Switch 
                  checked={config.notif_relance_auto}
                  onCheckedChange={(v) => setConfig({...config, notif_relance_auto: v})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}

      <div className="flex justify-end mt-6">
        <Button onClick={saveConfig} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
        </Button>
      </div>
    </div>
  )
}

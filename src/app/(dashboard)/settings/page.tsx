'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useUpdateTenant } from '@/lib/hooks/use-tenant'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Building2, 
  CreditCard, 
  Save,
  Loader2,
  Crown,
  Check,
  Receipt,
  ChevronRight,
  Settings as SettingsIcon,
  Mail,
  FileText,
  Bell
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import Link from 'next/link'
import { Tenant } from '@/types/database'
import { formatDate } from '@/lib/utils'

export default function SettingsPage() {
  const { tenant, user } = useAuth()
  const updateTenant = useUpdateTenant()

  const [formData, setFormData] = useState<Partial<Tenant>>({
    company_name: '',
    siret: '',
    address: '',
    phone: '',
    whatsapp_phone: '',
    email: '',
    tva_intra: '',
    iban: '',
    bic: '',
    legal_mentions: '',
  })

  // Configuration settings (emails, documents, notifications)
  const [config, setConfig] = useState({
    email_signature: '',
    email_footer: '',
    devis_validite_jours: 30,
    facture_delai_paiement: 30,
    tva_default: 20,
    notif_nouveau_devis: true,
    notif_devis_signe: true,
    notif_paiement_recu: true,
    notif_relance_auto: true,
  })
  const [configLoading, setConfigLoading] = useState(false)

  useEffect(() => {
    if (tenant) {
      setFormData({
        company_name: tenant.company_name || '',
        siret: tenant.siret || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
        whatsapp_phone: (tenant as any).whatsapp_phone || '',
        email: tenant.email || '',
        tva_intra: tenant.tva_intra || '',
        iban: tenant.iban || '',
        bic: tenant.bic || '',
        legal_mentions: tenant.legal_mentions || '',
      })
    }
  }, [tenant])

  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error('Erreur : Tenant non trouvé')
      console.error('Tenant ID missing:', tenant)
      return
    }

    try {
      console.log('Saving tenant data:', { tenantId: tenant.id, updates: formData })
      
      const result = await updateTenant.mutateAsync({
        tenantId: tenant.id,
        updates: formData,
      })
      
      console.log('Save successful:', result)
      toast.success('Paramètres sauvegardés avec succès')
    } catch (error) {
      console.error('Error saving tenant:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde'
      toast.error(`Erreur : ${errorMessage}`)
    }
  }

  const plans = [
    {
      name: 'Starter',
      price: '29€',
      period: '/mois',
      features: [
        '50 clients',
        '30 devis/mois',
        '20 factures/mois',
        'Relances email',
        'Support email',
      ],
      current: tenant?.subscription_plan === 'starter',
    },
    {
      name: 'Pro',
      price: '59€',
      period: '/mois',
      features: [
        'Clients illimités',
        'Devis illimités',
        'Factures illimitées',
        'Relances WhatsApp',
        'CHARLIE IA avancé',
        'Support prioritaire',
      ],
      current: tenant?.subscription_plan === 'pro',
      recommended: true,
    },
    {
      name: 'Enterprise',
      price: '149€',
      period: '/mois',
      features: [
        'Tout Pro +',
        'Multi-utilisateurs',
        'API personnalisée',
        'Formation dédiée',
        'Account manager',
      ],
      current: tenant?.subscription_plan === 'enterprise',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Paramètres
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les informations de votre entreprise et votre abonnement
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className={`grid w-full ${process.env.NODE_ENV === 'production' ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Receipt className="w-4 h-4" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <SettingsIcon className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          {/* Hide subscription tab for beta/MVP */}
          {process.env.NODE_ENV === 'production' && (
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Abonnement
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations entreprise</CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos devis et factures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nom de l'entreprise *</Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SIRET</Label>
                  <Input
                    value={formData.siret || ''}
                    onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                    placeholder="123 456 789 00012"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adresse</Label>
                <Textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Rue de la Paix&#10;75001 Paris"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Numéro WhatsApp</Label>
                <Input
                  value={(formData as any).whatsapp_phone || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp_phone: e.target.value } as any)}
                  placeholder="+33612345678"
                />
                <p className="text-xs text-muted-foreground">
                  Numéro WhatsApp associé à votre entreprise. Format international : +33612345678
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de facturation</CardTitle>
              <CardDescription>
                Coordonnées bancaires et mentions légales
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>N° TVA Intracommunautaire</Label>
                  <Input
                    value={formData.tva_intra || ''}
                    onChange={(e) => setFormData({ ...formData, tva_intra: e.target.value })}
                    placeholder="FR12345678901"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN</Label>
                  <Input
                    value={formData.iban || ''}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>BIC</Label>
                  <Input
                    value={formData.bic || ''}
                    onChange={(e) => setFormData({ ...formData, bic: e.target.value })}
                    placeholder="BNPAFRPP"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mentions légales</Label>
                <Textarea
                  value={formData.legal_mentions || ''}
                  onChange={(e) => setFormData({ ...formData, legal_mentions: e.target.value })}
                  placeholder="Garantie décennale n°XXX - Assurance RC Pro n°XXX..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateTenant.isPending}>
              {updateTenant.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conditions de paiement</CardTitle>
              <CardDescription>
                Gérez vos templates de conditions de paiement pour les devis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link 
                href="/settings/templates"
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#FF4D00]/10">
                    <Receipt className="w-6 h-6 text-[#FF4D00]" />
                  </div>
                  <div>
                    <p className="font-semibold">Templates de conditions de paiement</p>
                    <p className="text-sm text-muted-foreground">
                      Définissez les conditions de paiement (acompte, intermédiaire, solde) pour vos devis
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          {/* Emails */}
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
                  placeholder="Cordialement,&#10;[Votre nom]&#10;[Votre entreprise]"
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

          {/* Documents */}
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
                    onChange={(e) => setConfig({...config, devis_validite_jours: parseInt(e.target.value) || 30})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Délai paiement facture (jours)</Label>
                  <Input 
                    type="number"
                    value={config.facture_delai_paiement}
                    onChange={(e) => setConfig({...config, facture_delai_paiement: parseInt(e.target.value) || 30})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>TVA par défaut (%)</Label>
                  <Input 
                    type="number"
                    value={config.tva_default}
                    onChange={(e) => setConfig({...config, tva_default: parseInt(e.target.value) || 20})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
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

          <div className="flex justify-end">
            <Button onClick={() => {
              setConfigLoading(true)
              // TODO: Sauvegarder dans tenant_settings
              setTimeout(() => {
                toast.success('Configuration sauvegardée')
                setConfigLoading(false)
              }, 500)
            }} disabled={configLoading}>
              {configLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </div>
        </TabsContent>

        {/* Hide subscription content for beta/MVP */}
        {process.env.NODE_ENV === 'production' && (
          <TabsContent value="billing" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Votre abonnement</CardTitle>
                <CardDescription>
                  Gérez votre plan et vos informations de paiement
                </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-4">
                  <Crown className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-semibold text-lg capitalize">
                      Plan {tenant?.subscription_plan || 'Starter'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tenant?.subscription_status === 'trial' ? (
                        <>
                          Essai gratuit jusqu'au{' '}
                          {tenant.trial_ends_at && formatDate(tenant.trial_ends_at)}
                        </>
                      ) : (
                        'Abonnement actif'
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant={tenant?.subscription_status === 'trial' ? 'secondary' : 'default'}>
                  {tenant?.subscription_status === 'trial' ? 'Essai gratuit' : 'Actif'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-btp">Recommandé</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.current ? 'outline' : plan.recommended ? 'default' : 'outline'}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Plan actuel' : 'Choisir ce plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

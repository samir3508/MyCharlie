'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles, Loader2, Building2, Mail, Phone, Lock, ArrowLeft, CheckCircle2, MailCheck } from 'lucide-react'

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    password: '', // Garder pour le mode manuel
    acceptTerms: false,
  })
  const [autoPassword, setAutoPassword] = useState(true) // Par défaut, générer automatiquement

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.acceptTerms) {
      toast.error('Veuillez accepter les conditions générales')
      return
    }
    
    setLoading(true)

    try {
      if (autoPassword) {
        // Créer l'utilisateur avec mot de passe automatique via l'API
        const response = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            companyName: formData.companyName,
            phone: formData.phone,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors de la création du compte')
        }

        // L'utilisateur est créé avec un mot de passe automatique
        // Un email de réinitialisation sera envoyé pour qu'il puisse définir son propre mot de passe
        setEmailSent(true)
        toast.success('Compte créé ! Un email avec les instructions de connexion vous a été envoyé.')
      } else {
        // Ancienne méthode : l'utilisateur définit son propre mot de passe
        const supabase = getSupabaseClient()
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              company_name: formData.companyName,
              phone: formData.phone,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Erreur lors de la création du compte')

        setEmailSent(true)
        toast.success('Email de confirmation envoyé !')
      }
      
    } catch (error: unknown) {
      console.error('Register error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'inscription'
      
      // Handle specific errors
      if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
        toast.error('Cet email est déjà utilisé')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  // Email sent confirmation screen
  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-accent/20">
        <Card className="max-w-md w-full border-0 shadow-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <MailCheck className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Vérifiez votre email
              </h2>
              <p className="text-muted-foreground">
                Nous avons envoyé un lien de confirmation à
              </p>
              <p className="font-semibold text-foreground mt-1">
                {formData.email}
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p>
                Cliquez sur le lien dans l'email pour activer votre compte et accéder à MY CHARLIE.
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Utiliser une autre adresse
              </Button>
              <Link href="/login">
                <Button variant="ghost" className="w-full">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <Link 
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-btp rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Créer un compte
                </CardTitle>
              </div>
              <CardDescription className="text-base">
                Rejoignez les artisans qui gagnent du temps avec CHARLIE
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Ma Super Entreprise"
                      className="pl-10 h-12"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@entreprise.fr"
                      className="pl-10 h-12"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="06 12 34 56 78"
                      className="pl-10 h-12"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="autoPassword"
                      checked={autoPassword}
                      onChange={(e) => setAutoPassword(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="autoPassword" className="text-sm font-normal cursor-pointer">
                      Générer un mot de passe automatiquement (recommandé)
                    </Label>
                  </div>
                  {!autoPassword && (
                    <>
                      <Label htmlFor="password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10 h-12"
                          required
                          minLength={8}
                          value={formData.password || ''}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Minimum 8 caractères
                      </p>
                    </>
                  )}
                  {autoPassword && (
                    <p className="text-xs text-muted-foreground">
                      Un mot de passe sécurisé sera généré automatiquement et vous sera envoyé par email.
                    </p>
                  )}
                </div>

                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, acceptTerms: checked as boolean })
                    }
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed">
                    J'accepte les{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      conditions générales
                    </Link>{' '}
                    et la{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      politique de confidentialité
                    </Link>
                  </label>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-btp hover:opacity-90"
                  disabled={loading || !formData.acceptTerms}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    'Créer mon compte gratuit'
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    Se connecter
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex bg-gradient-btp text-white p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Simplifiez votre gestion BTP
          </h1>
          <p className="text-xl opacity-90 mb-8 leading-relaxed">
            Rejoignez les centaines d'artisans qui ont automatisé leur administratif avec MY CHARLIE.
          </p>
          
          <div className="space-y-6">
            {[
              {
                title: 'Gagnez du temps',
                desc: 'CHARLIE gère vos devis et factures automatiquement',
              },
              {
                title: 'Ne perdez plus d\'argent',
                desc: 'Relances automatiques pour les impayés',
              },
              {
                title: 'Restez concentré',
                desc: 'Consacrez votre temps à votre métier',
              },
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  <p className="opacity-80">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-sm font-medium mb-2">🎁 Essai gratuit 14 jours</p>
            <p className="text-sm opacity-80">
              Testez toutes les fonctionnalités sans engagement ni carte bancaire
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


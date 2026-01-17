'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles, Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'auth') {
      toast.error("Erreur d'authentification. Veuillez réessayer.")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      toast.success('Connexion réussie !')
      router.push('/dashboard')
      router.refresh()
    } catch (error: unknown) {
      console.error('Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la connexion'

      if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid_credentials')) {
        toast.error('Email ou mot de passe incorrect', {
          description: 'Si vous avez oublié votre mot de passe, cliquez sur "Oublié ?" pour le réinitialiser.',
          duration: 5000,
        })
      } else if (errorMessage.includes('Email not confirmed')) {
        toast.error('Veuillez confirmer votre email avant de vous connecter')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
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
                  MY CHARLIE
                </CardTitle>
              </div>
              <CardDescription className="text-base">Connectez-vous pour accéder à votre espace</CardDescription>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10 h-12"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-12"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full h-12 bg-gradient-btp hover:opacity-90" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex bg-gradient-btp text-white p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
            Bienvenue sur MY CHARLIE
          </h1>
          <p className="text-xl opacity-90 mb-8 leading-relaxed">
            L'assistant intelligent qui révolutionne la gestion administrative des artisans BTP.
          </p>

          <div className="space-y-4">
            {[
              'Devis et factures en quelques clics',
              'Relances automatiques des impayés',
              'Assistant WhatsApp disponible 24/7',
              'Tableau de bord en temps réel',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm">✓</span>
                </div>
                <span className="text-lg">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

    </div>
  )
}

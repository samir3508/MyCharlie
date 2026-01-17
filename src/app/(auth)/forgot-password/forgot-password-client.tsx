'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Sparkles, Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseClient()

      // Utiliser l'URL de production si disponible, sinon window.location.origin
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = `${appUrl}/auth/callback?type=recovery`
      
      console.log('[Password Reset] Requesting reset for:', email)
      console.log('[Password Reset] App URL:', appUrl)
      console.log('[Password Reset] Redirect URL:', redirectUrl)

      const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      console.log('[Password Reset] Response:', { error, data })
      
      if (error) {
        console.error('[Password Reset] Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        })
        throw error
      }

      // Si pas d'erreur, l'email devrait être envoyé
      console.log('[Password Reset] ✅ Email envoyé avec succès')
      console.log('[Password Reset] Vérifiez votre boîte mail:', email)
      console.log('[Password Reset] Vérifiez aussi le dossier spam')
      
      setEmailSent(true)
      toast.success('Email de réinitialisation envoyé ! Vérifiez votre boîte mail (et le dossier spam).')
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      
      let errorMessage = 'Erreur lors de l\'envoi de l\'email'
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        if (errorMsg.includes('12 seconds') || errorMsg.includes('rate limit')) {
          errorMessage = 'Veuillez patienter 12 secondes avant de réessayer. Un email a peut-être déjà été envoyé.'
        } else if (errorMsg.includes('invalid email')) {
          errorMessage = 'Adresse email invalide'
        } else if (errorMsg.includes('user not found')) {
          errorMessage = 'Aucun compte trouvé avec cet email'
        } else {
          errorMessage = error.message
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Email envoyé !</CardTitle>
              <CardDescription className="text-base">
                Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Instructions :</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Vérifiez votre boîte de réception</li>
                  <li>Cliquez sur le lien dans l'email</li>
                  <li>Créez un nouveau mot de passe</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Si vous ne recevez pas l'email dans quelques minutes, vérifiez votre dossier spam.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">💡 Alternative :</p>
                <p className="text-sm text-yellow-700">
                  Si l'email n'arrive pas, vous pouvez aussi réinitialiser votre mot de passe directement depuis le <strong>Supabase Dashboard</strong> → <strong>Authentication</strong> → <strong>Users</strong> → <strong>Send password reset email</strong>
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full"
              >
                Réessayer avec un autre email
              </Button>
              <Link href="/login" className="text-sm text-primary hover:underline text-center">
                Retour à la connexion
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à la connexion
        </Link>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-btp rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
                Réinitialiser le mot de passe
              </CardTitle>
            </div>
            <CardDescription className="text-base">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleResetPassword}>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full h-12 bg-gradient-btp hover:opacity-90" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

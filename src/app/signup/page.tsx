'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Mail, Phone, Building2, User, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    entreprise: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'signup'
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Inscription envoyée !</h2>
            <p className="text-gray-400 mb-6">Nous vous contacterons dans les 24h pour mettre en place votre essai de Charlie.</p>
            <p className="text-sm text-gray-500">Redirection vers l'accueil...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Link href="/" className="flex items-center text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Essai Gratuit</CardTitle>
          <CardDescription className="text-gray-400">
            Inscrivez-vous pour essayer Charlie gratuitement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-gray-300 flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet *
              </Label>
              <Input
                id="nom"
                name="nom"
                type="text"
                value={formData.nom}
                onChange={handleChange}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="jean@exemple.fr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone" className="text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone *
              </Label>
              <Input
                id="telephone"
                name="telephone"
                type="tel"
                value={formData.telephone}
                onChange={handleChange}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="06 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entreprise" className="text-gray-300 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Entreprise
              </Label>
              <Input
                id="entreprise"
                name="entreprise"
                type="text"
                value={formData.entreprise}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Entreprise ABC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Décrivez vos besoins..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3"
            >
              {isSubmitting ? 'Envoi en cours...' : 'S\'inscrire gratuitement'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Démo gratuite • Sans engagement • Réponse en 24h
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

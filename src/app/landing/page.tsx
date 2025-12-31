'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, MessageSquare, FileText, Send, Bell, Smartphone, Users, TrendingUp, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      // Simuler l'inscription
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                Charlie
              </span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">
                Témoignages
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                Tarifs
              </Link>
              <Button className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700">
                Essayer Gratuitement
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-4 bg-orange-100 text-orange-800 inline-flex">
            🚀 Nouveau - L'assistant IA pour les pros du BTP
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Charlie, votre secrétaire IA
            <br />
            spécialisé BTP
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Gérez vos clients, devis, factures et relances en un seul clic.
            <br />
            <span className="font-semibold text-blue-600">Charlie s'occupe de tout, vous vous concentrez sur vos chantiers.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
              Essayer Charlie Gratuitement
            </Button>
            <Button variant="outline" size="lg" className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg">
              Voir la démo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Tout ce dont vous avez besoin pour votre entreprise
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Charlie intègre toutes les fonctionnalités essentielles pour les professionnels du bâtiment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Gestion Client</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Créez et gérez facilement votre base de données clients. 
                  Charlie mémorise tout : coordonnées, historique, préférences.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Devis & Factures</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Générez devis et factures professionnels en quelques clics. 
                  Charlie calcule automatiquement les totaux, TVA et conditions de paiement.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Relances Automatiques</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Plus jamais d'impayés ! Charlie envoie automatiquement 
                  les relances par email et WhatsApp aux bons moments.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Assistant IA Conversationnel</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Parlez à Charlie naturellement par WhatsApp. 
                  Il comprend vos besoins et génère les documents instantanément.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Multi-canal</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Accédez à Charlie partout : WhatsApp, email, 
                  application web. Vos données synchronisées en temps réel.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Tableau de Bord</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Suivez votre activité en temps réel : CA, 
                  encours, taux de conversion, performances par chantier.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              3 étapes simples pour révolutionner votre gestion
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Parlez à Charlie</h3>
              <p className="text-gray-600">
                Envoyez simplement vos besoins par WhatsApp : 
                "Fais moi un devis pour M. Dupont..."
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Charlie génère</h3>
              <p className="text-gray-600">
                Charlie crée instantanément le devis professionnel 
                avec calculs automatiques et conditions adaptées.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Envoyez & Suivez</h3>
              <p className="text-gray-600">
                Recevez le document PDF et envoyez-le directement. 
                Suivez le statut en temps réel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Testez Charlie gratuitement
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Charlie est actuellement en version beta. Profitez-en pour tester 
            toutes les fonctionnalités gratuitement et donnez-nous votre retour.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email professionnel"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white"
                required
              />
              <Button 
                type="submit" 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8"
                disabled={submitted}
              >
                {submitted ? 'Inscription en cours...' : 'Rejoindre la Beta'}
              </Button>
            </div>
          </form>

          {submitted && (
            <div className="mt-6 p-4 bg-white/10 rounded-lg">
              <p className="text-white">
                ✅ Merci pour votre intérêt ! Nous vous contacterons dans les prochaines 24h.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Charlie</h3>
              <p className="text-gray-400">
                L'assistant IA qui révolutionne la gestion 
                pour les professionnels du BTP.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Gestion Client</li>
                <li>Devis & Factures</li>
                <li>Relances Auto</li>
                <li>Assistant IA</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Solutions</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Artisans</li>
                <li>PMI</li>
                <li>TPE</li>
                <li>Entreprises</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>help@charlie-btp.fr</li>
                <li>01 234 567 890</li>
                <li>Chat 24/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Charlie - Tous droits réservés</p>
            <p className="mt-2">
              Votre secrétaire IA spécialisé BTP - Made with ❤️ en France
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'

import type React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Receipt, 
  Bell,
  Sparkles,
  ChevronDown,
  Users,
  ShieldCheck,
  Phone,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Briefcase,
  HardHat,
  Wrench,
  PaintBucket,
  Zap,
  Target,
  Smartphone,
  Globe
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Image from 'next/image'

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  delay?: number
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10"
  >
    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-orange-500" />
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
)

export default function CharliePage() {
  const features = [
    {
      icon: FileText,
      title: 'Devis en 2 minutes',
      description: 'Créez des devis professionnels rapidement grâce à vos templates personnalisés.',
    },
    {
      icon: Receipt,
      title: 'Facturation automatique',
      description: 'Transformez vos devis en factures en un clic. Numérotation automatique conforme.',
    },
    {
      icon: Bell,
      title: 'Relances intelligentes',
      description: 'Ne perdez plus d\'argent. CHARLIE relance automatiquement vos clients en retard.',
    },
    {
      icon: MessageSquare,
      title: 'Assistant WhatsApp',
      description: 'CHARLIE gère vos demandes clients 24/7 directement sur WhatsApp.',
    },
    {
      icon: Users,
      title: 'Gestion des clients',
      description: 'Centralisez vos contacts clients et suivez vos échanges facilement.',
    },
    {
      icon: ShieldCheck,
      title: 'Sécurité des données',
      description: 'Vos données sont chiffrées et stockées de manière sécurisée en France.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <motion.span 
                className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              >
                CHARLIE
              </motion.span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" className="gap-1 group text-gray-300 hover:text-white">
                Fonctionnalités
                <ChevronDown className="w-4 h-4 opacity-70 group-hover:translate-y-0.5 transition-transform" />
              </Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white">Tarifs</Button>
              <Button variant="ghost" className="text-gray-300 hover:text-white">FAQ</Button>
            </nav>
            
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" className="hidden sm:flex border-gray-600 text-gray-300 hover:text-white">Connexion</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Rejoindre la Beta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section avec Charlie */}
      <section className="pt-40 pb-28 px-4 overflow-hidden relative">
        {/* Background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/10"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium border border-orange-500/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Version Beta - Accès Gratuit</span>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Votre assistant IA
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent"> pour le BTP</span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-300 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Charlie simplifie votre gestion : devis, factures, relances et clients. 
                Concentrez-vous sur vos chantiers, il s'occupe du reste.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="w-full h-14 px-8 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-orange-500/20"
                  >
                    Rejoindre la Beta Gratuitement
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#fonctionnalites" className="w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-14 px-8 text-lg border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
                  >
                    Découvrir
                  </Button>
                </Link>
              </motion.div>
              
              <motion.div 
                className="flex flex-wrap items-center gap-4 pt-4 text-sm text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Version Beta</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Accès complet gratuit</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Sans carte bancaire</span>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Charlie Illustration */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative z-10">
                {/* Placeholder pour l'image de Charlie - à remplacer avec les vraies images */}
                <div className="aspect-square bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl flex items-center justify-center border border-orange-500/30">
                  <div className="text-center">
                    <div className="w-32 h-32 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                      <HardHat className="w-16 h-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Charlie</h3>
                    <p className="text-gray-300">Votre assistant BTP personnel</p>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-orange-500/20 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-orange-600/20 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Charlie en action - Section avec multiples poses */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">Charlie, votre assistant polyvalent</h2>
            <p className="text-xl text-gray-300">
              De la gestion administrative au conseil technique, Charlie s'adapte à tous vos besoins
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Charlie Administratif",
                description: "Gestion des devis, factures et relances",
                icon: Briefcase,
                color: "from-blue-500 to-blue-600"
              },
              {
                title: "Charlie Technique", 
                description: "Conseils et expertise BTP",
                icon: Wrench,
                color: "from-green-500 to-green-600"
              },
              {
                title: "Charlie Commercial",
                description: "Relation client et suivi chantier",
                icon: Phone,
                color: "from-purple-500 to-purple-600"
              }
            ].map((charlie, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className={`aspect-square bg-gradient-to-br ${charlie.color}/20 rounded-3xl flex items-center justify-center border border-${charlie.color}/30 mb-6`}>
                  <charlie.icon className="w-24 h-24 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{charlie.title}</h3>
                <p className="text-gray-300">{charlie.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-xl text-gray-300">
              Charlie simplifie votre quotidien avec des outils conçus spécialement pour les artisans du BTP.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Beta Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Version Beta</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Testez Charlie gratuitement</h2>
            <p className="text-xl text-gray-300">
              Charlie est actuellement en version beta. Profitez-en pour tester toutes les fonctionnalités gratuitement.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Accès complet</h3>
              <p className="text-gray-300">Toutes les fonctionnalités disponibles sans limitation</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% gratuit</h3>
              <p className="text-gray-300">Aucune carte bancaire requise pendant la beta</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Votre avis compte</h3>
              <p className="text-gray-300">Aidez-nous à améliorer Charlie avec vos retours</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="bg-gray-900 p-8 md:p-12 rounded-3xl shadow-xl border border-gray-800"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à tester Charlie gratuitement ?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Rejoignez la version beta et découvrez comment Charlie peut simplifier votre gestion d'entreprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                  Rejoindre la Beta
                </Button>
              </Link>
              <Link href="#fonctionnalites" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-14 px-8 text-lg border-gray-600 text-gray-300 hover:text-white hover:border-gray-500">
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">CHARLIE</span>
              </div>
              <p className="text-gray-400 mb-6">
                L'assistant intelligent qui simplifie la gestion de votre entreprise artisanale.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Ressources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Statut</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400 mb-4 md:mb-0">
              {new Date().getFullYear()} CHARLIE. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Mentions légales</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Politique de confidentialité</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">CGV</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

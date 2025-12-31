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
  Star,
  Users,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Home,
  User,
  Settings,
  HelpCircle,
  FileQuestion,
  MessageCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type FeatureCardProps = {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  delay?: number
}

type TestimonialCardProps = {
  name: string
  role: string
  content: string
  delay?: number
}

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className="bg-card p-6 rounded-2xl border border-border hover:border-primary/20 transition-all hover:shadow-lg"
  >
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </motion.div>
)

const TestimonialCard = ({ name, role, content, delay = 0 }: TestimonialCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: delay * 0.1 }}
    className="bg-card p-6 rounded-2xl border border-border"
  >
    <div className="flex items-center gap-2 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      ))}
    </div>
    <p className="text-muted-foreground mb-4">"{content}"</p>
    <div>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-muted-foreground">{role}</p>
    </div>
  </motion.div>
)

export default function HomePage() {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform"
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
                className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                MY CHARLIE
              </motion.span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button variant="ghost" className="gap-1 group">
                Fonctionnalités
                <ChevronDown className="w-4 h-4 opacity-70 group-hover:translate-y-0.5 transition-transform" />
              </Button>
              <Button variant="ghost">Tarifs</Button>
              <Button variant="ghost">Témoignages</Button>
              <Button variant="ghost">FAQ</Button>
            </nav>
            
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="outline" className="hidden sm:flex">Connexion</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity">
                  Essai gratuit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-28 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          {/* Background elements */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
          
          <div className="relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium border border-yellow-200 shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Version Beta - Accès Gratuit</span>
                </motion.div>
                
                <motion.h1 
                  className="text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Gérez votre activité
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> simplement</span>
                </motion.h1>
                
                <motion.p 
                  className="text-xl text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  MY CHARLIE automatise vos devis, factures et relances. 
                  Concentrez-vous sur votre métier, on s'occupe du reste.
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
                      className="w-full h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 transition-opacity shadow-lg hover:shadow-primary/20"
                    >
                      Rejoindre la Beta Gratuitement
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#fonctionnalites" className="w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full h-14 px-8 text-lg border-2"
                    >
                      Découvrir
                    </Button>
                  </Link>
                </motion.div>
                
                <div className="flex flex-wrap items-center gap-4 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Version Beta</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Accès complet gratuit</span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Sans carte bancaire</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="relative"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <div className="relative z-10 bg-card/50 backdrop-blur-sm border rounded-3xl overflow-hidden shadow-2xl">
                  <div className="h-8 flex items-center px-4 border-b">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Tableau de bord MY CHARLIE</h3>
                      <p className="text-muted-foreground text-sm">Vue d'ensemble de votre activité en temps réel</p>
                    </div>
                  </div>
                </div>
                
                {/* Floating elements */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/10 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
                <div className="absolute -top-6 -right-6 w-40 h-40 bg-accent/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 px-4 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">Tout ce dont vous avez besoin pour gérer votre activité</h2>
            <p className="text-xl text-muted-foreground">
              MY CHARLIE simplifie votre quotidien avec des outils conçus spécialement pour les artisans du BTP.
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
      <section className="py-20 px-4 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Version Beta</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Testez Charlie gratuitement</h2>
            <p className="text-xl text-muted-foreground">
              Charlie est actuellement en version beta. Profitez-en pour tester toutes les fonctionnalités gratuitement et donnez-nous votre retour.
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Accès complet</h3>
              <p className="text-muted-foreground">Toutes les fonctionnalités disponibles sans limitation</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% gratuit</h3>
              <p className="text-muted-foreground">Aucune carte bancaire requise pendant la beta</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center p-6"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Votre avis compte</h3>
              <p className="text-muted-foreground">Aidez-nous à améliorer Charlie avec vos retours</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="bg-background p-8 md:p-12 rounded-3xl shadow-xl border border-border/50"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à tester Charlie gratuitement ?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Rejoignez la version beta et découvrez comment Charlie peut simplifier votre gestion d'entreprise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-14 px-8 text-lg bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 transition-opacity">
                  Rejoindre la Beta
                </Button>
              </Link>
              <Link href="#fonctionnalites" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-14 px-8 text-lg">
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-background border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>MY CHARLIE</span>
              </div>
              <p className="text-muted-foreground mb-6">
                L'assistant intelligent qui simplifie la gestion de votre entreprise artisanale.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Tarifs</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Témoignages</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">À propos</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Carrières</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Ressources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Statut</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              {new Date().getFullYear()} MY CHARLIE. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Politique de confidentialité</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">CGV</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, MessageSquare, FileText, Clock, Bell, Sparkles, ChevronDown, ChevronUp, Users, ShieldCheck, Phone, Send, FileSignature, Smartphone, TrendingUp, Zap, Target, Heart, Calendar, Check, AlertCircle, Timer, DollarSign, Briefcase, Building2, HardHat, Calculator, RotateCcw, Euro, Star, Mail, Trash2, Download, Shield, Database } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import DemoModal from '@/components/DemoModal'
import RoiCalculator from '@/components/RoiCalculator'

const FAQItem = ({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) => (
  <div className="border-b border-gray-800">
    <button onClick={onClick} className="w-full py-6 flex items-center justify-between text-left hover:text-orange-400 transition-colors">
      <span className="text-lg font-medium">{question}</span>
      {isOpen ? <ChevronUp className="w-5 h-5 text-orange-500" /> : <ChevronDown className="w-5 h-5" />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
          <p className="pb-6 text-gray-400">{answer}</p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const StepCard = ({ number, title, description, example, delay }: { number: string; title: string; description: string; example: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }} className="relative">
    <div className="flex gap-6">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-xl font-bold">{number}</div>
      </div>
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-400 mb-4">{description}</p>
        <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-xl p-4 border border-orange-500/30">
          <p className="text-sm text-gray-300 italic">&quot;{example}&quot;</p>
        </div>
      </div>
    </div>
  </motion.div>
)

const BenefitCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }} className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 p-6 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all">
    <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-orange-500" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </motion.div>
)

const SliderInput = ({ label, value, onChange, min, max, step, unit, suffix }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit?: string; suffix?: string }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <span className="text-gray-300">{label}</span>
      <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent font-bold">{value}{unit || ''} {suffix || ''}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
  </div>
)

export default function HomePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [demoSource, setDemoSource] = useState<'demo' | 'signup'>('demo')

  const faqs = [
    { question: "C'est vraiment par WhatsApp ?", answer: "Oui ! Charlie est accessible directement via WhatsApp. Tu lui parles comme à un collègue, et il gère tout pour toi." },
    { question: "Et si je préfère valider chaque document ?", answer: "Pas de problème ! Tu peux configurer Charlie pour qu'il te demande validation avant chaque envoi." },
    { question: "La signature électronique est-elle légalement valide ?", answer: "Absolument. Notre signature électronique est conforme au règlement eIDAS." },
    { question: "Comment Charlie connaît mes tarifs ?", answer: "Tu configures tes informations une seule fois : tarifs, conditions, mentions légales." },
    { question: "Combien ça coûte ?", answer: "Charlie est actuellement en version beta gratuite. Sans engagement et sans carte bancaire." },
    { question: "Mes données sont-elles sécurisées ?", answer: "Tes données sont hébergées en France, chiffrées et conformes au RGPD." }
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-2">
              <NextImage src="/logo-charlie.png" alt="Logo Charlie" width={800} height={200} className="h-20 w-[32rem] object-contain scale-110 origin-left" priority />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#comment-ca-marche" className="text-gray-400 hover:text-white">Comment ça marche</a>
              <a href="#calculateur" className="text-gray-400 hover:text-white">Calculateur ROI</a>
              <a href="#avantages" className="text-gray-400 hover:text-white">Avantages</a>
              <a href="#faq" className="text-gray-400 hover:text-white">FAQ</a>
              <a href="#gestion-donnees" className="text-gray-400 hover:text-orange-400 flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Mes données
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Connexion</Button></Link>
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600" onClick={() => { setDemoSource('signup'); setDemoModalOpen(true); }}>Essayer gratuitement</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col">

      <section className="pt-32 pb-16 px-4 relative bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div className="space-y-8" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm border border-orange-500/30">
                  <Zap className="w-4 h-4" /><span>🚀 L'assistant IA qui transforme ton quotidien</span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="text-white">Le secrétaire</span><br />
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">IA</span><br />
                  <span className="text-white">des pros du bâtiment</span>
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                  Charlie gère tes clients, devis, factures et relances. Par WhatsApp et via ton logiciel de suivi. 
                  <span className="text-orange-400 font-medium"> Gagne 10h par mois</span> sans effort.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button size="lg" className="w-full sm:w-auto h-16 px-8 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200" onClick={() => { setDemoSource('demo'); setDemoModalOpen(true); }}>
                  <Sparkles className="mr-2 w-5 h-5" />Demander une démo gratuite<ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <a href="#comment-ca-marche"><Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-8 text-lg border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-orange-500 transition-all duration-200">Voir comment ça marche</Button></a>
              </div>
              
              <div className="grid grid-cols-3 gap-6 pt-8">
                <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-3 border border-orange-500/30">
                    <Timer className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">&lt;2 min</p>
                  <p className="text-sm text-gray-400">Devis créé</p>
                </motion.div>
                <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-3 border border-orange-500/30">
                    <Bell className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">Auto</p>
                  <p className="text-sm text-gray-400">Relances</p>
                </motion.div>
                <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-3 border border-orange-500/30">
                    <Users className="w-8 h-8 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-sm text-gray-400">Suivi client</p>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div className="relative" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="relative z-10 flex justify-center">
                <div className="relative">
                  <NextImage src="/charlie-hero-v2.png" alt="Charlie - Assistant IA BTP" width={400} height={400} className="object-contain z-10 scale-110" priority />
                  
                  {/* Cartes flottantes simplifiées */}
                  <motion.div className="absolute -right-16 top-8 bg-gradient-to-br from-gray-900 to-gray-800 border border-orange-500/30 rounded-xl p-3 z-20 shadow-lg" animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <Send className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Devis envoyé</p>
                        <p className="text-xs text-gray-400">M. Dupont</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div className="absolute -left-20 top-16 bg-gray-900 border border-gray-700 rounded-xl p-3 z-20" animate={{ y: [0, 5, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Paiement reçu</p>
                        <p className="text-xs text-gray-400">Facture #1234</p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div className="absolute -right-16 bottom-16 bg-gray-900 border border-gray-700 rounded-xl p-3 z-20" animate={{ y: [0, -4, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">Nouveau message</p>
                        <p className="text-xs text-gray-400">Via WhatsApp</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-black via-black to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5"></div>
        <div className="max-w-4xl mx-auto relative">
          <motion.div className="text-center space-y-8" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                Bienvenue chez <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">My Charlie</span>.
              </h2>
              <p className="text-xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
                Tu n'es pas juste sur un logiciel.<br />
                Tu es au début d'une aventure.
              </p>
            </div>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              <p className="text-lg text-gray-400 leading-relaxed">
                My Charlie est né d'un constat simple :<br />
                les pros du bâtiment méritent mieux qu'un outil compliqué<br />
                pour gérer leur quotidien.
              </p>
              
              <p className="text-lg text-gray-400 leading-relaxed">
                Aujourd'hui, Charlie est déjà là pour t'aider.<br />
                Et dans les prochains mois, il va évoluer, grandir,<br />
                et devenir le produit que beaucoup ont toujours rêvé d'avoir.
              </p>
              
              <div className="space-y-4 pt-4">
                <p className="text-lg text-gray-300 font-medium">
                  Un assistant qui comprend ton métier.<br />
                  Un secrétaire qui pense à ta place.<br />
                  Un outil qui te fait gagner du temps, vraiment.
                </p>
                
                <p className="text-lg text-orange-400 font-medium pt-4">
                  Tu fais partie des premiers.<br />
                  Et ce que tu vas utiliser demain<br />
                  sera encore meilleur qu'aujourd'hui.
                </p>
              </div>
            </div>
            
            <div className="pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500 italic">
                My Charlie — une aventure qui commence avec toi.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-br from-black via-black to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-600/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm border border-orange-500/30 backdrop-blur-sm mb-6">
              <Star className="w-4 h-4" /><span>Pourquoi nous choisir</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="text-white">Charlie, ton assistant IA qui</span><br />
              <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">comprend vraiment</span><br />
              <span className="text-white">ton métier</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Conçu spécifiquement pour les artisans du bâtiment. 
              Parce que ton temps est précieux et que tu mérites un outil qui travaille <span className="text-orange-400 font-medium">pour</span> toi.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { 
                icon: Zap, 
                title: "Ultra-rapide", 
                description: "Devis et factures en moins de 2 minutes. Plus besoin de passer des heures sur l'administratif."
              },
              { 
                icon: MessageSquare, 
                title: "WhatsApp intégré", 
                description: "Gère tout par WhatsApp comme tu le fais déjà. Aucune nouvelle application à apprendre."
              },
              { 
                icon: ShieldCheck, 
                title: "100% fiable", 
                description: "Relances automatiques, suivi des paiements, archivage. Plus rien n'oublie, jamais."
              },
              { 
                icon: TrendingUp, 
                title: "+10h/mois gagnées", 
                description: "En moyenne, nos artisans gagnent 10 heures par mois. C'est 120 heures par an de liberté."
              },
              { 
                icon: Users, 
                title: "Clients satisfaits", 
                description: "Communication pro, devis soignés, suivi impeccable. Tes clients te remarquent."
              },
              { 
                icon: Heart, 
                title: "Moins de stress", 
                description: "La charge mentale, c'est Charlie qui la prend. Tu te concentres sur ce que tu aimes."
              }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                className="h-full p-8 rounded-2xl bg-black border border-gray-700 hover:border-orange-500 transition-all duration-200"
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: index * 0.1 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mb-6">
                  <item.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 hover:text-orange-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6 border border-orange-500/30"><AlertCircle className="w-4 h-4" /><span>Le problème</span></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">L&apos;administratif, ça bouffe ton temps.</h2>
            <p className="text-xl text-gray-400">Tu es artisan, pas secrétaire. Pourtant tu passes des heures sur la paperasse.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[{ icon: Clock, text: "Tu perds du temps le soir et le week-end sur l'administratif" }, { icon: FileText, text: "Créer un devis prend 30 minutes (parfois plus)" }, { icon: DollarSign, text: "Tu oublies de relancer → paiements en retard" }, { icon: Users, text: "Difficile de suivre qui doit quoi" }].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex items-start gap-4 p-4 bg-gradient-to-r from-gray-900/30 to-gray-800/30 rounded-xl border border-gray-800">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0"><item.icon className="w-5 h-5 text-orange-500" /></div>
                <p className="text-gray-300">{item.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.p className="text-center text-xl text-gray-400 mt-12 max-w-2xl mx-auto" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <span className="text-white font-semibold">Résultat :</span> tu travailles <span className="text-orange-400">pour</span> ton entreprise, pas <span className="text-orange-400">sur</span> ton entreprise.
          </motion.p>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div className="relative order-2 lg:order-1" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="relative z-10 flex justify-center">
                <NextImage src="/charlie-document-v2.png" alt="Charlie avec document" width={400} height={400} className="object-contain z-10 scale-110" />
              </div>
            </motion.div>
            <motion.div className="space-y-6 order-1 lg:order-2" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm border border-orange-500/30"><Sparkles className="w-4 h-4" /><span>La solution</span></div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Voici Charlie. Ton assistant administratif.</h2>
              <p className="text-xl text-gray-300">Charlie gère tout l&apos;administratif pour toi. Par WhatsApp ou depuis ton logiciel de suivi.</p>
              <div className="space-y-4 pt-4">
                {["Comprend ta demande", "Vérifie les infos", "Crée les documents", "Envoie aux clients", "Relance automatiquement", "Fait signer électroniquement"].map((item, index) => (
                  <motion.div key={index} className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                    <span className="text-lg text-white">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-3xl p-8 md:p-12 border border-orange-500/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm"><FileSignature className="w-4 h-4" /><span>Signature électronique</span></div>
                <h2 className="text-3xl font-bold text-white">Devis et factures signés électroniquement</h2>
                <p className="text-gray-300">Charlie peut envoyer tes devis à signer, suivre la signature, te prévenir, et archiver automatiquement.</p>
                <div className="grid grid-cols-2 gap-4">
                  {[{ icon: Send, text: "Envoi automatique" }, { icon: Target, text: "Suivi en temps réel" }, { icon: ShieldCheck, text: "Légalement valide" }, { icon: Briefcase, text: "Archivage sécurisé" }].map((item, index) => (
                    <div key={index} className="flex items-center gap-2"><item.icon className="w-5 h-5 text-orange-500" /><span className="text-sm text-gray-300">{item.text}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-80 bg-white rounded-xl shadow-2xl p-6 text-gray-900">
                  <div className="text-center mb-4"><p className="text-xs text-gray-500">DEVIS N°2024-0042</p><p className="font-bold">Rénovation cuisine</p></div>
                  <div className="space-y-2 text-xs"><div className="flex justify-between"><span>Main d&apos;œuvre</span><span>2 400 €</span></div><div className="flex justify-between"><span>Fournitures</span><span>3 200 €</span></div><div className="border-t pt-2 flex justify-between font-bold"><span>Total TTC</span><span>5 600 €</span></div></div>
                  <div className="mt-6 pt-4 border-t"><p className="text-xs text-gray-500 mb-2">Signature client</p><div className="h-16 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center bg-orange-50"><span className="text-orange-500 text-xl italic">M. Martin</span></div><div className="flex items-center gap-1 mt-2 text-xs text-orange-400"><CheckCircle2 className="w-3 h-3" /><span>Signé le 15/01/2025</span></div></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="comment-ca-marche" className="py-20 px-4 bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6"><Zap className="w-4 h-4" /><span>Simple comme bonjour</span></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Comment ça marche ?</h2>
            <p className="text-xl text-gray-300">Processus détaillé de Charlie – de la demande à l'envoi de devis/facture</p>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {/* Étape 1 - Demande initiale */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">1</div>
                  <p className="text-orange-400 text-sm mt-2">L'utilisateur fait sa demande</p>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-md">
                    <p className="text-white text-sm">Devis pour Thomas Bernard, 12 rue Victor Hugo, protection sols + peinture</p>
                  </div>
                </div>
              </motion.div>

              {/* Étape 2 - Premier résumé */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">2</div>
                  <p className="text-orange-400 text-sm mt-2">Premier résumé de la demande</p>
                </div>
                <div className="flex justify-end">
                  <div className="bg-orange-500 rounded-2xl rounded-tr-none p-4 max-w-md">
                    <p className="text-white text-sm font-medium mb-2">📋 RÉSUMÉ DE VOTRE DEMANDE</p>
                    <p className="text-white text-xs mb-1">👤 Client: Thomas Bernard</p>
                    <p className="text-white text-xs mb-1">📍 Chantier: 12 rue Victor Hugo</p>
                    <p className="text-white text-xs mb-1">🔧 Travaux: Protection sols + Peinture</p>
                    <p className="text-white text-xs mb-2">💰 Estimation: En cours de calcul</p>
                    <p className="text-white text-xs italic">❓ Adresse de facturation ? Délais d'exécution ?</p>
                  </div>
                </div>
              </motion.div>

              {/* Étape 3 - Questions complémentaires */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">3</div>
                  <p className="text-orange-400 text-sm mt-2">Questions complémentaires</p>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-md">
                    <p className="text-white text-sm">Adresse de facturation identique au chantier. Délais: 2 semaines.</p>
                  </div>
                </div>
              </motion.div>

              {/* Étape 4 - Résumé global */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">4</div>
                  <p className="text-orange-400 text-sm mt-2">Résumé global de la demande</p>
                </div>
                <div className="flex justify-end">
                  <div className="bg-orange-500 rounded-2xl rounded-tr-none p-4 max-w-md">
                    <p className="text-white text-sm font-medium mb-2">📄 DEVIS COMPLET PRÊT</p>
                    <p className="text-white text-xs mb-1">👤 Thomas Bernard</p>
                    <p className="text-white text-xs mb-1">📍 12 rue Victor Hugo</p>
                    <p className="text-white text-xs mb-1">🔧 Protection sols: 800€ HT</p>
                    <p className="text-white text-xs mb-1">🎨 Peinture: 1,200€ HT</p>
                    <p className="text-white text-xs mb-2">💰 TOTAL: 2,000€ HT / 2,400€ TTC</p>
                    <p className="text-white text-xs italic">✅ Validez pour création du devis</p>
                  </div>
                </div>
              </motion.div>

              {/* Étape 5 - Création du devis */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">5</div>
                  <p className="text-orange-400 text-sm mt-2">Création du devis</p>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-md">
                    <p className="text-white text-sm">✅ Validé</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-orange-500 rounded-2xl rounded-tr-none p-4 max-w-md">
                    <p className="text-white text-sm font-medium mb-2">📄 DEVIS DV-2026-013 CRÉÉ</p>
                    <p className="text-white text-xs mb-1">✅ Numérotation automatique</p>
                    <p className="text-white text-xs mb-1">✅ Conditions de paiement</p>
                    <p className="text-white text-xs mb-1">✅ TVA et totaux détaillés</p>
                    <p className="text-white text-xs italic">📤 Comment envoyer ce devis ?</p>
                  </div>
                </div>
              </motion.div>

              {/* Étape 6 - Envoi */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">6</div>
                  <p className="text-orange-400 text-sm mt-2">Résumé final avant envoi</p>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl rounded-tl-none p-4 max-w-md">
                    <p className="text-white text-sm">WhatsApp + Email</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-green-600 rounded-2xl rounded-tr-none p-4 max-w-md">
                    <p className="text-white text-sm font-medium mb-2">🎉 DEVIS ENVOYÉ AVEC SUCCÈS</p>
                    <p className="text-white text-xs mb-1">📱 WhatsApp: Envoyé</p>
                    <p className="text-white text-xs mb-1">📧 Email: Envoyé</p>
                    <p className="text-white text-xs mb-1">🔄 Relance J+3 programmée</p>
                    <p className="text-white text-xs italic">✨ Je vous tiens au courant !</p>
                  </div>
                </div>
              </motion.div>

              {/* Étape 7 - Vision complète */}
              <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
                <div className="text-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm font-bold mx-auto">7</div>
                  <p className="text-orange-400 text-sm mt-2">Vision complète</p>
                </div>
                <div className="flex justify-end">
                  <div className="bg-gray-800 rounded-2xl rounded-tr-none p-4 max-w-md">
                    <p className="text-white text-sm font-medium mb-2">📊 VOTRE TABLEAU DE BORD</p>
                    <p className="text-white text-xs mb-1">📋 DV-2026-013: Envoyé (En attente signature)</p>
                    <p className="text-white text-xs mb-1">📞 Relance: 3 jours</p>
                    <p className="text-white text-xs mb-1">💰 Facture: Prête (en attente validation)</p>
                    <p className="text-white text-xs italic">🎯 Tout centralisé, rien n'oublie !</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div className="space-y-6" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 text-sm border border-orange-500/30"><Calendar className="w-4 h-4" /><span>Notification quotidienne</span></div>
              <h2 className="text-3xl sm:text-4xl font-bold">Chaque matin, Charlie fait le point pour toi</h2>
              <p className="text-xl text-gray-400">Tout est configurable : fréquence, types d&apos;alertes, confirmation obligatoire ou action automatique.</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full border border-gray-700/50"><Clock className="w-4 h-4 text-orange-500" /><span className="text-sm">Fréquence personnalisable</span></div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-full border border-gray-700/50"><CheckCircle2 className="w-4 h-4 text-orange-500" /><span className="text-sm">Confirmation ou auto</span></div>
              </div>
            </motion.div>
            <motion.div className="flex justify-center" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="w-72 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border border-orange-500/30 p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4 text-xs text-gray-400"><span>08:00</span><span>�� 100%</span></div>
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"><HardHat className="w-4 h-4 text-white" /></div><span className="font-medium">Charlie</span><span className="text-xs text-gray-400">08:00</span></div>
                  <div className="space-y-2 text-sm"><p>Bonjour 👋</p><p>Aujourd&apos;hui :</p><p className="text-orange-400">• 2 factures à relancer</p><p className="text-orange-400">• 1 devis en attente de signature</p><p className="mt-2">Tu veux que je m&apos;en occupe ?</p></div>
                  <div className="flex gap-2 mt-4"><button className="flex-1 py-2 bg-orange-500 rounded-lg text-sm font-medium">Oui, vas-y</button><button className="flex-1 py-2 bg-gray-700 rounded-lg text-sm">Plus tard</button></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <RoiCalculator />

      <section id="faq" className="order-[100] py-20 px-4 bg-gradient-to-br from-black via-black to-black">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Questions fréquentes</h2>
          </motion.div>
          <div className="space-y-0">{faqs.map((faq, index) => (<FAQItem key={index} question={faq.question} answer={faq.answer} isOpen={openFAQ === index} onClick={() => setOpenFAQ(openFAQ === index ? null : index)} />))}</div>
        </div>
      </section>

      <section id="gestion-donnees" className="py-20 px-4 bg-gradient-to-br from-gray-900 via-black to-gray-900 border-t-2 border-orange-500/50 relative scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8">
            <motion.div className="text-center space-y-3" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm border border-orange-500/30 mb-4">
                <Shield className="w-4 h-4" />
                <span>Protection de vos données</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">Gestion de vos données personnelles</h3>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">Nous respectons votre vie privée et protégeons vos données conformément au RGPD. Vous avez le contrôle total sur vos données.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Link href="/supprimer-donnees" className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-2 border-orange-500/40 rounded-xl p-6 hover:bg-orange-500/30 hover:border-orange-500 transition-all duration-200 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/30 flex items-center justify-center group-hover:bg-orange-500/50 transition-colors">
                    <Trash2 className="w-6 h-6 text-orange-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Supprimer mes données</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">Demander la suppression complète de toutes vos données personnelles. Traitement sous 30 jours.</p>
                <div className="mt-4 text-orange-400 text-sm font-medium group-hover:underline">Formulaire de suppression →</div>
              </Link>
              
              <Link href="/politique-confidentialite#acces" className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/40 rounded-xl p-6 hover:bg-blue-500/30 hover:border-blue-500 transition-all duration-200 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/30 flex items-center justify-center group-hover:bg-blue-500/50 transition-colors">
                    <Download className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Accéder à mes données</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">Obtenir une copie complète de toutes vos données personnelles au format JSON, CSV ou PDF.</p>
                <div className="mt-4 text-blue-400 text-sm font-medium group-hover:underline">En savoir plus →</div>
              </Link>
              
              <Link href="/politique-confidentialite" className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/40 rounded-xl p-6 hover:bg-purple-500/30 hover:border-purple-500 transition-all duration-200 group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/30 flex items-center justify-center group-hover:bg-purple-500/50 transition-colors">
                    <Shield className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-xl font-bold text-white">Politique complète</h4>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">Consulter notre politique de confidentialité complète : WhatsApp, agents IA, durée de conservation...</p>
                <div className="mt-4 text-purple-400 text-sm font-medium group-hover:underline">Consulter →</div>
              </Link>
            </div>
            
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 mt-8">
              <h4 className="text-lg font-semibold text-white mb-4 text-center">Informations importantes</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Sécurité :</strong> Vos données sont hébergées en France, chiffrées et conformes au RGPD
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Contact :</strong> <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300">ddvcontact35@gmail.com</a> pour exercer vos droits
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 pt-4 border-t border-gray-800">
              <Link href="/politique-confidentialite" className="hover:text-orange-400 transition-colors font-medium">Politique de confidentialité</Link>
              <span>•</span>
              <Link href="/supprimer-donnees" className="hover:text-orange-400 transition-colors font-medium text-orange-400">Supprimer mes données</Link>
              <span>•</span>
              <Link href="/mentions-legales" className="hover:text-orange-400 transition-colors">Mentions légales</Link>
              <span>•</span>
              <Link href="/cgv" className="hover:text-orange-400 transition-colors">Conditions générales</Link>
              <span>•</span>
              <Link href="/conditions-utilisation" className="hover:text-orange-400 transition-colors">Conditions d'utilisation</Link>
              <span>•</span>
              <a href="mailto:ddvcontact35@gmail.com?subject=Exercice de mes droits RGPD" className="hover:text-orange-400 transition-colors font-medium">Exercer vos droits RGPD</a>
            </div>
          </div>
        </div>
      </section>

      </main>

      <footer className="bg-gradient-to-br from-black via-black to-black border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"><HardHat className="w-5 h-5 text-white" /></div><span className="text-xl font-bold">CHARLIE</span></div>
              <p className="text-gray-400 mb-4">Le secrétaire et bras droit des artisans du BTP.</p>
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-500" /><span>07 45 10 88 83</span></div>
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /><span>ddvcontact35@gmail.com</span></div>
              </div>
            </div>
            <div><h4 className="font-semibold mb-4">Liens</h4><ul className="space-y-2 text-sm text-gray-400"><li><a href="#comment-ca-marche" className="hover:text-white">Comment ça marche</a></li><li><a href="#calculateur" className="hover:text-white">Calculateur ROI</a></li><li><a href="#avantages" className="hover:text-white">Avantages</a></li><li><a href="#faq" className="hover:text-white">FAQ</a></li></ul></div>
            <div><h4 className="font-semibold mb-4">Légal</h4><ul className="space-y-2 text-sm text-gray-400"><li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li><li><Link href="/politique-confidentialite" className="hover:text-white">Politique de confidentialité</Link></li><li><Link href="/supprimer-donnees" className="hover:text-orange-400 text-orange-400 font-medium">Supprimer mes données</Link></li><li><Link href="/cgv" className="hover:text-white">CGV</Link></li><li><Link href="/conditions-utilisation" className="hover:text-white">Conditions d'utilisation</Link></li></ul></div>
            <div><h4 className="font-semibold mb-4">Contact</h4><ul className="space-y-2 text-sm text-gray-400"><li><a href="mailto:ddvcontact35@gmail.com" className="hover:text-white">Email</a></li><li><a href="tel:0745108883" className="hover:text-white">Téléphone</a></li><li><a href="https://wa.me/33745108883" className="hover:text-white">WhatsApp</a></li></ul></div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 mb-4">
              <p>© 2025 CHARLIE. Tous droits réservés.</p>
              <p className="mt-2 md:mt-0">Hébergé en France 🇫🇷 • Données sécurisées • Conforme RGPD</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 mt-4">
              <Link href="/politique-confidentialite" className="hover:text-orange-400 transition-colors">
                Gérer mes données personnelles
              </Link>
              <span>•</span>
              <Link href="/politique-confidentialite#suppression" className="hover:text-orange-400 transition-colors">
                Supprimer mes données
              </Link>
              <span>•</span>
              <Link href="/politique-confidentialite#acces" className="hover:text-orange-400 transition-colors">
                Accéder à mes données
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <DemoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} source={demoSource} />
    </div>
  )
}

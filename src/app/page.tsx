'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, MessageSquare, FileText, Clock, Bell, Sparkles, ChevronDown, ChevronUp, Users, ShieldCheck, Phone, Send, FileSignature, Smartphone, TrendingUp, Zap, Target, Heart, Calendar, Check, AlertCircle, Timer, DollarSign, Briefcase, Building2, HardHat, Calculator, RotateCcw, Euro } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-sm text-gray-300 italic">&quot;{example}&quot;</p>
        </div>
      </div>
    </div>
  </motion.div>
)

const BenefitCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay }} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 hover:border-orange-500/50 transition-all">
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
      <span className="text-orange-500 font-bold">{value}{unit || ''} {suffix || ''}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500" />
  </div>
)

export default function HomePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [tauxHoraire, setTauxHoraire] = useState(45)
  const [tempsMoyenDevis, setTempsMoyenDevis] = useState(45)
  const [devisParSemaine, setDevisParSemaine] = useState(5)
  const [autresTaches, setAutresTaches] = useState(3)
  const [devisPerdus, setDevisPerdus] = useState(2)
  const [panierMoyen, setPanierMoyen] = useState(900)
  const [gainCharlie, setGainCharlie] = useState(75)

  const tempsAdminSemaine = (devisParSemaine * tempsMoyenDevis / 60) + autresTaches
  const coutSemaine = Math.round(tempsAdminSemaine * tauxHoraire)
  const coutAn = coutSemaine * 48
  const devisPerdusParMois = devisPerdus * panierMoyen
  const tempsRecupere = Math.round(tempsAdminSemaine * gainCharlie / 100 * 10) / 10
  const economieSemaine = Math.round(tempsRecupere * tauxHoraire)
  const economieAn = economieSemaine * 48
  const devisRecuperes = Math.round(devisPerdus * panierMoyen * 0.5)
  const economieTotaleAn = economieAn + (devisRecuperes * 12)

  const resetCalculator = () => { setTauxHoraire(45); setTempsMoyenDevis(45); setDevisParSemaine(5); setAutresTaches(3); setDevisPerdus(2); setPanierMoyen(900); setGainCharlie(75) }

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
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"><HardHat className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold">CHARLIE</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#comment-ca-marche" className="text-gray-400 hover:text-white">Comment ça marche</a>
              <a href="#calculateur" className="text-gray-400 hover:text-white">Calculateur ROI</a>
              <a href="#avantages" className="text-gray-400 hover:text-white">Avantages</a>
              <a href="#faq" className="text-gray-400 hover:text-white">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Connexion</Button></Link>
              <Link href="/signup"><Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600">Essayer gratuitement</Button></Link>
            </div>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-600/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div className="space-y-6" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm border border-orange-500/30">
                <Phone className="w-4 h-4" /><span>WhatsApp + Logiciel de suivi</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">Le secrétaire <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">IA</span> des pros du bâtiment</h1>
              <p className="text-xl text-gray-300">Charlie gère tes clients, devis, factures et relances. Par WhatsApp et via ton logiciel de suivi.</p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/signup"><Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-gradient-to-r from-orange-500 to-orange-600">Demander une démo gratuite<ArrowRight className="ml-2 w-5 h-5" /></Button></Link>
                <a href="#comment-ca-marche"><Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg border-gray-700 text-gray-300">Comment ça marche ?</Button></a>
              </div>
              <div className="flex flex-wrap gap-6 pt-6">
                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><Timer className="w-5 h-5 text-orange-500" /></div><div><p className="text-lg font-bold">5 min</p><p className="text-xs text-gray-400">Devis créé</p></div></div>
                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><Bell className="w-5 h-5 text-orange-500" /></div><div><p className="text-lg font-bold">Auto</p><p className="text-xs text-gray-400">Relances</p></div></div>
                <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><Users className="w-5 h-5 text-orange-500" /></div><div><p className="text-lg font-bold">100%</p><p className="text-xs text-gray-400">Suivi client</p></div></div>
              </div>
            </motion.div>
            <motion.div className="relative" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div className="relative z-10 flex justify-center">
                <div className="relative">
                  <div className="w-80 h-96 rounded-3xl flex items-center justify-center overflow-hidden relative">
                    <NextImage src="/charlie-hero-v2.png" alt="Charlie - Assistant IA BTP" width={320} height={400} className="object-contain z-10" priority />
                  </div>
                  <motion.div className="absolute -right-16 top-4 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl z-20" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center"><Send className="w-4 h-4 text-orange-500" /></div><div><p className="text-xs font-medium">Devis envoyé</p><p className="text-xs text-gray-400">M. Dupont</p></div></div>
                  </motion.div>
                  <motion.div className="absolute -left-20 top-16 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl z-20" animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity }}>
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center"><Bell className="w-4 h-4 text-orange-500" /></div><div><p className="text-xs font-medium">Relance faite</p><p className="text-xs text-gray-400">Facture #1234</p></div></div>
                  </motion.div>
                  <motion.div className="absolute -right-20 bottom-24 bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl z-20" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                    <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-orange-500" /></div><div><p className="text-xs font-medium">Nouveau message</p><p className="text-xs text-gray-400">Via WhatsApp</p></div></div>
                  </motion.div>
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center max-w-3xl mx-auto mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6 border border-orange-500/30"><AlertCircle className="w-4 h-4" /><span>Le problème</span></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">L&apos;administratif, ça bouffe ton temps.</h2>
            <p className="text-xl text-gray-400">Tu es artisan, pas secrétaire. Pourtant tu passes des heures sur la paperasse.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[{ icon: Clock, text: "Tu perds du temps le soir et le week-end sur l'administratif" }, { icon: FileText, text: "Créer un devis prend 30 minutes (parfois plus)" }, { icon: DollarSign, text: "Tu oublies de relancer → paiements en retard" }, { icon: Users, text: "Difficile de suivre qui doit quoi" }].map((item, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex items-start gap-4 p-4 bg-gray-800/30 rounded-xl border border-gray-800">
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

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div className="relative order-2 lg:order-1" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="relative z-10 flex justify-center">
                <div className="w-72 h-80 rounded-3xl flex items-center justify-center overflow-hidden relative">
                  <NextImage src="/charlie-document-v2.png" alt="Charlie avec document" width={288} height={350} className="object-contain z-10" />
                </div>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl"></div>
            </motion.div>
            <motion.div className="space-y-6 order-1 lg:order-2" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 text-sm border border-orange-500/30"><Sparkles className="w-4 h-4" /><span>La solution</span></div>
              <h2 className="text-3xl sm:text-4xl font-bold">Voici Charlie. Ton assistant administratif.</h2>
              <p className="text-xl text-gray-400">Charlie gère tout l&apos;administratif pour toi. Par WhatsApp ou depuis ton logiciel de suivi.</p>
              <div className="space-y-4 pt-4">
                {["Comprend ta demande", "Vérifie les infos", "Crée les documents", "Envoie aux clients", "Relance automatiquement", "Fait signer électroniquement"].map((item, index) => (
                  <motion.div key={index} className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                    <span className="text-lg">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="calculateur" className="py-24 px-4 bg-gradient-to-b from-black via-gray-900/50 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent"></div>
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 text-sm mb-6 border border-orange-500/30">
              <Calculator className="w-5 h-5" />
              <span className="font-semibold">Simulateur de gains</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Combien te coûte <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">l&apos;administratif</span> ?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Déplace les curseurs pour voir <span className="text-white font-medium">en temps réel</span> combien tu perds... et combien tu pourrais économiser.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            <motion.div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 lg:p-8 border border-gray-700 shadow-2xl" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold">Ta situation</h3>
                </div>
                <button onClick={resetCalculator} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-700/50">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
              <div className="space-y-5">
                <SliderInput label="💰 Taux horaire" value={tauxHoraire} onChange={setTauxHoraire} min={20} max={100} step={5} unit="€" suffix="/h" />
                <SliderInput label="⏱️ Temps par devis" value={tempsMoyenDevis} onChange={setTempsMoyenDevis} min={15} max={120} step={5} unit=" min" />
                <SliderInput label="📄 Devis / semaine" value={devisParSemaine} onChange={setDevisParSemaine} min={1} max={20} step={1} suffix="devis" />
                <SliderInput label="📋 Autres tâches admin" value={autresTaches} onChange={setAutresTaches} min={0} max={15} step={1} unit="h" suffix="/sem" />
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-4">Opportunités manquées</p>
                  <SliderInput label="❌ Devis perdus" value={devisPerdus} onChange={setDevisPerdus} min={0} max={10} step={1} suffix="/mois" />
                  <div className="mt-4">
                    <SliderInput label="🛒 Panier moyen" value={panierMoyen} onChange={setPanierMoyen} min={200} max={5000} step={100} unit=" €" />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <SliderInput label="🎯 Gain avec Charlie" value={gainCharlie} onChange={setGainCharlie} min={50} max={90} step={5} unit="%" />
                  <p className="text-xs text-gray-500 mt-2">% du temps admin économisé</p>
                </div>
              </div>
            </motion.div>

            <motion.div className="bg-gradient-to-br from-gray-900/50 to-gray-800 rounded-3xl p-6 lg:p-8 border border-orange-500/30 shadow-2xl relative overflow-hidden" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-400">Sans Charlie</h3>
                    <p className="text-xs text-gray-500">Ce que tu perds aujourd&apos;hui</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="bg-gray-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-400 text-sm">Temps admin / semaine</p>
                    </div>
                    <p className="text-4xl font-bold text-white">{tempsAdminSemaine.toFixed(1)}<span className="text-xl text-gray-400">h</span></p>
                  </div>
                  <div className="bg-gray-800/50 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Euro className="w-5 h-5 text-gray-400" />
                      <p className="text-gray-400 text-sm">Coût hebdomadaire</p>
                    </div>
                    <p className="text-4xl font-bold text-white">{coutSemaine}<span className="text-xl text-gray-400">€</span></p>
                  </div>
                  <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-400 rotate-180" />
                      <p className="text-orange-300 text-sm font-medium">Perte annuelle</p>
                    </div>
                    <p className="text-4xl font-bold text-orange-400">{coutAn.toLocaleString()}<span className="text-xl">€</span></p>
                  </div>
                  <div className="bg-gray-800/30 rounded-2xl p-4 border border-dashed border-gray-700">
                    <p className="text-gray-500 text-sm mb-1">+ Devis non relancés / mois</p>
                    <p className="text-2xl font-bold text-orange-400/80">-{devisPerdusParMois.toLocaleString()}€</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div className="bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-orange-700/10 rounded-3xl p-6 lg:p-8 border border-orange-500/40 shadow-2xl relative overflow-hidden" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-600/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-orange-400">Avec Charlie</h3>
                    <p className="text-xs text-gray-400">Ce que tu gagnes</p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <p className="text-gray-300 text-sm">Temps récupéré / sem</p>
                    </div>
                    <p className="text-4xl font-bold text-orange-400">+{tempsRecupere}<span className="text-xl">h</span></p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Euro className="w-5 h-5 text-orange-400" />
                      <p className="text-gray-300 text-sm">Économie / semaine</p>
                    </div>
                    <p className="text-4xl font-bold text-orange-400">+{economieSemaine}<span className="text-xl">€</span></p>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-4 border border-orange-500/40">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-orange-400" />
                      <p className="text-orange-300 text-sm font-medium">Économie annuelle</p>
                    </div>
                    <p className="text-4xl font-bold text-orange-400">+{economieAn.toLocaleString()}<span className="text-xl">€</span></p>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-dashed border-orange-500/30">
                    <p className="text-gray-400 text-sm mb-1">+ Devis récupérés / mois</p>
                    <p className="text-2xl font-bold text-orange-400">+{devisRecuperes}€</p>
                    <p className="text-xs text-gray-500">(estimation prudente à 50%)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div className="mt-10 grid md:grid-cols-2 gap-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-2xl p-6 border border-orange-500/30 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Temps récupéré chaque mois</p>
                <p className="text-4xl font-bold text-white">{Math.round(tempsRecupere * 4)}<span className="text-xl text-gray-400">h</span></p>
                <p className="text-xs text-orange-400 mt-1">→ {Math.round(tempsRecupere * 4 / 8)} jours de travail en plus</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl p-6 border border-orange-500/40 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Euro className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Économie totale par an</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{economieTotaleAn.toLocaleString()}€</p>
                <p className="text-xs text-orange-400 mt-1">Temps + devis récupérés</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="mt-10 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-10 text-center border border-gray-700 relative overflow-hidden" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5"></div>
            <div className="relative">
              <p className="text-2xl md:text-3xl font-bold mb-2">
                &quot;Le vrai coût, c&apos;est de <span className="text-orange-400">continuer</span> comme avant.&quot;
              </p>
              <p className="text-gray-400 mb-6">Avec Charlie, tu récupères du temps ET de l&apos;argent.</p>
              <Link href="/signup" className="inline-block">
                <Button size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30">
                  Recevoir mon calcul personnalisé
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-xs text-gray-500 mt-4">Démo gratuite • Sans engagement • Réponse en 24h</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="comment-ca-marche" className="py-20 px-4 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6"><Zap className="w-4 h-4" /><span>Simple comme bonjour</span></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-xl text-gray-400">4 étapes, 5 minutes max. Zéro formation nécessaire.</p>
          </motion.div>
          <div className="space-y-12">
            <StepCard number="01" title="Tu parles à Charlie" description="Par WhatsApp ou via le logiciel, dis-lui ce dont tu as besoin." example="Fais un devis pour Mme Martin, cuisine complète 15m²" delay={0} />
            <StepCard number="02" title="Charlie vérifie tout" description="Il s'assure d'avoir les bonnes infos et te demande si besoin." example="Pose et fourniture ? Quel délai de livraison ?" delay={0.1} />
            <StepCard number="03" title="Tu valides en 1 clic" description="Charlie crée le document pro et te le montre." example="Aperçu du devis avec tous les détails" delay={0.2} />
            <StepCard number="04" title="Charlie envoie et relance" description="Il gère l'envoi par email/WhatsApp et les relances auto." example="Devis envoyé + relance J+3 programmée" delay={0.3} />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div className="space-y-6" initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/20 text-orange-400 text-sm border border-orange-500/30"><Calendar className="w-4 h-4" /><span>Notification quotidienne</span></div>
              <h2 className="text-3xl sm:text-4xl font-bold">Chaque matin, Charlie fait le point pour toi</h2>
              <p className="text-xl text-gray-400">Tout est configurable : fréquence, types d&apos;alertes, confirmation obligatoire ou action automatique.</p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full"><Clock className="w-4 h-4 text-orange-500" /><span className="text-sm">Fréquence personnalisable</span></div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full"><CheckCircle2 className="w-4 h-4 text-orange-500" /><span className="text-sm">Confirmation ou auto</span></div>
              </div>
            </motion.div>
            <motion.div className="flex justify-center" initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="w-72 bg-gray-900 rounded-3xl border border-gray-700 p-4 shadow-2xl">
                <div className="flex items-center justify-between mb-4 text-xs text-gray-400"><span>08:00</span><span>�� 100%</span></div>
                <div className="bg-gray-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center"><HardHat className="w-4 h-4 text-white" /></div><span className="font-medium">Charlie</span><span className="text-xs text-gray-400">08:00</span></div>
                  <div className="space-y-2 text-sm"><p>Bonjour 👋</p><p>Aujourd&apos;hui :</p><p className="text-orange-400">• 2 factures à relancer</p><p className="text-orange-400">• 1 devis en attente de signature</p><p className="mt-2">Tu veux que je m&apos;en occupe ?</p></div>
                  <div className="flex gap-2 mt-4"><button className="flex-1 py-2 bg-orange-500 rounded-lg text-sm font-medium">Oui, vas-y</button><button className="flex-1 py-2 bg-gray-700 rounded-lg text-sm">Plus tard</button></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-3xl p-8 md:p-12 border border-orange-500/20" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm"><FileSignature className="w-4 h-4" /><span>Signature électronique</span></div>
                <h2 className="text-3xl font-bold">Devis et factures signés électroniquement</h2>
                <p className="text-gray-400">Charlie peut envoyer tes devis à signer, suivre la signature, te prévenir, et archiver automatiquement.</p>
                <div className="grid grid-cols-2 gap-4">
                  {[{ icon: Send, text: "Envoi automatique" }, { icon: Target, text: "Suivi en temps réel" }, { icon: ShieldCheck, text: "Légalement valide" }, { icon: Briefcase, text: "Archivage sécurisé" }].map((item, index) => (
                    <div key={index} className="flex items-center gap-2"><item.icon className="w-5 h-5 text-orange-500" /><span className="text-sm">{item.text}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-80 bg-white rounded-xl shadow-2xl p-6 text-gray-900">
                  <div className="text-center mb-4"><p className="text-xs text-gray-500">DEVIS N°2024-0042</p><p className="font-bold">Rénovation cuisine</p></div>
                  <div className="space-y-2 text-xs"><div className="flex justify-between"><span>Main d&apos;œuvre</span><span>2 400 €</span></div><div className="flex justify-between"><span>Fournitures</span><span>3 200 €</span></div><div className="border-t pt-2 flex justify-between font-bold"><span>Total TTC</span><span>5 600 €</span></div></div>
                  <div className="mt-6 pt-4 border-t"><p className="text-xs text-gray-500 mb-2">Signature client</p><div className="h-16 border-2 border-dashed border-orange-300 rounded-lg flex items-center justify-center bg-orange-50"><span className="text-orange-500 text-xl italic">M. Martin</span></div><div className="flex items-center gap-1 mt-2 text-xs text-green-600"><CheckCircle2 className="w-3 h-3" /><span>Signé le 15/01/2025</span></div></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="avantages" className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm mb-6"><TrendingUp className="w-4 h-4" /><span>Les avantages</span></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ce que tu gagnes avec Charlie</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BenefitCard icon={Clock} title="Gagne 10h par semaine" description="Plus de temps pour tes chantiers et ta vie perso." delay={0} />
            <BenefitCard icon={DollarSign} title="Moins d'impayés" description="Relances automatiques = plus de paiements à temps." delay={0.1} />
            <BenefitCard icon={Building2} title="Image plus pro" description="Devis soignés + signature électronique = sérieux." delay={0.2} />
            <BenefitCard icon={Smartphone} title="Tout depuis le téléphone" description="Entre deux chantiers, dans le camion, partout." delay={0.3} />
            <BenefitCard icon={Users} title="Suivi client complet" description="Historique, documents, paiements : tout est centralisé." delay={0.4} />
            <BenefitCard icon={Heart} title="Moins de stress" description="La charge mentale, c'est Charlie qui la prend." delay={0.5} />
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-4 bg-black">
        <div className="max-w-3xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Questions fréquentes</h2>
          </motion.div>
          <div className="space-y-0">{faqs.map((faq, index) => (<FAQItem key={index} question={faq.question} answer={faq.answer} isOpen={openFAQ === index} onClick={() => setOpenFAQ(openFAQ === index ? null : index)} />))}</div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-orange-500/20 via-black to-orange-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm"><Sparkles className="w-4 h-4" /><span>Libère-toi de l&apos;administratif</span></div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Et si tu n&apos;avais plus jamais à gérer l&apos;administratif ?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Rejoins les artisans qui ont choisi de se concentrer sur ce qu&apos;ils font de mieux : leur métier.</p>
            <div className="pt-6"><Link href="/signup"><Button size="lg" className="h-16 px-10 text-lg bg-gradient-to-r from-orange-500 to-orange-600">Demander une démo gratuite<ArrowRight className="ml-2 w-5 h-5" /></Button></Link><p className="text-sm text-gray-400 mt-4">Démo gratuite • Sans engagement • Réponse en 24h</p></div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center"><HardHat className="w-5 h-5 text-white" /></div><span className="text-xl font-bold">CHARLIE</span></div>
              <p className="text-gray-400 mb-4">Le secrétaire et bras droit des artisans du BTP.</p>
              <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-4 h-4 text-green-500" /><span>Disponible sur WhatsApp</span></div>
            </div>
            <div><h4 className="font-semibold mb-4">Liens</h4><ul className="space-y-2 text-sm text-gray-400"><li><a href="#comment-ca-marche" className="hover:text-white">Comment ça marche</a></li><li><a href="#calculateur" className="hover:text-white">Calculateur ROI</a></li><li><a href="#avantages" className="hover:text-white">Avantages</a></li><li><a href="#faq" className="hover:text-white">FAQ</a></li></ul></div>
            <div><h4 className="font-semibold mb-4">Légal</h4><ul className="space-y-2 text-sm text-gray-400"><li><a href="#" className="hover:text-white">Mentions légales</a></li><li><a href="#" className="hover:text-white">Politique de confidentialité</a></li><li><a href="#" className="hover:text-white">CGV</a></li></ul></div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"><p>© 2025 CHARLIE. Tous droits réservés.</p><p className="mt-2 md:mt-0">Hébergé en France 🇫🇷 • Données sécurisées • Conforme RGPD</p></div>
        </div>
      </footer>
    </div>
  )
}

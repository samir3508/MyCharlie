import Link from 'next/link'
import { ArrowLeft, Mail, Shield, Database, Eye, Trash2, Phone, MessageSquare, Download, FileText, Smartphone } from 'lucide-react'

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-orange-400 hover:text-orange-300 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
          Politique de confidentialité
        </h1>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
            <p>
              MyCharlie s'engage à protéger la vie privée de ses utilisateurs et à respecter la réglementation 
              relative à la protection des données personnelles, notamment le RGPD. Cette politique décrit 
              comment nous collectons, utilisons et protégeons vos données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Données collectées</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  Données du compte utilisateur (artisan)
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-6">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone (y compris numéro WhatsApp personnel)</li>
                  <li>Nom de l'entreprise</li>
                  <li>Adresse postale</li>
                  <li>Informations de connexion (email, mot de passe chiffré)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  Données clients et dossiers
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-6">
                  <li>Informations sur vos clients (nom, email, téléphone, adresse)</li>
                  <li>Dossiers de chantier et projets</li>
                  <li>Devis et factures</li>
                  <li>Rendez-vous et visites</li>
                  <li>Historique des communications</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-400" />
                  Données de communication WhatsApp
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-6">
                  <li>Messages échangés avec les agents IA (Charlie et Léo) via WhatsApp</li>
                  <li>Numéro de téléphone WhatsApp personnel (enregistré pour identifier votre compte)</li>
                  <li>Historique des conversations avec les agents IA</li>
                  <li>Métadonnées des messages (horodatage, statut d'envoi)</li>
                </ul>
                <div className="mt-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-sm text-orange-200">
                    <strong>⚠️ Important :</strong> Les messages WhatsApp sont traités par nos agents IA (Charlie et Léo) 
                    pour fournir le service. Votre numéro WhatsApp personnel est utilisé uniquement pour identifier votre compte 
                    et router les messages vers le bon agent IA.
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
                  <Database className="w-5 h-5 text-orange-400" />
                  Données techniques
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-6">
                  <li>Adresse IP</li>
                  <li>Type de navigateur et système d'exploitation</li>
                  <li>Pages visitées et durée de consultation</li>
                  <li>Cookies techniques nécessaires au fonctionnement</li>
                  <li>Logs d'accès et d'utilisation</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Finalités du traitement</h2>
            <div className="space-y-3">
              <p>Vos données sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li>Fournir les services de gestion (clients, devis, factures, rendez-vous)</li>
                <li>Permettre la communication avec les agents IA (Charlie et Léo) via WhatsApp</li>
                <li>Identifier votre compte lors des communications WhatsApp</li>
                <li>Améliorer nos services et l'expérience utilisateur</li>
                <li>Assurer la sécurité et la maintenance technique de l'application</li>
                <li>Respecter nos obligations légales et réglementaires (facturation, comptabilité)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-orange-400" />
              Accès WhatsApp et Agents IA
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-orange-400" />
                  Accès via WhatsApp
                </h3>
                <p className="mb-3">
                  MyCharlie utilise un <strong>numéro WhatsApp partagé</strong> 
                  pour permettre à tous les artisans d'accéder aux agents IA Charlie et Léo.
                </p>
                <div className="space-y-2 ml-4">
                  <p className="text-sm"><strong>Comment ça fonctionne :</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Vous envoyez un message WhatsApp au numéro fourni lors de votre inscription</li>
                    <li>Le système identifie votre compte via votre numéro WhatsApp personnel</li>
                    <li>Votre message est routé vers l'agent IA approprié (Charlie ou Léo)</li>
                    <li>L'agent IA répond via le numéro partagé</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  Protection de votre numéro WhatsApp personnel
                </h3>
                <p className="mb-2">
                  Votre <strong>numéro WhatsApp personnel</strong> est enregistré dans notre base de données pour :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Identifier votre compte lors des communications WhatsApp</li>
                  <li>Router vos messages vers le bon agent IA</li>
                  <li>Assurer la sécurité et l'isolation des données entre les différents artisans</li>
                </ul>
                <p className="mt-3 text-sm text-blue-200">
                  <strong>Votre numéro WhatsApp personnel n'est jamais partagé avec d'autres utilisateurs.</strong> 
                  Chaque artisan accède à ses propres données via le numéro partagé, mais le système identifie 
                  automatiquement quel artisan a envoyé le message.
                </p>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  Agents IA (Charlie et Léo)
                </h3>
                <p className="mb-2">
                  Les agents IA <strong>Charlie</strong> (gestion commerciale) et <strong>Léo</strong> (gestion planning) 
                  accèdent à vos données pour :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Répondre à vos demandes (création de devis, factures, rendez-vous, etc.)</li>
                  <li>Accéder à vos données clients, dossiers, devis et factures</li>
                  <li>Traiter vos messages WhatsApp pour exécuter les actions demandées</li>
                  <li>Maintenir un historique des conversations pour améliorer le service</li>
                </ul>
                <p className="mt-3 text-sm text-purple-200">
                  Les agents IA n'accèdent qu'aux données de votre compte (tenant). 
                  Ils ne peuvent pas accéder aux données d'autres artisans.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Base légale</h2>
            <p>
              Le traitement de vos données est fondé sur :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li><strong>Votre consentement</strong> pour les données du formulaire de contact</li>
              <li><strong>Notre intérêt légitime</strong> pour les données techniques et l'amélioration du service</li>
              <li><strong>Obligations légales</strong> pour la conservation de certaines données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Durée de conservation</h2>
            <div className="space-y-3">
              <p>Vos données sont conservées pendant une durée n'excédant pas nécessairement au regard des finalités pour lesquelles elles sont traitées :</p>
              <ul className="list-disc list-inside space-y-1 ml-6">
                <li><strong>Données de compte utilisateur</strong> : Pendant toute la durée d'utilisation du service, puis 3 ans après la fermeture du compte</li>
                <li><strong>Données clients</strong> : Pendant toute la durée d'utilisation du service, puis 3 ans après la dernière interaction</li>
                <li><strong>Devis et factures</strong> : 10 ans (obligation légale comptable française)</li>
                <li><strong>Conversations avec les agents IA</strong> : 1 an après la dernière conversation, puis anonymisation</li>
                <li><strong>Données WhatsApp</strong> : 1 an après la dernière utilisation, puis suppression</li>
                <li><strong>Données techniques</strong> : 13 mois maximum</li>
                <li><strong>Cookies</strong> : durée de session ou 13 mois maximum</li>
              </ul>
              <p className="mt-2">
                À l'issue de ces durées, vos données sont supprimées ou anonymisées. 
                Certaines données peuvent être conservées plus longtemps si la loi l'exige (factures, obligations comptables).
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Destinataires des données</h2>
            <p>
              Vos données sont accessibles uniquement aux personnes habilitées de MyCharlie et à nos sous-traitants 
              strictement nécessaires à la fourniture du service :
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li><strong>Prestataire d'hébergement</strong> (Render) - serveurs situés en France</li>
              <li><strong>Base de données</strong> (Supabase) - serveurs situés en Europe</li>
              <li><strong>Prestataire d'envoi d'emails</strong> (Resend) - serveurs situés en Europe</li>
              <li><strong>Prestataire de messagerie WhatsApp</strong> (Twilio) - pour l'envoi/réception de messages WhatsApp</li>
              <li><strong>Prestataire d'automatisation</strong> (n8n) - pour le traitement des messages et l'exécution des agents IA</li>
              <li><strong>Agents IA</strong> (Charlie et Léo) - via la plateforme n8n, pour traiter vos demandes</li>
            </ul>
            <p className="mt-2">
              Nous nous assurons que nos sous-traitants respectent un niveau de sécurité équivalent à celui de MyCharlie 
              et sont conformes au RGPD. Les agents IA n'accèdent qu'aux données nécessaires à l'exécution de vos demandes 
              et uniquement aux données de votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Sécurité des données</h2>
            <p className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              MyCharlie met en œuvre des mesures techniques et organisationnelles appropriées pour protéger 
              vos données contre la perte, l'accès non autorisé, la modification ou la divulgation.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
              <li>Chiffrement des données (HTTPS/TLS)</li>
              <li>Contrôle d'accès strict aux données</li>
              <li>Sauvegardes régulières et sécurisées</li>
              <li>Formation du personnel à la protection des données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Vos droits RGPD</h2>
            <div className="space-y-4">
              <p>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Droit d'accès</strong> : savoir si nous traitons vos données et, le cas échéant, 
                    en obtenir une copie complète.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit de rectification</strong> : demander la correction de données inexactes ou incomplètes.
                </li>
                <li className="flex items-start gap-2">
                  <Trash2 className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Droit à l'effacement (droit à l'oubli)</strong> : demander la suppression de vos données 
                    lorsque la conservation n'est plus nécessaire ou lorsque vous retirez votre consentement.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit à la limitation du traitement</strong> : limiter l'utilisation de vos données dans certains cas.
                </li>
                <li className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré et couramment utilisé 
                    (JSON, CSV) pour les transférer à un autre service.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <strong>Droit d'opposition</strong> : vous opposer au traitement de vos données pour des motifs légitimes.
                </li>
              </ul>
              
              <div id="suppression" className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mt-4 scroll-mt-20">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-orange-400" />
                  Comment supprimer vos données
                </h3>
                <p className="mb-3">
                  Pour demander la suppression de vos données personnelles, vous pouvez :
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Via le formulaire en ligne (recommandé)</strong> : Utilisez notre 
                    <Link href="/supprimer-donnees" className="text-orange-400 hover:text-orange-300 ml-1 font-medium">
                      formulaire de suppression de données
                    </Link> pour faire votre demande de manière simple et sécurisée.
                  </li>
                  <li>
                    <strong>Via email</strong> : Envoyez un email à 
                    <a href="mailto:ddvcontact35@gmail.com?subject=Demande de suppression de données" className="text-orange-400 hover:text-orange-300 ml-1">ddvcontact35@gmail.com</a> 
                    avec le sujet "Demande de suppression de données" en précisant :
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Votre nom et prénom</li>
                      <li>Votre adresse email utilisée pour votre compte</li>
                      <li>Votre numéro de téléphone (si vous souhaitez aussi supprimer les données WhatsApp)</li>
                      <li>La confirmation que vous souhaitez supprimer toutes vos données</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Délai de traitement</strong> : Nous traiterons votre demande dans un délai maximum de 30 jours 
                    à compter de la réception de votre demande.
                  </li>
                  <li>
                    <strong>Données conservées</strong> : Certaines données peuvent être conservées plus longtemps 
                    si la loi l'exige (par exemple, factures pour obligations comptables - 10 ans).
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-orange-500/20 rounded-lg border border-orange-500/40">
                  <p className="text-sm text-orange-200">
                    <strong>Lien direct pour Facebook/Meta :</strong>{' '}
                    <Link href="/supprimer-donnees" className="underline font-medium">
                      https://mycharlie.fr/supprimer-donnees
                    </Link>
                  </p>
                </div>
              </div>

              <div id="acces" className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4 scroll-mt-20">
                <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Comment accéder à vos données
                </h3>
                <p className="mb-3">
                  Pour obtenir une copie de toutes vos données personnelles :
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>
                    <strong>Via email</strong> : Envoyez un email à 
                    <a href="mailto:ddvcontact35@gmail.com?subject=Demande d'accès aux données" className="text-blue-400 hover:text-blue-300 ml-1">ddvcontact35@gmail.com</a> 
                    avec le sujet "Demande d'accès aux données" en précisant :
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Votre nom et prénom</li>
                      <li>Votre adresse email utilisée pour votre compte</li>
                      <li>Le format souhaité pour la copie (JSON, CSV, PDF)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Contenu de la copie</strong> : Vous recevrez un fichier contenant :
                    <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                      <li>Toutes vos données de compte (profil, paramètres)</li>
                      <li>Tous vos clients et leurs informations</li>
                      <li>Tous vos devis et factures</li>
                      <li>Tous vos dossiers et projets</li>
                      <li>L'historique de vos conversations avec les agents IA (si disponible)</li>
                      <li>Vos données WhatsApp (numéro, historique des messages)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Délai de traitement</strong> : Nous vous enverrons votre copie dans un délai maximum de 30 jours.
                  </li>
                </ol>
              </div>

              <p className="mt-4">
                Pour exercer l'un de ces droits, contactez-nous à : 
                <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300 ml-1">ddvcontact35@gmail.com</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Cookies</h2>
            <p>
              Ce site utilise uniquement des cookies techniques nécessaires à son bon fonctionnement. 
              Aucun cookie de tracking ou de publicité n'est utilisé sans votre consentement explicite.
            </p>
            <p className="mt-2">
              Vous pouvez désactiver les cookies dans les paramètres de votre navigateur. 
              Cela peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Modifications de la politique</h2>
            <p>
              MyCharlie se réserve le droit de modifier cette politique de confidentialité à tout moment. 
              Les modifications entreront en vigueur dès leur publication sur ce site. 
              Nous vous invitons à consulter régulièrement cette page pour prendre connaissance des éventuelles mises à jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou l'exercice de vos droits, 
              vous pouvez nous contacter :
            </p>
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> 
                <a href="mailto:ddvcontact35@gmail.com" className="text-orange-400 hover:text-orange-300">ddvcontact35@gmail.com</a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> 
                07 45 10 88 83
              </p>
            </div>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500">
          <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
    </div>
  )
}

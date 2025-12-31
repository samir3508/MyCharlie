import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Charlie - Votre Secrétaire IA Spécialisé BTP | Gestion Devis Factures Relances',
  description: 'Charlie est l\'assistant IA révolutionnaire pour les professionnels du BTP. Gérez vos clients, devis, factures et relances automatiquement. Accédez par WhatsApp, email et application web. Essai gratuit.',
  keywords: [
    'assistant IA BTP',
    'secrétaire virtuel BTP',
    'gestion devis BTP',
    'facturation automatique BTP',
    'relances automatiques BTP',
    'logiciel artisan BTP',
    'gestion client BTP',
    'Charlie assistant IA',
    'intelligence artificielle BTP',
    'automatisation administrative BTP',
    'logiciel gestion chantier',
    'devis en ligne BTP',
    'facturation professionnelle BTP'
  ],
  authors: [{ name: 'Charlie BTP' }],
  creator: 'Charlie BTP',
  publisher: 'Charlie BTP',
  metadataBase: new URL('https://charlie-btp.fr'),
  alternates: {
    canonical: new URL('https://charlie-btp.fr'),
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://charlie-btp.fr',
    title: 'Charlie - Votre Secrétaire IA Spécialisé BTP',
    description: 'Charlie est l\'assistant IA révolutionnaire pour les professionnels du BTP. Gérez vos clients, devis, factures et relances automatiquement.',
    siteName: 'Charlie BTP',
    images: [
      {
        url: 'https://charlie-btp.fr/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Charlie - Assistant IA BTP'
      }
    ]
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: {
      other: {
        name: 'google-site-verification',
        content: 'your-google-verification-code'
      }
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

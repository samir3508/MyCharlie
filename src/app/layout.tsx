import type { Metadata } from 'next'
import { DM_Sans, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/lib/providers'
import { SupportPopup } from '@/components/support-popup'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'MY CHARLIE - Gestion BTP simplifiée',
  description: 'Plateforme SaaS pour artisans BTP : devis, factures, relances automatiques avec assistant IA',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${spaceGrotesk.variable} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <SupportPopup />
      </body>
    </html>
  )
}

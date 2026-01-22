'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FicheVisiteNotFound() {
  const router = useRouter()
  
  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="border-border">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Fiche de visite introuvable</h2>
          <p className="text-muted-foreground mb-4">
            La fiche de visite que vous recherchez n'existe pas ou n'est plus disponible.
          </p>
          <Button variant="outline" onClick={() => router.push('/fiches-visite')} asChild>
            <Link href="/fiches-visite">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux fiches
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

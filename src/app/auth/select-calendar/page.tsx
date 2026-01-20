'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GoogleCalendar {
  id: string
  summary: string
  description?: string
  accessRole: string
  primary?: boolean
}

function SelectCalendarContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const connectionId = searchParams.get('connection_id')
  const tenantId = searchParams.get('tenant_id')

  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!connectionId || !tenantId) {
      toast.error('Paramètres manquants')
      router.push('/settings/integrations?error=missing_params')
      return
    }

    // Récupérer la liste des calendriers
    fetch(`/api/calendar/list?connection_id=${connectionId}&tenant_id=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.calendars) {
          setCalendars(data.calendars)
          // Sélectionner le calendrier principal par défaut
          const primary = data.calendars.find((cal: GoogleCalendar) => cal.primary)
          if (primary) {
            setSelectedCalendarId(primary.id)
          } else if (data.calendars.length > 0) {
            setSelectedCalendarId(data.calendars[0].id)
          }
        } else {
          toast.error(data.message || 'Erreur lors de la récupération des calendriers')
        }
        setIsLoading(false)
      })
      .catch(error => {
        console.error('Erreur:', error)
        toast.error('Erreur lors de la récupération des calendriers')
        setIsLoading(false)
      })
  }, [connectionId, tenantId, router])

  const handleSave = async () => {
    if (!selectedCalendarId || !connectionId || !tenantId) {
      toast.error('Veuillez sélectionner un calendrier')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/calendar/save-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          tenant_id: tenantId,
          calendar_id: selectedCalendarId,
          calendar_name: calendars.find(cal => cal.id === selectedCalendarId)?.summary || ''
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Calendrier sélectionné avec succès !')
        router.push('/settings/integrations?success=calendar_selected')
      } else {
        toast.error(data.message || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Chargement des calendriers...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sélectionner votre calendrier Google
          </CardTitle>
          <CardDescription>
            Choisissez le calendrier que vous souhaitez utiliser pour synchroniser vos rendez-vous.
            Vous pouvez avoir plusieurs calendriers associés à votre compte Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calendars.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun calendrier trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {calendars.map((calendar) => (
                <button
                  key={calendar.id}
                  onClick={() => setSelectedCalendarId(calendar.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCalendarId === calendar.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{calendar.summary}</h3>
                        {calendar.primary && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                        {calendar.accessRole === 'owner' && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Propriétaire
                          </span>
                        )}
                      </div>
                      {calendar.description && (
                        <p className="text-sm text-muted-foreground mt-1">{calendar.description}</p>
                      )}
                    </div>
                    {selectedCalendarId === calendar.id && (
                      <Check className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!selectedCalendarId || isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer et continuer'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/settings/integrations')}
              disabled={isSaving}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SelectCalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Chargement...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <SelectCalendarContent />
    </Suspense>
  )
}

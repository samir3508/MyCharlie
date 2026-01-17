'use client'

import { useAuth } from '@/lib/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const { user, tenant, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [testDevis, setTestDevis] = useState<any>(null)
  const [testError, setTestError] = useState<string | null>(null)
  
  const supabase = getSupabaseClient()

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSessionInfo(data.session)
    }
    getSession()
  }, [supabase])

  const testDevisAccess = async () => {
    setTestError(null)
    setTestDevis(null)
    
    try {
      console.log('🔍 Test d\'accès aux devis...')
      const { data, error } = await supabase
        .from('devis')
        .select('id, numero, statut, tenant_id')
        .limit(3)
      
      if (error) {
        console.error('❌ Erreur:', error)
        setTestError(error.message)
      } else {
        console.log('✅ Devis récupérés:', data)
        setTestDevis(data)
      }
    } catch (err: any) {
      console.error('❌ Exception:', err)
      setTestError(err.message)
    }
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Diagnostic de connexion</h1>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {user ? (
            <>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Connecté:</strong> <Badge variant="default">Oui</Badge></p>
            </>
          ) : (
            <p><strong>Connecté:</strong> <Badge variant="destructive">Non</Badge></p>
          )}
        </CardContent>
      </Card>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle>Session Supabase</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionInfo ? (
            <div className="space-y-2">
              <p><strong>Access Token:</strong> {sessionInfo.access_token ? '✅ Présent' : '❌ Absent'}</p>
              <p><strong>User ID:</strong> {sessionInfo.user?.id}</p>
              <p><strong>Expires At:</strong> {new Date(sessionInfo.expires_at * 1000).toLocaleString()}</p>
            </div>
          ) : (
            <p>Aucune session active</p>
          )}
        </CardContent>
      </Card>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle>Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          {tenant ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {tenant.id}</p>
              <p><strong>Nom:</strong> {tenant.company_name}</p>
              <p><strong>User ID:</strong> {tenant.user_id}</p>
            </div>
          ) : (
            <p>Aucun tenant trouvé</p>
          )}
        </CardContent>
      </Card>

      {/* Test Devis Access */}
      <Card>
        <CardHeader>
          <CardTitle>Test d'accès aux devis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testDevisAccess}>
            Tester l'accès aux devis
          </Button>
          
          {testError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 font-semibold">Erreur:</p>
              <p className="text-sm">{testError}</p>
            </div>
          )}
          
          {testDevis && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-600 font-semibold mb-2">Devis trouvés: {testDevis.length}</p>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testDevis, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!user && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600">❌ Utilisateur non connecté</p>
              <p className="text-sm">Vous devez vous connecter pour accéder aux données.</p>
            </div>
          )}
          
          {user && !tenant && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-600">⚠️ Tenant non trouvé</p>
              <p className="text-sm">Le tenant avec user_id = {user.id} n'existe pas.</p>
            </div>
          )}
          
          {user && tenant && (
            <div className="p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-600">✅ Tout est OK</p>
              <p className="text-sm">Utilisateur connecté et tenant trouvé.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowRight, Eye } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Devis } from '@/types/database'

interface RecentDevisTableProps {
  devis: (Devis & { client_name?: string })[]
}

export function RecentDevisTable({ devis }: RecentDevisTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle style={{ fontFamily: 'var(--font-display)' }}>
            Derniers devis
          </CardTitle>
          <CardDescription>
            Vos devis récents et leur statut
          </CardDescription>
        </div>
        <Link href="/devis">
          <Button variant="outline" size="sm">
            Voir tout
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Numéro</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devis.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun devis pour le moment
                </TableCell>
              </TableRow>
            ) : (
              devis.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.numero}</TableCell>
                  <TableCell>{d.client_name || 'Client inconnu'}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(d.montant_ttc)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.date_creation ? formatDate(d.date_creation) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(d.statut || 'brouillon')}>
                      {getStatusLabel(d.statut || 'brouillon')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/devis/${d.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}























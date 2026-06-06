import { useEffect, useState } from 'react'
import { CalendarRange, Vote } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'
import api from '@/services/api'

export default function PortalAssemblies() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!condoId) return
    api.get(`/assemblies/condominium/${condoId}`).then(r => setItems(r.data || [])).finally(() => setLoading(false))
  }, [condoId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Asambleas</h1>
        <p className="text-ink-500 mt-1">Convocatorias, asistencia y votaciones.</p>
      </div>

      {loading ? <Skeleton className="h-40" /> : items.length === 0 ? (
        <Card><p className="text-sm text-ink-500">Sin asambleas programadas por ahora.</p></Card>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <Card key={a.id} interactive tone="blue">
              <CardHeader>
                <div>
                  <CardTitle>{a.title}</CardTitle>
                  <CardDescription>{formatDateTime(a.scheduled_date)}</CardDescription>
                </div>
                <CalendarRange className="h-5 w-5 text-brand-blue" />
              </CardHeader>
              <div className="flex items-center justify-between text-sm">
                <Badge tone={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'warning' : 'info'} dot>
                  {a.status}
                </Badge>
                <span className="text-ink-700">
                  Quórum {a.current_quorum?.toFixed(1)}% / {a.required_quorum}%
                </span>
              </div>
              {a.status === 'in_progress' && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm">
                  <Vote className="h-4 w-4 text-brand-green" />
                  <span className="text-ink-700">Asamblea en curso — confirma tu asistencia y vota desde aquí.</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

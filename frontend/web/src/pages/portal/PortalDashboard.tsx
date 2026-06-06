import { useEffect, useState } from 'react'
import { CalendarRange, Wallet, MessagesSquare } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/services/api'

export default function PortalDashboard() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const propertyIds = user?.condominiums?.[0]?.property_ids || []
  const [billings, setBillings] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [assemblies, setAssemblies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!condoId) {
      setLoading(false)
      return
    }
    Promise.allSettled([
      api.get(`/billing/condominium/${condoId}`),
      api.get(`/forum/condominium/${condoId}/posts`),
      api.get(`/assemblies/condominium/${condoId}`),
    ]).then(([b, p, a]) => {
      if (b.status === 'fulfilled') {
        const own = (b.value.data || []).filter((x: any) =>
          propertyIds.length === 0 ? true : propertyIds.includes(x.property_id),
        )
        setBillings(own)
      }
      if (p.status === 'fulfilled') setPosts((p.value.data || []).slice(0, 4))
      if (a.status === 'fulfilled') setAssemblies((a.value.data || []).slice(0, 3))
      setLoading(false)
    })
  }, [condoId])

  const pendingTotal = billings
    .filter(b => b.status === 'pending' || b.status === 'partial' || b.status === 'overdue')
    .reduce((acc, b) => acc + (b.balance || 0), 0)
  const hasOverdue = billings.some(b => b.status === 'overdue')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          Hola{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-ink-500 mt-1">Esto es lo más importante hoy en tu comunidad.</p>
      </div>

      <Card tone={hasOverdue ? 'red' : pendingTotal > 0 ? 'blue' : 'green'} interactive>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-white p-2.5">
              <Wallet className={`h-6 w-6 ${hasOverdue ? 'text-brand-red' : pendingTotal > 0 ? 'text-brand-blue' : 'text-brand-green'}`} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-600">
                {hasOverdue ? 'Tienes pagos vencidos' : pendingTotal > 0 ? 'Pagos pendientes' : 'Estás al día'}
              </p>
              <p className="text-2xl font-bold text-ink-900 mt-1">{formatCurrency(pendingTotal)}</p>
            </div>
          </div>
        </CardHeader>
        {loading ? (
          <Skeleton className="h-12" />
        ) : billings.length > 0 ? (
          <ul className="space-y-2">
            {billings.slice(0, 3).map(b => (
              <li key={b.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-ink-900">{b.document_number}</p>
                  <p className="text-xs text-ink-500">Vence {formatDate(b.due_date)}</p>
                </div>
                <Badge
                  tone={b.status === 'paid' ? 'success' : b.status === 'overdue' ? 'danger' : b.status === 'partial' ? 'warning' : 'info'}
                  dot
                >
                  {b.status}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-700">Sin cuentas de cobro asociadas a tu unidad.</p>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card tone="yellow">
          <CardHeader>
            <div>
              <CardTitle>Anuncios y eventos</CardTitle>
              <CardDescription>Lo último de tu comunidad</CardDescription>
            </div>
            <MessagesSquare className="h-5 w-5 text-[#8a6300]" />
          </CardHeader>
          {loading ? <Skeleton className="h-24" /> : posts.length === 0 ? (
            <p className="text-sm text-ink-700">Aún no hay publicaciones.</p>
          ) : (
            <ul className="space-y-2">
              {posts.map(p => (
                <li key={p.id} className="rounded-xl bg-white px-3 py-2">
                  <p className="text-sm font-medium text-ink-900">{p.title}</p>
                  <p className="text-xs text-ink-500 line-clamp-1">{p.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card tone="blue">
          <CardHeader>
            <div>
              <CardTitle>Próximas asambleas</CardTitle>
              <CardDescription>No olvides tu participación</CardDescription>
            </div>
            <CalendarRange className="h-5 w-5 text-brand-blue" />
          </CardHeader>
          {loading ? <Skeleton className="h-24" /> : assemblies.length === 0 ? (
            <p className="text-sm text-ink-700">No hay asambleas programadas.</p>
          ) : (
            <ul className="space-y-2">
              {assemblies.map(a => (
                <li key={a.id} className="rounded-xl bg-white px-3 py-2 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{a.title}</p>
                    <p className="text-xs text-ink-500">{formatDate(a.scheduled_date)}</p>
                  </div>
                  <Badge tone="info" dot>{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

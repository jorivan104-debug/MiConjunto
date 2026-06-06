import { useEffect, useState } from 'react'
import {
  Users,
  Wrench,
  Boxes,
  CalendarRange,
  MessagesSquare,
  Receipt,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import api from '@/services/api'

interface KpiCard {
  title: string
  value: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'green' | 'blue' | 'red' | 'yellow' | 'default'
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [billings, setBillings] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])

  const condoId = user?.condominiums?.[0]?.id

  useEffect(() => {
    if (!condoId) {
      setLoading(false)
      return
    }
    Promise.allSettled([
      api.get(`/billing/condominium/${condoId}`),
      api.get(`/inventory/condominium/${condoId}/low-stock`),
      api.get(`/maintenance/condominium/${condoId}/work-orders`),
    ])
      .then(([b, l, w]) => {
        if (b.status === 'fulfilled') setBillings(b.value.data || [])
        if (l.status === 'fulfilled') setLowStock(l.value.data || [])
        if (w.status === 'fulfilled') setWorkOrders(w.value.data || [])
      })
      .finally(() => setLoading(false))
  }, [condoId])

  const overdue = billings.filter(b => b.status === 'overdue')
  const pending = billings.filter(b => b.status === 'pending' || b.status === 'partial')
  const totalCollected = billings.reduce((acc, b) => acc + (b.paid_amount || 0), 0)
  const openWO = workOrders.filter(w => w.status !== 'completed' && w.status !== 'cancelled').length

  const kpis: KpiCard[] = [
    {
      title: 'Recaudo del mes',
      value: formatCurrency(totalCollected),
      helper: `${billings.length} cuentas emitidas`,
      icon: TrendingUp,
      tone: 'green',
    },
    {
      title: 'Cartera pendiente',
      value: formatCurrency(pending.reduce((a, b) => a + (b.balance || 0), 0)),
      helper: `${pending.length} cuentas pendientes`,
      icon: Receipt,
      tone: 'blue',
    },
    {
      title: 'En mora',
      value: String(overdue.length),
      helper: 'Requiere seguimiento',
      icon: AlertTriangle,
      tone: 'red',
    },
    {
      title: 'OT abiertas',
      value: String(openWO),
      helper: 'Mantenimiento en curso',
      icon: Wrench,
      tone: 'yellow',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">
          Hola{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-ink-500 mt-1">Esto es lo que pasa en tu comunidad hoy.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} interactive tone={kpi.tone === 'default' ? 'default' : kpi.tone}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-ink-600 uppercase tracking-wide">{kpi.title}</p>
                  <p className="mt-2 text-2xl font-bold text-ink-900">
                    {loading ? <Skeleton className="h-8 w-24" /> : kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">{kpi.helper}</p>
                </div>
                <span className="rounded-2xl bg-white/70 p-2.5 text-ink-800">
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Cuentas de cobro recientes</CardTitle>
              <CardDescription>Últimas emisiones del condominio</CardDescription>
            </div>
          </CardHeader>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : billings.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no hay cuentas de cobro emitidas.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {billings.slice(0, 6).map(b => (
                <li key={b.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{b.document_number}</p>
                    <p className="text-xs text-ink-500">
                      Período {String(b.period_month).padStart(2, '0')}/{b.period_year}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink-900">{formatCurrency(b.total)}</p>
                    <BillingStatusBadge status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card tone="yellow">
          <CardHeader>
            <div>
              <CardTitle>Stock bajo</CardTitle>
              <CardDescription>Insumos por debajo del mínimo</CardDescription>
            </div>
            <Boxes className="h-5 w-5 text-[#8a6300]" />
          </CardHeader>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : lowStock.length === 0 ? (
            <p className="text-sm text-ink-700">Todo en orden — sin alertas de inventario.</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.slice(0, 5).map(s => (
                <li key={s.supply_item_id} className="flex justify-between text-sm">
                  <span className="text-ink-800">{s.name}</span>
                  <span className="text-brand-red font-semibold">
                    {s.total_stock} / {s.min_stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card tone="blue">
          <CardHeader>
            <CardTitle>Próxima asamblea</CardTitle>
            <CalendarRange className="h-5 w-5 text-brand-blue" />
          </CardHeader>
          <p className="text-sm text-ink-700">Crea una asamblea desde el módulo correspondiente para ver detalles aquí.</p>
        </Card>
        <Card tone="green">
          <CardHeader>
            <CardTitle>Foro comunitario</CardTitle>
            <MessagesSquare className="h-5 w-5 text-brand-green" />
          </CardHeader>
          <p className="text-sm text-ink-700">Mantente al tanto de anuncios, eventos y denuncias.</p>
        </Card>
        <Card tone="default">
          <CardHeader>
            <CardTitle>Equipo</CardTitle>
            <Users className="h-5 w-5 text-ink-700" />
          </CardHeader>
          <p className="text-sm text-ink-700">Administra usuarios y sus permisos desde el módulo Usuarios.</p>
        </Card>
      </div>
    </div>
  )
}

function BillingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: 'success' | 'info' | 'danger' | 'warning' | 'neutral'; label: string }> = {
    paid: { tone: 'success', label: 'Pagado' },
    pending: { tone: 'info', label: 'Pendiente' },
    partial: { tone: 'warning', label: 'Parcial' },
    overdue: { tone: 'danger', label: 'Vencido' },
    cancelled: { tone: 'neutral', label: 'Cancelado' },
    draft: { tone: 'neutral', label: 'Borrador' },
  }
  const m = map[status] || { tone: 'neutral', label: status }
  return <Badge tone={m.tone} dot>{m.label}</Badge>
}

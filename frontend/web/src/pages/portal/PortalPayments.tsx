import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Wallet, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/services/api'

export default function PortalPayments() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const propertyIds = user?.condominiums?.[0]?.property_ids || []
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!condoId) return
    api.get(`/billing/condominium/${condoId}`)
      .then(r => {
        const own = (r.data || []).filter((x: any) =>
          propertyIds.length === 0 ? true : propertyIds.includes(x.property_id),
        )
        setDocs(own)
      })
      .finally(() => setLoading(false))
  }, [condoId])

  const totalPending = docs.filter(d => d.status !== 'paid' && d.status !== 'cancelled').reduce((a, b) => a + (b.balance || 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Pagos</h1>
        <p className="text-ink-500 mt-1">Historial y estado de tus cuentas de cobro.</p>
      </div>

      <Card tone={totalPending > 0 ? 'blue' : 'green'} interactive>
        <CardHeader>
          <div>
            <CardTitle>Saldo total pendiente</CardTitle>
            <CardDescription>Suma de cuentas activas asociadas a tu unidad.</CardDescription>
          </div>
          <Wallet className="h-5 w-5 text-brand-blue" />
        </CardHeader>
        <p className="text-3xl font-bold text-ink-900">{formatCurrency(totalPending)}</p>
      </Card>

      {loading ? (
        <Skeleton className="h-40" />
      ) : docs.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">No hay cuentas de cobro asociadas a tu unidad.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map(d => {
            const status =
              d.status === 'paid'
                ? { tone: 'success' as const, label: 'Pagado', Icon: CheckCircle2 }
                : d.status === 'overdue'
                  ? { tone: 'danger' as const, label: 'Vencido', Icon: AlertTriangle }
                  : d.status === 'partial'
                    ? { tone: 'warning' as const, label: 'Parcial', Icon: Clock }
                    : { tone: 'info' as const, label: 'Pendiente', Icon: Clock }
            const StatusIcon = status.Icon
            return (
              <motion.div key={d.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <Card interactive>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full p-2.5 ${status.tone === 'success' ? 'bg-brand-green-light text-brand-green' : status.tone === 'danger' ? 'bg-brand-red-light text-brand-red' : status.tone === 'warning' ? 'bg-brand-yellow-light text-[#8a6300]' : 'bg-brand-blue-light text-brand-blue'}`}>
                        <StatusIcon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink-900">{d.document_number}</p>
                        <p className="text-xs text-ink-500">
                          Período {String(d.period_month).padStart(2, '0')}/{d.period_year} · vence {formatDate(d.due_date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-ink-900">{formatCurrency(d.balance ?? d.total)}</p>
                      <Badge tone={status.tone} dot>{status.label}</Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

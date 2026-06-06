import { useEffect, useState } from 'react'
import { Receipt, Plus, Calendar } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import api from '@/services/api'

interface Doc {
  id: number
  document_number: string
  period_year: number
  period_month: number
  due_date: string
  total: number
  paid_amount: number
  balance: number
  status: string
  property_id: number
}

export default function BillingPage() {
  const toast = useToast()
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  })
  const [generating, setGenerating] = useState(false)

  const load = async () => {
    if (!condoId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const r = await api.get(`/billing/condominium/${condoId}`)
      setDocs(r.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [condoId])

  const generate = async () => {
    if (!condoId) return
    setGenerating(true)
    try {
      await api.post(`/billing/condominium/${condoId}/generate-monthly`, null, {
        params: { period_year: period.year, period_month: period.month },
      })
      toast.success('Cuentas de cobro generadas')
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    } finally {
      setGenerating(false)
    }
  }

  const grouped: Record<string, Doc[]> = {}
  for (const d of docs) {
    grouped[d.status] = [...(grouped[d.status] || []), d]
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Cuentas de cobro</h1>
        <p className="text-ink-500 mt-1">Genera y consulta cuentas de cobro mensuales.</p>
      </div>

      <Card tone="blue">
        <CardHeader>
          <div>
            <CardTitle>Generar cuentas mensuales</CardTitle>
            <CardDescription>Crea cuentas de cobro para todas las propiedades del condominio.</CardDescription>
          </div>
          <Calendar className="h-5 w-5 text-brand-blue" />
        </CardHeader>
        <div className="flex flex-wrap items-end gap-3">
          <Input label="Año" type="number" value={String(period.year)} onChange={e => setPeriod({ ...period, year: parseInt(e.target.value || '0') })} className="w-28" />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Mes</label>
            <select
              value={period.month}
              onChange={e => setPeriod({ ...period, month: parseInt(e.target.value) })}
              className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
              ))}
            </select>
          </div>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={generate} loading={generating}>
            Generar
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-4">
        {(['pending', 'partial', 'paid', 'overdue'] as const).map(st => (
          <Card key={st} tone={st === 'paid' ? 'green' : st === 'overdue' ? 'red' : st === 'partial' ? 'yellow' : 'blue'}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-700">
              {st === 'paid' ? 'Pagadas' : st === 'pending' ? 'Pendientes' : st === 'partial' ? 'Parciales' : 'Vencidas'}
            </p>
            <p className="mt-2 text-2xl font-bold text-ink-900">{(grouped[st] || []).length}</p>
            <p className="text-xs text-ink-600 mt-1">
              {formatCurrency((grouped[st] || []).reduce((a, b) => a + (b.total || 0), 0))}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>Listado completo de cuentas de cobro</CardDescription>
          </div>
          <Receipt className="h-5 w-5 text-brand-blue" />
        </CardHeader>
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : docs.length === 0 ? (
          <p className="text-sm text-ink-500">Aún no hay cuentas de cobro emitidas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-500">
                  <th className="py-2 pr-3">Documento</th>
                  <th className="py-2 pr-3">Período</th>
                  <th className="py-2 pr-3">Vence</th>
                  <th className="py-2 pr-3 text-right">Total</th>
                  <th className="py-2 pr-3 text-right">Pagado</th>
                  <th className="py-2 pr-3 text-right">Saldo</th>
                  <th className="py-2 pr-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {docs.map(d => (
                  <tr key={d.id} className="hover:bg-ink-50 transition-colors">
                    <td className="py-2.5 pr-3 font-medium text-ink-900">{d.document_number}</td>
                    <td className="py-2.5 pr-3">{String(d.period_month).padStart(2, '0')}/{d.period_year}</td>
                    <td className="py-2.5 pr-3 text-ink-600">{formatDate(d.due_date)}</td>
                    <td className="py-2.5 pr-3 text-right">{formatCurrency(d.total)}</td>
                    <td className="py-2.5 pr-3 text-right text-brand-green">{formatCurrency(d.paid_amount)}</td>
                    <td className="py-2.5 pr-3 text-right font-semibold">{formatCurrency(d.balance)}</td>
                    <td className="py-2.5 pr-3">
                      <BillingBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function BillingBadge({ status }: { status: string }) {
  const map: Record<string, { tone: any; label: string }> = {
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

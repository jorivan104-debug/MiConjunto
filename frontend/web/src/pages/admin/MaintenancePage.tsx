import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'

interface WO {
  id: number
  code?: string | null
  title: string
  type: string
  priority: string
  status: string
  scheduled_at?: string | null
  estimated_cost: number
  actual_cost: number
}

const COLUMNS: { id: string; label: string; tone: 'info' | 'warning' | 'success' | 'neutral' }[] = [
  { id: 'open', label: 'Abierta', tone: 'info' },
  { id: 'in_progress', label: 'En curso', tone: 'warning' },
  { id: 'on_hold', label: 'En espera', tone: 'neutral' },
  { id: 'completed', label: 'Completada', tone: 'success' },
]

export default function MaintenancePage() {
  const toast = useToast()
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [orders, setOrders] = useState<WO[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', type: 'corrective' })

  const load = async () => {
    if (!condoId) return
    setLoading(true)
    try {
      const r = await api.get(`/maintenance/condominium/${condoId}/work-orders`)
      setOrders(r.data || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [condoId])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condoId) return
    try {
      await api.post('/maintenance/work-orders', { ...form, condominium_id: condoId, tasks: [] })
      toast.success('Orden creada')
      setOpen(false)
      setForm({ title: '', description: '', priority: 'medium', type: 'corrective' })
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  const action = async (wo: WO, op: 'start' | 'complete') => {
    try {
      await api.post(`/maintenance/work-orders/${wo.id}/${op}`)
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  const grouped = COLUMNS.map(c => ({
    ...c,
    items: orders.filter(o => o.status === c.id),
  }))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Mantenimiento</h1>
          <p className="text-ink-500 mt-1">Tablero de órdenes de trabajo y consumo de insumos.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nueva OT</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {grouped.map(col => (
            <div key={col.id}>
              <div className="mb-3 flex items-center gap-2">
                <Badge tone={col.tone} dot>{col.label}</Badge>
                <span className="text-xs text-ink-500">{col.items.length}</span>
              </div>
              <div className="space-y-3">
                {col.items.length === 0 && (
                  <Card className="border-dashed bg-transparent">
                    <p className="text-xs text-ink-400">Sin órdenes</p>
                  </Card>
                )}
                {col.items.map(o => (
                  <motion.div key={o.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card interactive>
                      <p className="text-xs font-mono text-ink-400">{o.code}</p>
                      <p className="text-sm font-semibold text-ink-900 mt-1">{o.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone={o.priority === 'urgent' ? 'danger' : o.priority === 'high' ? 'warning' : 'neutral'}>
                          {o.priority}
                        </Badge>
                        <Badge tone="info">{o.type}</Badge>
                      </div>
                      {col.id === 'open' && (
                        <Button size="sm" variant="primary" className="mt-3 w-full" onClick={() => action(o, 'start')}>
                          Iniciar
                        </Button>
                      )}
                      {col.id === 'in_progress' && (
                        <Button size="sm" variant="secondary" className="mt-3 w-full" onClick={() => action(o, 'complete')}>
                          Marcar completada
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva orden de trabajo">
        <form onSubmit={create} className="space-y-3">
          <Input label="Título" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Tipo</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm">
                <option value="corrective">Correctivo</option>
                <option value="preventive">Preventivo</option>
                <option value="emergency">Emergencia</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Prioridad</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm">
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Crear</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

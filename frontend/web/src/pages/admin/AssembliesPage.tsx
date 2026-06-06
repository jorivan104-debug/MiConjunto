import { useEffect, useState } from 'react'
import { CalendarRange, Plus } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'
import api from '@/services/api'

interface Assembly {
  id: number
  title: string
  scheduled_date: string
  status: string
  required_quorum: number
  current_quorum: number
}

export default function AssembliesPage() {
  const toast = useToast()
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [items, setItems] = useState<Assembly[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', scheduled_date: '', required_quorum: 50, location: '' })

  const load = async () => {
    if (!condoId) return
    setLoading(true)
    try {
      const r = await api.get(`/assemblies/condominium/${condoId}`)
      setItems(r.data || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [condoId])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condoId) return
    try {
      await api.post('/assemblies/', {
        condominium_id: condoId,
        title: form.title,
        scheduled_date: new Date(form.scheduled_date).toISOString(),
        required_quorum: form.required_quorum,
        location: form.location,
      })
      toast.success('Asamblea programada')
      setOpen(false)
      setForm({ title: '', scheduled_date: '', required_quorum: 50, location: '' })
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Asambleas</h1>
          <p className="text-ink-500 mt-1">Convocatorias, quórum por coeficiente y votaciones.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nueva asamblea</Button>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">Aún no hay asambleas programadas.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map(a => (
            <Card key={a.id} interactive tone="blue">
              <CardHeader>
                <div>
                  <CardTitle>{a.title}</CardTitle>
                  <CardDescription>{formatDateTime(a.scheduled_date)}</CardDescription>
                </div>
                <CalendarRange className="h-5 w-5 text-brand-blue" />
              </CardHeader>
              <div className="flex items-center justify-between">
                <Badge tone={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'warning' : 'info'} dot>
                  {a.status}
                </Badge>
                <span className="text-sm text-ink-700">
                  Quórum: {a.current_quorum?.toFixed(1)}% / {a.required_quorum}%
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full bg-brand-green transition-all duration-500"
                  style={{ width: `${Math.min(100, (a.current_quorum / a.required_quorum) * 100)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Nueva asamblea">
        <form onSubmit={create} className="space-y-3">
          <Input label="Título" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Fecha y hora" type="datetime-local" required value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
          <Input label="Lugar" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          <Input label="Quórum requerido (%)" type="number" value={String(form.required_quorum)} onChange={e => setForm({ ...form, required_quorum: parseInt(e.target.value || '0') })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Crear</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

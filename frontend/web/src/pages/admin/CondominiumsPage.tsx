import { useEffect, useState } from 'react'
import { Plus, Building2, MapPin, Users } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

interface Condo {
  id: number
  name: string
  short_name?: string | null
  city?: string | null
  total_units?: number | null
  administration_value_cop?: number | null
  administration_value_type?: string | null
}

export default function CondominiumsPage() {
  const toast = useToast()
  const [items, setItems] = useState<Condo[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    short_name: '',
    city: '',
    state: '',
    nit: '',
    administrator_name: '',
    administrator_phone: '',
    total_units: '',
    administration_value_type: 'global',
    administration_value_cop: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/condominiums/')
      setItems(r.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/condominiums/', {
        ...form,
        total_units: form.total_units ? parseInt(form.total_units) : null,
        administration_value_cop: form.administration_value_cop
          ? parseInt(form.administration_value_cop)
          : null,
      })
      toast.success('Condominio creado')
      setOpen(false)
      setForm({ ...form, name: '', short_name: '', city: '' })
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Condominios</h1>
          <p className="text-ink-500 mt-1">Administra todas las copropiedades de tu organización.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Nuevo condominio</Button>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-36 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">Aún no tienes condominios. Crea el primero.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map(c => (
            <Card key={c.id} interactive tone="blue">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-white p-2 text-brand-blue">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle>{c.name}</CardTitle>
                    {c.short_name && <CardDescription>{c.short_name}</CardDescription>}
                  </div>
                </div>
              </CardHeader>
              <ul className="text-sm text-ink-700 space-y-1.5">
                {c.city && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-blue" /> {c.city}</li>}
                <li className="flex items-center gap-2"><Users className="h-4 w-4 text-brand-blue" /> {c.total_units ?? '—'} unidades</li>
              </ul>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo condominio" className="max-w-xl">
        <form onSubmit={submit} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Nombre" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Nombre corto" value={form.short_name} onChange={e => setForm({ ...form, short_name: e.target.value })} />
            <Input label="Ciudad" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <Input label="Departamento" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
            <Input label="NIT" value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} />
            <Input label="Administrador" value={form.administrator_name} onChange={e => setForm({ ...form, administrator_name: e.target.value })} />
            <Input label="Teléfono administrador" value={form.administrator_phone} onChange={e => setForm({ ...form, administrator_phone: e.target.value })} />
            <Input label="Total unidades" type="number" value={form.total_units} onChange={e => setForm({ ...form, total_units: e.target.value })} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Modo de administración</label>
              <select
                value={form.administration_value_type}
                onChange={e => setForm({ ...form, administration_value_type: e.target.value })}
                className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm focus:border-brand-blue focus:outline-none"
              >
                <option value="global">Valor global</option>
                <option value="segmentado">Segmentado por unidad</option>
              </select>
            </div>
            <Input label="Valor administración (COP)" type="number" value={form.administration_value_cop} onChange={e => setForm({ ...form, administration_value_cop: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" loading={saving}>Crear condominio</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

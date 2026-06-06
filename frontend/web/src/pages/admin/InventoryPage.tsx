import { useEffect, useState } from 'react'
import { Boxes, Plus, AlertTriangle } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import api from '@/services/api'

interface Warehouse { id: number; name: string; code?: string | null; location?: string | null; is_active: boolean }
interface Item { id: number; sku?: string | null; name: string; category?: string | null; unit: string; min_stock: number; is_active: boolean }
interface Alert { supply_item_id: number; name: string; total_stock: number; min_stock: number }

export default function InventoryPage() {
  const toast = useToast()
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [lowStock, setLowStock] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [openWh, setOpenWh] = useState(false)
  const [openItem, setOpenItem] = useState(false)
  const [whForm, setWhForm] = useState({ name: '', code: '', location: '' })
  const [itemForm, setItemForm] = useState({ name: '', sku: '', unit: 'unidad', min_stock: '0', category: '' })

  const load = async () => {
    if (!condoId) return
    setLoading(true)
    try {
      const [w, i, a] = await Promise.allSettled([
        api.get(`/inventory/condominium/${condoId}/warehouses`),
        api.get(`/inventory/condominium/${condoId}/items`),
        api.get(`/inventory/condominium/${condoId}/low-stock`),
      ])
      if (w.status === 'fulfilled') setWarehouses(w.value.data || [])
      if (i.status === 'fulfilled') setItems(i.value.data || [])
      if (a.status === 'fulfilled') setLowStock(a.value.data || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [condoId])

  const createWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condoId) return
    try {
      await api.post('/inventory/warehouses', { ...whForm, condominium_id: condoId })
      toast.success('Bodega creada')
      setOpenWh(false)
      setWhForm({ name: '', code: '', location: '' })
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condoId) return
    try {
      await api.post('/inventory/items', {
        ...itemForm,
        condominium_id: condoId,
        min_stock: parseFloat(itemForm.min_stock || '0'),
      })
      toast.success('Insumo creado')
      setOpenItem(false)
      setItemForm({ name: '', sku: '', unit: 'unidad', min_stock: '0', category: '' })
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Inventario</h1>
          <p className="text-ink-500 mt-1">Bodegas, insumos, kardex y alertas de stock.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenWh(true)}>Nueva bodega</Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenItem(true)}>Nuevo insumo</Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card tone="red">
          <CardHeader>
            <div>
              <CardTitle>Stock crítico</CardTitle>
              <CardDescription>Insumos por debajo del mínimo configurado.</CardDescription>
            </div>
            <AlertTriangle className="h-5 w-5 text-brand-red" />
          </CardHeader>
          <ul className="grid md:grid-cols-2 gap-2">
            {lowStock.map(a => (
              <li key={a.supply_item_id} className="flex justify-between rounded-xl bg-white px-3 py-2 text-sm">
                <span className="font-medium text-ink-900">{a.name}</span>
                <span className="text-brand-red font-semibold">{a.total_stock} / {a.min_stock}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bodegas</CardTitle>
            <Boxes className="h-5 w-5 text-brand-blue" />
          </CardHeader>
          {loading ? <Skeleton className="h-32" /> : warehouses.length === 0 ? (
            <p className="text-sm text-ink-500">Crea tu primera bodega para empezar.</p>
          ) : (
            <ul className="space-y-2">
              {warehouses.map(w => (
                <li key={w.id} className="flex justify-between rounded-xl bg-ink-50 px-3 py-2.5">
                  <div>
                    <p className="font-medium text-ink-900">{w.name}</p>
                    <p className="text-xs text-ink-500">{w.location || '—'}</p>
                  </div>
                  <Badge tone={w.is_active ? 'success' : 'neutral'} dot>
                    {w.is_active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de insumos</CardTitle>
            <CardDescription>{items.length} insumos registrados</CardDescription>
          </CardHeader>
          {loading ? <Skeleton className="h-32" /> : items.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no hay insumos en el catálogo.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {items.map(it => (
                <li key={it.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{it.name}</p>
                    <p className="text-xs text-ink-500">{it.sku ? `${it.sku} · ` : ''}{it.unit}{it.category ? ` · ${it.category}` : ''}</p>
                  </div>
                  <span className="text-xs text-ink-500">mín: {it.min_stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Dialog open={openWh} onClose={() => setOpenWh(false)} title="Nueva bodega">
        <form onSubmit={createWarehouse} className="space-y-3">
          <Input label="Nombre" required value={whForm.name} onChange={e => setWhForm({ ...whForm, name: e.target.value })} />
          <Input label="Código" value={whForm.code} onChange={e => setWhForm({ ...whForm, code: e.target.value })} />
          <Input label="Ubicación" value={whForm.location} onChange={e => setWhForm({ ...whForm, location: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpenWh(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Crear</Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={openItem} onClose={() => setOpenItem(false)} title="Nuevo insumo">
        <form onSubmit={createItem} className="space-y-3">
          <Input label="Nombre" required value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="SKU" value={itemForm.sku} onChange={e => setItemForm({ ...itemForm, sku: e.target.value })} />
            <Input label="Unidad" value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} />
            <Input label="Categoría" value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} />
            <Input label="Stock mínimo" type="number" value={itemForm.min_stock} onChange={e => setItemForm({ ...itemForm, min_stock: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpenItem(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">Crear</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

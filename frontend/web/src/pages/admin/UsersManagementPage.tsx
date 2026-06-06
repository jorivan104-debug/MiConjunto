import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, KeyRound, Power, PowerOff, X } from 'lucide-react'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Dialog } from '@/components/ui/Dialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

interface RoleItem { id: number; name: string; description?: string | null }
interface CondoItem { id: number; name: string }
interface UserItem {
  id: number
  username?: string | null
  email: string
  full_name: string | null
  is_active: boolean
  totp_enabled?: boolean
  must_change_password?: boolean
  photo_url?: string | null
  roles: RoleItem[]
  condominiums: CondoItem[]
}

const EMPTY_FORM = {
  email: '',
  username: '',
  full_name: '',
  phone: '',
  document_type: '',
  document_number: '',
  password: '',
  role_ids: [] as number[],
  condominium_ids: [] as number[],
}

export default function UsersManagementPage() {
  const toast = useToast()
  const [users, setUsers] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [condos, setCondos] = useState<CondoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('')
  const [filterActive, setFilterActive] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UserItem | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [u, r, c] = await Promise.all([
        api.get('/users/'),
        api.get('/users/roles/all'),
        api.get('/condominiums/'),
      ])
      setUsers(u.data)
      setRoles(r.data)
      setCondos(c.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (search) {
        const q = search.toLowerCase()
        const hay = [u.email, u.username, u.full_name].filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (filterRole && !u.roles.some(r => r.name === filterRole)) return false
      if (filterActive === 'active' && !u.is_active) return false
      if (filterActive === 'inactive' && u.is_active) return false
      return true
    })
  }, [users, search, filterRole, filterActive])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setOpen(true)
  }

  const openEdit = (u: UserItem) => {
    setEditing(u)
    setForm({
      email: u.email,
      username: u.username || '',
      full_name: u.full_name || '',
      phone: '',
      document_type: '',
      document_number: '',
      password: '',
      role_ids: u.roles.map(r => r.id),
      condominium_ids: u.condominiums.map(c => c.id),
    })
    setOpen(true)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        email: form.email,
        username: form.username || null,
        full_name: form.full_name || null,
        phone: form.phone || null,
        document_type: form.document_type || null,
        document_number: form.document_number || null,
        password: form.password || null,
        role_ids: form.role_ids,
        condominium_ids: form.condominium_ids,
      }
      if (editing) {
        await api.put(`/users/${editing.id}`, payload)
        toast.success('Usuario actualizado')
      } else {
        await api.post('/users/', payload)
        toast.success('Usuario creado')
      }
      setOpen(false)
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || 'No se pudo guardar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: UserItem) => {
    try {
      const path = u.is_active ? 'deactivate' : 'activate'
      await api.patch(`/users/${u.id}/${path}`)
      toast.success(u.is_active ? 'Usuario desactivado' : 'Usuario activado')
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  const resetPassword = async (u: UserItem) => {
    try {
      const r = await api.post(`/users/${u.id}/reset-password`)
      toast.success(`Contraseña temporal: ${r.data.temp_password}`, 'Comparte este código con el usuario')
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Usuarios</h1>
          <p className="text-ink-500 mt-1">Gestiona accesos, roles y condominios asignados.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} variant="primary" onClick={openCreate}>
          Nuevo usuario
        </Button>
      </div>

      <Card>
        <div className="grid md:grid-cols-3 gap-3">
          <Input placeholder="Buscar por nombre, email o usuario..." leftIcon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} />
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm focus:border-brand-blue focus:outline-none"
          >
            <option value="">Todos los roles</option>
            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value)}
            className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm focus:border-brand-blue focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card>
          <div className="space-y-3">
            {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <Card>
              <p className="text-sm text-ink-500">No hay usuarios que coincidan con la búsqueda.</p>
            </Card>
          )}
          {filtered.map(u => (
            <motion.div
              key={u.id}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Card interactive className="hover:shadow-card">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.full_name || u.email} src={u.photo_url || undefined} />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate">{u.full_name || '—'}</p>
                      <p className="text-xs text-ink-500 truncate">
                        {u.username ? `@${u.username} · ` : ''}{u.email}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {u.roles.map(r => (
                          <Badge key={r.id} tone="info">{r.name}</Badge>
                        ))}
                        {u.totp_enabled && <Badge tone="success" dot>2FA</Badge>}
                        {u.must_change_password && <Badge tone="warning">Cambio pendiente</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={u.is_active ? 'success' : 'neutral'} dot>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openEdit(u)}>Editar</Button>
                    <Button size="sm" variant="ghost" leftIcon={<KeyRound className="h-4 w-4" />} onClick={() => resetPassword(u)}>
                      Resetear
                    </Button>
                    <Button
                      size="sm"
                      variant={u.is_active ? 'danger' : 'primary'}
                      leftIcon={u.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                      onClick={() => toggleActive(u)}
                    >
                      {u.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        description="Define datos básicos, roles y condominios de acceso."
        className="max-w-2xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <Input label="Nombre completo" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            <Input label="Usuario (login)" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <Input label="Teléfono" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            <Input label="Tipo de documento" placeholder="CC, CE, NIT" value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })} />
            <Input label="Número de documento" value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} />
            <Input
              label={editing ? 'Nueva contraseña (opcional)' : 'Contraseña inicial (opcional)'}
              hint="Si lo dejas vacío, el usuario debe cambiarla al ingresar."
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-700 mb-2">Roles</p>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => {
                const active = form.role_ids.includes(r.id)
                return (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setForm(prev => ({
                      ...prev,
                      role_ids: active ? prev.role_ids.filter(id => id !== r.id) : [...prev.role_ids, r.id],
                    }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                      active
                        ? 'bg-brand-blue text-white border-brand-blue'
                        : 'bg-white text-ink-700 border-ink-200 hover:border-brand-blue'
                    }`}
                  >
                    {r.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-ink-700 mb-2">Condominios</p>
            <div className="flex flex-wrap gap-2">
              {condos.length === 0 && <span className="text-xs text-ink-500">No hay condominios creados todavía.</span>}
              {condos.map(c => {
                const active = form.condominium_ids.includes(c.id)
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setForm(prev => ({
                      ...prev,
                      condominium_ids: active ? prev.condominium_ids.filter(id => id !== c.id) : [...prev.condominium_ids, c.id],
                    }))}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                      active
                        ? 'bg-brand-green text-white border-brand-green'
                        : 'bg-white text-ink-700 border-ink-200 hover:border-brand-green'
                    }`}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} leftIcon={<X className="h-4 w-4" />}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

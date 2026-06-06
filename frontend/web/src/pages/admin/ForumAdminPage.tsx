import { useEffect, useState } from 'react'
import { MessagesSquare, Plus, AlertOctagon } from 'lucide-react'

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

interface Post { id: number; title: string; body: string; status: string; likes_count: number; replies_count: number; created_at: string; pinned: boolean }
interface Complaint { id: number; post_id: number; title: string; severity: string; status: string; created_at: string }
interface Category { id: number; name: string; type: string }

export default function ForumAdminPage() {
  const toast = useToast()
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [tab, setTab] = useState<'posts' | 'complaints'>('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [openPost, setOpenPost] = useState(false)
  const [postForm, setPostForm] = useState({ title: '', body: '', category_id: '' })

  const load = async () => {
    if (!condoId) return
    setLoading(true)
    try {
      const [p, c, cat] = await Promise.allSettled([
        api.get(`/forum/condominium/${condoId}/posts`),
        api.get(`/forum/condominium/${condoId}/complaints`),
        api.get(`/forum/condominium/${condoId}/categories`),
      ])
      if (p.status === 'fulfilled') setPosts(p.value.data || [])
      if (c.status === 'fulfilled') setComplaints(c.value.data || [])
      if (cat.status === 'fulfilled') setCategories(cat.value.data || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [condoId])

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condoId) return
    try {
      await api.post('/forum/posts', {
        condominium_id: condoId,
        title: postForm.title,
        body: postForm.body,
        category_id: postForm.category_id ? parseInt(postForm.category_id) : null,
      })
      toast.success('Publicado')
      setOpenPost(false)
      setPostForm({ title: '', body: '', category_id: '' })
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Comunidad</h1>
          <p className="text-ink-500 mt-1">Anuncios, foros, eventos y denuncias.</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setOpenPost(true)}>Publicar</Button>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'posts', label: 'Publicaciones', icon: MessagesSquare },
          { id: 'complaints', label: 'Denuncias', icon: AlertOctagon },
        ].map((t: any) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-yellow text-ink-900 shadow-soft' : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-yellow'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Skeleton className="h-40" /> : tab === 'posts' ? (
        posts.length === 0 ? (
          <Card><p className="text-sm text-ink-500">Aún no hay publicaciones.</p></Card>
        ) : (
          <div className="grid gap-3">
            {posts.map(p => (
              <Card key={p.id} interactive>
                <CardHeader>
                  <div>
                    <CardTitle>{p.title}{p.pinned && <Badge tone="warning" className="ml-2">Fijado</Badge>}</CardTitle>
                    <CardDescription>{formatDateTime(p.created_at)}</CardDescription>
                  </div>
                </CardHeader>
                <p className="text-sm text-ink-700 line-clamp-2">{p.body}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-ink-500">
                  <span>♥ {p.likes_count}</span>
                  <span>💬 {p.replies_count}</span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : (
        complaints.length === 0 ? (
          <Card><p className="text-sm text-ink-500">No hay denuncias activas.</p></Card>
        ) : (
          <div className="grid gap-3">
            {complaints.map(c => (
              <Card key={c.id} tone={c.severity === 'high' ? 'red' : c.severity === 'medium' ? 'yellow' : 'default'}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{c.title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{formatDateTime(c.created_at)}</p>
                  </div>
                  <Badge tone={c.status === 'resolved' ? 'success' : c.status === 'closed' ? 'neutral' : 'warning'} dot>
                    {c.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      <Dialog open={openPost} onClose={() => setOpenPost(false)} title="Nueva publicación">
        <form onSubmit={createPost} className="space-y-3">
          <Input label="Título" required value={postForm.title} onChange={e => setPostForm({ ...postForm, title: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Mensaje</label>
            <textarea
              value={postForm.body}
              onChange={e => setPostForm({ ...postForm, body: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
              required
            />
          </div>
          {categories.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Categoría</label>
              <select
                value={postForm.category_id}
                onChange={e => setPostForm({ ...postForm, category_id: e.target.value })}
                className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm"
              >
                <option value="">General</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpenPost(false)}>Cancelar</Button>
            <Button type="submit" variant="community">Publicar</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

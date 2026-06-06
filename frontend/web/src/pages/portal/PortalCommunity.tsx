import { useEffect, useState } from 'react'
import { Heart, MessageCircle, Pin } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime } from '@/lib/utils'
import api from '@/services/api'

export default function PortalCommunity() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!condoId) return
    setLoading(true)
    try {
      const r = await api.get(`/forum/condominium/${condoId}/posts`)
      setPosts(r.data || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [condoId])

  const like = async (id: number) => {
    try {
      const r = await api.post(`/forum/posts/${id}/like`)
      setPosts(prev => prev.map(p => (p.id === id ? { ...p, likes_count: r.data.likes_count } : p)))
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Comunidad</h1>
        <p className="text-ink-500 mt-1">Anuncios, eventos y conversaciones de tu comunidad.</p>
      </div>

      {loading ? (
        <Skeleton className="h-40" />
      ) : posts.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-500">Aún no hay publicaciones. ¡Sé el primero en compartir!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(p => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <Card interactive>
                <div className="flex items-start gap-3">
                  <Avatar name={p.is_anonymous ? '?' : 'Comunidad'} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink-900">{p.title}</p>
                      {p.pinned && <Pin className="h-3.5 w-3.5 text-brand-yellow" />}
                    </div>
                    <p className="text-xs text-ink-500">{formatDateTime(p.created_at)}</p>
                    <p className="mt-2 text-sm text-ink-700 whitespace-pre-line">{p.body}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-ink-500">
                      <button
                        onClick={() => like(p.id)}
                        className="flex items-center gap-1.5 hover:text-brand-red transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        {p.likes_count || 0}
                      </button>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="h-4 w-4" />
                        {p.replies_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

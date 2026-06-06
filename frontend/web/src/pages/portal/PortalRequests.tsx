import { useState } from 'react'
import { FileText, Send } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

export default function PortalRequests() {
  const { user } = useAuthStore()
  const toast = useToast()
  const condoId = user?.condominiums?.[0]?.id
  const [form, setForm] = useState({ title: '', body: '', is_anonymous: false })
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!condoId) return
    setSaving(true)
    try {
      await api.post('/forum/posts', {
        condominium_id: condoId,
        title: form.title,
        body: form.body,
        is_anonymous: form.is_anonymous,
      })
      toast.success('Solicitud enviada', 'Te avisaremos cuando haya respuesta.')
      setForm({ title: '', body: '', is_anonymous: false })
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Solicitudes (PQRS)</h1>
        <p className="text-ink-500 mt-1">Envía una petición, queja, reclamo o sugerencia.</p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Nueva solicitud</CardTitle>
            <CardDescription>Cuéntanos en qué podemos ayudarte.</CardDescription>
          </div>
          <FileText className="h-5 w-5 text-brand-blue" />
        </CardHeader>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Título" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Mensaje</label>
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              rows={5}
              required
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-blue focus:outline-none"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={e => setForm({ ...form, is_anonymous: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-blue focus:ring-brand-blue"
            />
            Enviar de forma anónima
          </label>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" loading={saving} leftIcon={<Send className="h-4 w-4" />}>
              Enviar solicitud
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

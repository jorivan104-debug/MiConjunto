import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound } from 'lucide-react'

import api from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function PasswordChangePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, refreshMe } = useAuthStore()
  const isFirstChange = !!user?.must_change_password || !!user?.needs_password_change

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (newPassword.toLowerCase() === 'admin') {
      setError('No puedes usar "admin" como contraseña')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: isFirstChange ? undefined : currentPassword,
        new_password: newPassword,
      })
      await refreshMe()
      toast.success('Contraseña actualizada', 'Ya puedes seguir usando Mi Conjunto')
      navigate('/', { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'No pudimos cambiar la contraseña'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-brand-blue-light/40 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <BrandLogo variant="full" className="h-24" />
        </div>
        <div className="rounded-3xl bg-white shadow-card border border-ink-100 p-7 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-brand-green-light p-2 text-brand-green">
              <KeyRound className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-ink-900">
              {isFirstChange ? 'Crea tu contraseña' : 'Cambiar contraseña'}
            </h1>
          </div>
          <p className="text-sm text-ink-500">
            {isFirstChange
              ? 'Por seguridad, define una nueva contraseña antes de continuar.'
              : 'Cambia tu contraseña actual por una nueva.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {!isFirstChange && (
              <Input
                label="Contraseña actual"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
            )}
            <Input
              label="Nueva contraseña"
              type="password"
              hint="Mínimo 8 caracteres."
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            {error && <p className="rounded-xl bg-brand-red-light px-3 py-2 text-sm text-brand-red">{error}</p>}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Guardar contraseña
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

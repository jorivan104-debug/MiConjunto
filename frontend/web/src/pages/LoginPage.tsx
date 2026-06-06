import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, User, Lock } from 'lucide-react'

import { BrandLogo } from '@/components/ui/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const toast = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await login(identifier.trim(), password)
      if (result.requires_2fa && result.pre_auth_token) {
        sessionStorage.setItem('pre_auth_token', result.pre_auth_token)
        navigate('/2fa', { replace: true })
        return
      }
      if (result.needs_password_change) {
        navigate('/cambiar-contrasena', { replace: true })
        return
      }
      toast.success('Bienvenido', '¡Qué bueno verte de nuevo!')
      navigate('/', { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'No pudimos iniciar sesión'
      setError(detail)
      toast.error('Error de inicio de sesión', detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-brand-blue-light/40 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <BrandLogo variant="full" className="h-64 md:h-80" />
        </div>
        <div className="rounded-3xl bg-white shadow-card border border-ink-100 p-7 md:p-8">
          <h1 className="text-2xl font-bold text-center text-ink-900">Hola de nuevo</h1>
          <p className="text-center text-sm text-ink-500 mt-1">Inicia sesión en tu comunidad</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Usuario o correo"
              placeholder="admin / tu@correo.com"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              autoFocus
              autoComplete="username"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
            />

            {error && (
              <p className="rounded-xl bg-brand-red-light px-3 py-2 text-sm text-brand-red">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loading}
              leftIcon={<LogIn className="h-4 w-4" />}
            >
              Entrar
            </Button>
          </form>
        </div>
        <p className="text-center text-xs text-ink-400 mt-6">
          Mi Conjunto · Convivencia organizada
        </p>
      </motion.div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

import { BrandLogo } from '@/components/ui/BrandLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { verify2fa } = useAuthStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preAuthToken = sessionStorage.getItem('pre_auth_token')

  useEffect(() => {
    if (!preAuthToken) navigate('/login', { replace: true })
  }, [preAuthToken, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!preAuthToken) return
    setError(null)
    setLoading(true)
    try {
      const result = await verify2fa(preAuthToken, code.trim())
      sessionStorage.removeItem('pre_auth_token')
      toast.success('Verificado', 'Bienvenido a Mi Conjunto')
      navigate(result.needs_password_change ? '/cambiar-contrasena' : '/', { replace: true })
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'Código incorrecto'
      setError(detail)
      toast.error('Verificación fallida', detail)
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
          <BrandLogo variant="icon" className="h-14" />
        </div>
        <div className="rounded-3xl bg-white shadow-card border border-ink-100 p-7 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="rounded-full bg-brand-blue-light p-2 text-brand-blue">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-bold text-ink-900">Verificación en dos pasos</h1>
          </div>
          <p className="text-sm text-ink-500">
            Ingresa el código de 6 dígitos de tu app autenticadora o un código de respaldo.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
              label="Código de 6 dígitos"
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
            {error && (
              <p className="rounded-xl bg-brand-red-light px-3 py-2 text-sm text-brand-red">{error}</p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              Verificar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full"
              onClick={() => {
                sessionStorage.removeItem('pre_auth_token')
                navigate('/login', { replace: true })
              }}
            >
              Volver al inicio de sesión
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

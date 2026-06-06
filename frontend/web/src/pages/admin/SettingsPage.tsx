import { useState } from 'react'
import { Settings as SettingsIcon, ShieldCheck } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

export default function SettingsPage() {
  const { user, refreshMe } = useAuthStore()
  const toast = useToast()
  const [setupOpen, setSetupOpen] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [otpUri, setOtpUri] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const start2fa = async () => {
    setLoading(true)
    try {
      const r = await api.post('/auth/2fa/setup')
      setQr(r.data.qr_png_base64)
      setOtpUri(r.data.otpauth_uri)
      setSetupOpen(true)
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    } finally {
      setLoading(false)
    }
  }

  const confirm2fa = async () => {
    try {
      const r = await api.post('/auth/2fa/confirm', { code })
      setBackupCodes(r.data.codes || [])
      toast.success('2FA activado')
      await refreshMe()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  const disable2fa = async () => {
    try {
      await api.delete('/auth/2fa')
      toast.success('2FA desactivado')
      await refreshMe()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Configuración</h1>
        <p className="text-ink-500 mt-1">Preferencias de cuenta y seguridad.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-blue-light p-2 text-brand-blue">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Doble autenticación (2FA)</CardTitle>
              <CardDescription>Protege tu cuenta con un código adicional cada vez que inicies sesión.</CardDescription>
            </div>
          </div>
        </CardHeader>
        {user?.totp_enabled ? (
          <div className="flex justify-between items-center">
            <p className="text-sm text-brand-green">2FA activo en tu cuenta.</p>
            <Button variant="danger" onClick={disable2fa}>Desactivar 2FA</Button>
          </div>
        ) : (
          <Button variant="secondary" loading={loading} onClick={start2fa}>Activar 2FA</Button>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-yellow-light p-2 text-[#8a6300]">
              <SettingsIcon className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Preferencias de notificación</CardTitle>
              <CardDescription>Pronto: ajusta cómo recibes anuncios y alertas.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <p className="text-sm text-ink-500">Esta sección estará disponible en una próxima actualización.</p>
      </Card>

      <Dialog
        open={setupOpen}
        onClose={() => {
          setSetupOpen(false)
          setQr(null)
          setBackupCodes([])
          setCode('')
        }}
        title="Activar 2FA"
        description="Escanea el QR con tu app autenticadora (Google Authenticator, Authy, Microsoft Authenticator)."
        className="max-w-md"
      >
        {qr && backupCodes.length === 0 && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img src={`data:image/png;base64,${qr}`} alt="QR 2FA" className="h-48 w-48" />
            </div>
            {otpUri && (
              <p className="text-xs text-ink-400 break-all text-center">{otpUri}</p>
            )}
            <Input label="Código generado" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" />
            <Button variant="primary" className="w-full" onClick={confirm2fa}>Confirmar y activar</Button>
          </div>
        )}
        {backupCodes.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-ink-700">
              Guarda estos códigos de respaldo en un lugar seguro. Cada uno se puede usar **una sola vez**.
            </p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map(c => (
                <li key={c} className="rounded-xl bg-ink-50 px-3 py-2 text-center">{c}</li>
              ))}
            </ul>
            <Button variant="primary" className="w-full" onClick={() => setSetupOpen(false)}>Listo</Button>
          </div>
        )}
      </Dialog>
    </div>
  )
}

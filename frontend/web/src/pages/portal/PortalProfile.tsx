import { useState } from 'react'
import { ShieldCheck, KeyRound, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Dialog } from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/Toast'
import api from '@/services/api'

export default function PortalProfile() {
  const { user, logout, refreshMe } = useAuthStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [open2fa, setOpen2fa] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const start2fa = async () => {
    try {
      const r = await api.post('/auth/2fa/setup')
      setQr(r.data.qr_png_base64)
      setOpen2fa(true)
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    }
  }

  const confirm = async () => {
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
        <h1 className="text-2xl font-bold text-ink-900">Mi perfil</h1>
        <p className="text-ink-500 mt-1">Datos personales y seguridad.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name || user?.email} src={user?.photo_url || undefined} size="lg" />
          <div>
            <p className="text-lg font-semibold text-ink-900">{user?.full_name || 'Usuario'}</p>
            <p className="text-sm text-ink-500">{user?.email}</p>
            {user?.username && <p className="text-xs text-ink-400">@{user.username}</p>}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-blue-light p-2 text-brand-blue">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Doble autenticación</CardTitle>
              <CardDescription>Una capa extra de seguridad para tu cuenta.</CardDescription>
            </div>
          </div>
        </CardHeader>
        {user?.totp_enabled ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-brand-green font-medium">2FA activo</p>
            <Button variant="danger" size="sm" onClick={disable2fa}>Desactivar</Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={start2fa}>Activar 2FA</Button>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-yellow-light p-2 text-[#8a6300]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <CardTitle>Contraseña</CardTitle>
              <CardDescription>Cámbiala periódicamente.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <Button variant="outline" size="sm" onClick={() => navigate('/cambiar-contrasena')}>Cambiar contraseña</Button>
      </Card>

      <Button
        variant="ghost"
        leftIcon={<LogOut className="h-4 w-4" />}
        onClick={() => {
          logout()
          navigate('/login')
        }}
      >
        Cerrar sesión
      </Button>

      <Dialog
        open={open2fa}
        onClose={() => {
          setOpen2fa(false)
          setQr(null)
          setBackupCodes([])
          setCode('')
        }}
        title="Activar 2FA"
        description="Escanea el QR con tu app autenticadora."
      >
        {qr && backupCodes.length === 0 && (
          <div className="space-y-3">
            <div className="flex justify-center">
              <img src={`data:image/png;base64,${qr}`} alt="QR 2FA" className="h-48 w-48" />
            </div>
            <Input label="Código de 6 dígitos" value={code} onChange={e => setCode(e.target.value)} />
            <Button variant="primary" className="w-full" onClick={confirm}>Confirmar</Button>
          </div>
        )}
        {backupCodes.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-ink-700">
              Guarda estos códigos en un lugar seguro. Solo se muestran una vez.
            </p>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map(c => <li key={c} className="rounded-xl bg-ink-50 px-3 py-2 text-center">{c}</li>)}
            </ul>
            <Button variant="primary" className="w-full" onClick={() => setOpen2fa(false)}>Listo</Button>
          </div>
        )}
      </Dialog>
    </div>
  )
}

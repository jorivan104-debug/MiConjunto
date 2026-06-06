import { useEffect, useState } from 'react'
import { Calculator, Database, BookOpen, FileSpreadsheet } from 'lucide-react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import api from '@/services/api'

interface Account { id: number; code: string; name: string; type: string; level: number; accepts_movement: boolean }
interface TrialRow { account_id: number; code: string; name: string; type: string; debit: number; credit: number; balance: number }

export default function AccountingPage() {
  const toast = useToast()
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [tab, setTab] = useState<'puc' | 'asientos' | 'reportes'>('puc')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [trial, setTrial] = useState<TrialRow[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  const load = async () => {
    if (!condoId) return
    setLoading(true)
    try {
      const [a, e] = await Promise.allSettled([
        api.get(`/accounting-puc/condominium/${condoId}/accounts`),
        api.get(`/accounting-puc/condominium/${condoId}/journal-entries`),
      ])
      if (a.status === 'fulfilled') setAccounts(a.value.data || [])
      if (e.status === 'fulfilled') setEntries(e.value.data || [])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [condoId])

  const loadTrial = async () => {
    if (!condoId) return
    const r = await api.get(`/accounting-puc/condominium/${condoId}/trial-balance`)
    setTrial(r.data || [])
  }

  useEffect(() => { if (tab === 'reportes') loadTrial() }, [tab])

  const seedPuc = async () => {
    if (!condoId) return
    setSeeding(true)
    try {
      await api.post(`/accounting-puc/condominium/${condoId}/seed`)
      toast.success('Plan de cuentas PUC cargado')
      await load()
    } catch (err: any) {
      toast.error('Error', err?.response?.data?.detail || '')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">Contabilidad</h1>
        <p className="text-ink-500 mt-1">Plan único de cuentas (PUC), asientos y reportes contables.</p>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'puc', label: 'Plan de cuentas', icon: Database },
          { id: 'asientos', label: 'Asientos', icon: BookOpen },
          { id: 'reportes', label: 'Reportes', icon: FileSpreadsheet },
        ].map((t: any) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id ? 'bg-brand-blue text-white shadow-soft' : 'bg-white text-ink-600 border border-ink-200 hover:border-brand-blue'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'puc' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Plan único de cuentas</CardTitle>
              <CardDescription>Catálogo PUC adaptado a propiedad horizontal en Colombia.</CardDescription>
            </div>
            <Button leftIcon={<Calculator className="h-4 w-4" />} onClick={seedPuc} loading={seeding} variant="secondary">
              Cargar PUC base
            </Button>
          </CardHeader>
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : accounts.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no hay cuentas. Carga el PUC base para comenzar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-ink-500">
                  <tr><th className="py-2 pr-4">Código</th><th className="py-2 pr-4">Nombre</th><th className="py-2 pr-4">Tipo</th><th className="py-2">Mov.</th></tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {accounts.map(a => (
                    <tr key={a.id} className="hover:bg-ink-50">
                      <td className="py-2 pr-4 font-mono text-xs">{a.code}</td>
                      <td className="py-2 pr-4" style={{ paddingLeft: `${(a.level - 1) * 12 + 16}px` }}>{a.name}</td>
                      <td className="py-2 pr-4 text-xs uppercase text-ink-500">{a.type}</td>
                      <td className="py-2">{a.accepts_movement ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'asientos' && (
        <Card>
          <CardHeader>
            <CardTitle>Asientos contables</CardTitle>
            <CardDescription>Registro doble partida. Los movimientos del módulo de pagos generan asientos automáticos.</CardDescription>
          </CardHeader>
          {loading ? <Skeleton className="h-40 w-full" /> : entries.length === 0 ? (
            <p className="text-sm text-ink-500">Aún no hay asientos contables.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {entries.map(e => (
                <li key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink-900">{e.entry_number} <span className="text-xs text-ink-400">· {e.status}</span></p>
                    <p className="text-xs text-ink-500">{e.description}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-ink-700">D: {formatCurrency(e.total_debit)}</p>
                    <p className="text-ink-700">H: {formatCurrency(e.total_credit)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'reportes' && (
        <Card>
          <CardHeader>
            <CardTitle>Balance de prueba</CardTitle>
            <CardDescription>Saldos consolidados por cuenta — solo asientos posteados.</CardDescription>
          </CardHeader>
          {trial.length === 0 ? (
            <p className="text-sm text-ink-500">No hay movimientos contables registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-ink-500">
                <tr>
                  <th className="py-2">Código</th>
                  <th className="py-2">Cuenta</th>
                  <th className="py-2 text-right">Débito</th>
                  <th className="py-2 text-right">Crédito</th>
                  <th className="py-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {trial.map(r => (
                  <tr key={r.account_id}>
                    <td className="py-2 font-mono text-xs">{r.code}</td>
                    <td className="py-2">{r.name}</td>
                    <td className="py-2 text-right">{formatCurrency(r.debit)}</td>
                    <td className="py-2 text-right">{formatCurrency(r.credit)}</td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}

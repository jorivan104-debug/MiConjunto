import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  show: (t: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const counter = React.useRef(0)

  const show = React.useCallback((t: Omit<ToastItem, 'id'>) => {
    counter.current += 1
    const id = counter.current
    setItems(prev => [...prev, { id, ...t }])
    setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== id))
    }, 4500)
  }, [])

  const value = React.useMemo<ToastContextValue>(
    () => ({
      show,
      success: (title, description) => show({ title, description, tone: 'success' }),
      error: (title, description) => show({ title, description, tone: 'error' }),
      info: (title, description) => show({ title, description, tone: 'info' }),
      warning: (title, description) => show({ title, description, tone: 'warning' }),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {items.map(item => (
            <ToastView key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastView({ item }: { item: ToastItem }) {
  const Icon =
    item.tone === 'success'
      ? CheckCircle2
      : item.tone === 'error'
        ? XCircle
        : item.tone === 'warning'
          ? AlertCircle
          : Info
  const tones: Record<ToastTone, string> = {
    success: 'bg-brand-green-light text-brand-green',
    error: 'bg-brand-red-light text-brand-red',
    warning: 'bg-brand-yellow-light text-[#8a6300]',
    info: 'bg-brand-blue-light text-brand-blue',
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
      className={cn('pointer-events-auto flex w-80 items-start gap-3 rounded-2xl bg-white p-4 shadow-card border border-ink-100')}
    >
      <span className={cn('rounded-full p-1.5', tones[item.tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink-900">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs text-ink-500">{item.description}</p>}
      </div>
    </motion.div>
  )
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

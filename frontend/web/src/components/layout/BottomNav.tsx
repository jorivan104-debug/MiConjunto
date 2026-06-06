import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Wallet, Users, FileText, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { to: '/portal/dashboard', icon: Home, label: 'Inicio' },
  { to: '/portal/pagos', icon: Wallet, label: 'Pagos' },
  { to: '/portal/comunidad', icon: Users, label: 'Comunidad' },
  { to: '/portal/solicitudes', icon: FileText, label: 'PQRS' },
  { to: '/portal/perfil', icon: User, label: 'Perfil' },
]

export function BottomNav() {
  const location = useLocation()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t border-ink-100 bg-white/90 backdrop-blur-md">
      <ul className="flex items-stretch justify-around">
        {ITEMS.map(item => {
          const Icon = item.icon
          const active = location.pathname.startsWith(item.to)
          return (
            <li key={item.to} className="flex-1">
              <NavLink to={item.to} className="flex flex-col items-center gap-1 py-2.5">
                <span className="relative">
                  <Icon
                    className={cn(
                      'h-6 w-6 transition-colors',
                      active ? 'text-brand-blue' : 'text-ink-400',
                    )}
                  />
                  {active && (
                    <motion.span
                      layoutId="bottomnav-pill"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-brand-blue"
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    active ? 'text-brand-blue' : 'text-ink-500',
                  )}
                >
                  {item.label}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default BottomNav

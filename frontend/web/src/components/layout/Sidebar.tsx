import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  Users,
  Wallet,
  CalendarRange,
  ClipboardList,
  Wrench,
  Boxes,
  MessagesSquare,
  Receipt,
  Settings,
  ChevronLeft,
  Calculator,
} from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  roles?: string[]
}

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/admin/condominios', icon: Building2, label: 'Condominios' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/cobros', icon: Receipt, label: 'Cuentas de cobro' },
  { to: '/admin/contabilidad', icon: Calculator, label: 'Contabilidad' },
  { to: '/admin/inventario', icon: Boxes, label: 'Inventario' },
  { to: '/admin/mantenimiento', icon: Wrench, label: 'Mantenimiento' },
  { to: '/admin/asambleas', icon: CalendarRange, label: 'Asambleas' },
  { to: '/admin/comunidad', icon: MessagesSquare, label: 'Comunidad' },
  { to: '/admin/solicitudes', icon: ClipboardList, label: 'Solicitudes' },
  { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation()
  return (
    <aside
      className={cn(
        'sticky top-0 h-screen border-r border-ink-100 bg-white transition-all duration-300 ease-out hidden lg:flex flex-col',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-ink-100">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div key="icon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BrandLogo variant="icon" className="h-8" />
            </motion.div>
          ) : (
            <motion.div key="name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <BrandLogo variant="name" className="h-8" />
            </motion.div>
          )}
        </AnimatePresence>
        {onToggle && (
          <button
            onClick={onToggle}
            className="rounded-lg p-1.5 text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Colapsar menú"
          >
            <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {ADMIN_NAV.map(item => {
          const Icon = item.icon
          const active = location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn('nav-item', active && 'active')}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-ink-100 p-3">
        <NavLink to="/perfil" className="nav-item" title={collapsed ? 'Mi perfil' : undefined}>
          <Wallet className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Mi perfil</span>}
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar

import { Outlet, NavLink } from 'react-router-dom'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { Avatar } from '@/components/ui/Avatar'
import { BottomNav } from './BottomNav'
import { PageTransition } from '@/components/ui/PageTransition'
import { useAuthStore } from '@/store/authStore'
import { Bell, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function PortalLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top bar (web desktop) */}
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 md:px-6 py-3">
          <NavLink to="/portal/dashboard" className="flex items-center">
            <BrandLogo variant="name" className="h-8" />
          </NavLink>
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { to: '/portal/dashboard', label: 'Inicio' },
              { to: '/portal/pagos', label: 'Pagos' },
              { to: '/portal/asambleas', label: 'Asambleas' },
              { to: '/portal/comunidad', label: 'Comunidad' },
              { to: '/portal/solicitudes', label: 'PQRS' },
            ].map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-blue-light text-brand-blue'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <NavLink
              to="/portal/perfil"
              className="hidden md:flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-ink-100 transition-colors"
            >
              <Avatar name={user?.full_name || user?.email} src={user?.photo_url} size="sm" />
              <span className="text-sm font-medium text-ink-700">
                {user?.full_name?.split(' ')[0] || user?.email}
              </span>
            </NavLink>
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="rounded-xl p-2 text-ink-500 hover:bg-brand-red-light hover:text-brand-red transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 md:px-6 py-6 pb-24 lg:pb-10">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <BottomNav />
    </div>
  )
}

export default PortalLayout

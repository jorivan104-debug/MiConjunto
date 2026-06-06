import { Bell, Search, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function AdminTopBar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink-100 bg-white/85 backdrop-blur-md px-4 md:px-6 py-3">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Buscar en Mi Conjunto..."
            className="h-10 w-full rounded-xl border border-ink-100 bg-ink-50 pl-9 pr-4 text-sm placeholder:text-ink-400 focus:outline-none focus:border-brand-blue focus:bg-white transition-colors"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900 transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate('/perfil')}
          className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 hover:bg-ink-100 transition-colors"
        >
          <Avatar name={user?.full_name || user?.email} src={user?.photo_url} size="sm" />
          <span className="text-sm font-medium text-ink-700 hidden md:inline">
            {user?.full_name || user?.email}
          </span>
        </button>
        <button
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="rounded-xl p-2.5 text-ink-500 hover:bg-brand-red-light hover:text-brand-red transition-colors"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

export default AdminTopBar

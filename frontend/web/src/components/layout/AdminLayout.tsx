import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AdminTopBar } from './AdminTopBar'
import { PageTransition } from '@/components/ui/PageTransition'

export function AdminLayout() {
  const [collapsed, setCollapsed] = React.useState(false)
  return (
    <div className="min-h-screen bg-ink-50 flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <AdminTopBar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

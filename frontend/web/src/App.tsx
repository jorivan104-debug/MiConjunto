import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { useAuthStore } from '@/store/authStore'
import { SplashScreen } from '@/components/ui/SplashScreen'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { PortalLayout } from '@/components/layout/PortalLayout'

import LoginPage from '@/pages/LoginPage'
import TwoFactorPage from '@/pages/TwoFactorPage'
import PasswordChangePage from '@/pages/PasswordChangePage'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import CondominiumsPage from '@/pages/admin/CondominiumsPage'
import UsersManagementPage from '@/pages/admin/UsersManagementPage'
import BillingPage from '@/pages/admin/BillingPage'
import AccountingPage from '@/pages/admin/AccountingPage'
import InventoryPage from '@/pages/admin/InventoryPage'
import MaintenancePage from '@/pages/admin/MaintenancePage'
import AssembliesPage from '@/pages/admin/AssembliesPage'
import ForumAdminPage from '@/pages/admin/ForumAdminPage'
import RequestsAdminPage from '@/pages/admin/RequestsAdminPage'
import SettingsPage from '@/pages/admin/SettingsPage'

import PortalDashboard from '@/pages/portal/PortalDashboard'
import PortalPayments from '@/pages/portal/PortalPayments'
import PortalAssemblies from '@/pages/portal/PortalAssemblies'
import PortalCommunity from '@/pages/portal/PortalCommunity'
import PortalRequests from '@/pages/portal/PortalRequests'
import PortalProfile from '@/pages/portal/PortalProfile'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, initialChecked } = useAuthStore()
  if (!initialChecked) return <SplashScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.needs_password_change || user?.must_change_password) {
    return <Navigate to="/cambiar-contrasena" replace />
  }
  return <>{children}</>
}

function RoleRedirect() {
  const { isAdmin, isResident, user } = useAuthStore()
  if (isAdmin()) return <Navigate to="/admin/dashboard" replace />
  if (isResident()) return <Navigate to="/portal/dashboard" replace />
  if (user) return <Navigate to="/portal/dashboard" replace />
  return <Navigate to="/login" replace />
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/2fa" element={<TwoFactorPage />} />
        <Route path="/cambiar-contrasena" element={<PasswordChangePage />} />

        <Route
          path="/admin/*"
          element={
            <PrivateRoute>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="condominios" element={<CondominiumsPage />} />
          <Route path="usuarios" element={<UsersManagementPage />} />
          <Route path="cobros" element={<BillingPage />} />
          <Route path="contabilidad" element={<AccountingPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="mantenimiento" element={<MaintenancePage />} />
          <Route path="asambleas" element={<AssembliesPage />} />
          <Route path="comunidad" element={<ForumAdminPage />} />
          <Route path="solicitudes" element={<RequestsAdminPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>

        <Route
          path="/portal/*"
          element={
            <PrivateRoute>
              <PortalLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PortalDashboard />} />
          <Route path="pagos" element={<PortalPayments />} />
          <Route path="asambleas" element={<PortalAssemblies />} />
          <Route path="comunidad" element={<PortalCommunity />} />
          <Route path="solicitudes" element={<PortalRequests />} />
          <Route path="perfil" element={<PortalProfile />} />
        </Route>

        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <PortalLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<PortalProfile />} />
        </Route>

        <Route path="/" element={<RoleRedirect />} />
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  const { checkAuth, initialChecked } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (!initialChecked) return <SplashScreen />

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App

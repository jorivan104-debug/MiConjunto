import { create } from 'zustand'
import api from '@/services/api'

export interface Role {
  id: number
  name: string
  description: string | null
}

export interface CondominiumRef {
  id: number
  name: string
  property_ids?: number[] | null
}

export interface AuthUser {
  id: number
  username?: string | null
  email: string
  full_name: string | null
  photo_url: string | null
  is_active: boolean
  must_change_password?: boolean
  totp_enabled?: boolean
  needs_password_change?: boolean
  roles?: Role[]
  condominiums?: CondominiumRef[]
}

export interface LoginResult {
  ok: boolean
  needs_password_change?: boolean
  requires_2fa?: boolean
  pre_auth_token?: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  initialChecked: boolean
  isSuperAdmin: () => boolean
  isAdmin: () => boolean
  isResident: () => boolean
  getPropertyIdsForCondominium: (id: number) => number[] | null
  login: (identifier: string, password: string) => Promise<LoginResult>
  verify2fa: (preAuthToken: string, code: string) => Promise<LoginResult>
  logout: () => void
  refreshMe: () => Promise<void>
  checkAuth: () => Promise<void>
}

async function fetchMe(): Promise<AuthUser> {
  const res = await api.get('/auth/me')
  const u = res.data
  return {
    ...u,
    roles: u.roles || [],
    condominiums: u.condominiums || [],
    photo_url: u.photo_url || null,
    needs_password_change: !!(u.needs_password_change ?? u.must_change_password),
  }
}

function persistTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('selectedCondominiumId')
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  initialChecked: false,

  isSuperAdmin: () => !!get().user?.roles?.some(r => r.name === 'super_admin'),
  isAdmin: () =>
    !!get().user?.roles?.some(r => r.name === 'super_admin' || r.name === 'admin'),
  isResident: () =>
    !!get().user?.roles?.some(r => r.name === 'titular' || r.name === 'residente'),

  getPropertyIdsForCondominium: (condominiumId: number) => {
    const u = get().user
    if (!u?.condominiums) return null
    const c = u.condominiums.find(x => x.id === condominiumId)
    if (!c) return null
    return c.property_ids ?? null
  },

  login: async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password: password || '' })
      const { access_token, refresh_token, requires_2fa, pre_auth_token, needs_password_change } = res.data
      if (requires_2fa && pre_auth_token) {
        return { ok: false, requires_2fa: true, pre_auth_token, needs_password_change }
      }
      if (!access_token || !refresh_token) {
        throw new Error('Sin tokens de la API')
      }
      persistTokens(access_token, refresh_token)
      const me = await fetchMe()
      const userData: AuthUser = {
        ...me,
        needs_password_change: !!needs_password_change || !!me.must_change_password,
      }
      set({ user: userData, isAuthenticated: true, initialChecked: true })
      if (userData.condominiums && userData.condominiums.length === 1) {
        localStorage.setItem('selectedCondominiumId', String(userData.condominiums[0].id))
      }
      return { ok: true, needs_password_change: userData.needs_password_change }
    } catch (e: unknown) {
      clearTokens()
      throw e
    }
  },

  verify2fa: async (preAuthToken, code) => {
    const res = await api.post('/auth/verify-2fa', { pre_auth_token: preAuthToken, code })
    const { access_token, refresh_token, needs_password_change } = res.data
    persistTokens(access_token, refresh_token)
    const me = await fetchMe()
    const userData: AuthUser = {
      ...me,
      needs_password_change: !!needs_password_change || !!me.must_change_password,
    }
    set({ user: userData, isAuthenticated: true, initialChecked: true })
    if (userData.condominiums && userData.condominiums.length === 1) {
      localStorage.setItem('selectedCondominiumId', String(userData.condominiums[0].id))
    }
    return { ok: true, needs_password_change: userData.needs_password_change }
  },

  logout: () => {
    clearTokens()
    set({ user: null, isAuthenticated: false, initialChecked: true })
  },

  refreshMe: async () => {
    try {
      const me = await fetchMe()
      set({ user: me, isAuthenticated: true })
    } catch {
      // ignore
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ user: null, isAuthenticated: false, initialChecked: true })
      return
    }
    try {
      const me = await fetchMe()
      set({ user: me, isAuthenticated: true, initialChecked: true })
      if (me.condominiums && me.condominiums.length === 1) {
        localStorage.setItem('selectedCondominiumId', String(me.condominiums[0].id))
      }
    } catch {
      clearTokens()
      set({ user: null, isAuthenticated: false, initialChecked: true })
    }
  },
}))

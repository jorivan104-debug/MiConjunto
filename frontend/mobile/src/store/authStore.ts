import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'

export interface AuthUser {
  id: number
  username?: string | null
  email: string
  full_name: string | null
  photo_url: string | null
  totp_enabled?: boolean
  must_change_password?: boolean
  needs_password_change?: boolean
  roles?: { id: number; name: string }[]
  condominiums?: { id: number; name: string; property_ids?: number[] | null }[]
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
  initialized: boolean
  preAuthToken: string | null
  login: (identifier: string, password: string) => Promise<LoginResult>
  verify2fa: (code: string) => Promise<LoginResult>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshMe: () => Promise<void>
}

async function fetchMe(): Promise<AuthUser> {
  const res = await api.get('/auth/me')
  const u = res.data
  return {
    ...u,
    needs_password_change: !!(u.needs_password_change ?? u.must_change_password),
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  initialized: false,
  preAuthToken: null,

  login: async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password: password || '' })
    const { access_token, refresh_token, requires_2fa, pre_auth_token, needs_password_change } = res.data
    if (requires_2fa && pre_auth_token) {
      set({ preAuthToken: pre_auth_token })
      return { ok: false, requires_2fa: true, pre_auth_token, needs_password_change }
    }
    await AsyncStorage.multiSet([
      ['access_token', access_token],
      ['refresh_token', refresh_token],
    ])
    const me = await fetchMe()
    set({
      user: { ...me, needs_password_change: !!needs_password_change || !!me.must_change_password },
      isAuthenticated: true,
      initialized: true,
      preAuthToken: null,
    })
    return { ok: true, needs_password_change: !!needs_password_change || !!me.must_change_password }
  },

  verify2fa: async code => {
    const preAuth = get().preAuthToken
    if (!preAuth) throw new Error('No hay sesión 2FA pendiente')
    const res = await api.post('/auth/verify-2fa', { pre_auth_token: preAuth, code })
    const { access_token, refresh_token, needs_password_change } = res.data
    await AsyncStorage.multiSet([
      ['access_token', access_token],
      ['refresh_token', refresh_token],
    ])
    const me = await fetchMe()
    set({
      user: { ...me, needs_password_change: !!needs_password_change || !!me.must_change_password },
      isAuthenticated: true,
      initialized: true,
      preAuthToken: null,
    })
    return { ok: true, needs_password_change: !!needs_password_change || !!me.must_change_password }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
    set({ user: null, isAuthenticated: false, preAuthToken: null, initialized: true })
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
    const token = await AsyncStorage.getItem('access_token')
    if (!token) {
      set({ user: null, isAuthenticated: false, initialized: true })
      return
    }
    try {
      const me = await fetchMe()
      set({ user: me, isAuthenticated: true, initialized: true })
    } catch {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
      set({ user: null, isAuthenticated: false, initialized: true })
    }
  },
}))

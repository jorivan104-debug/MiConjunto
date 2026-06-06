import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete (config.headers as Record<string, string>)['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/verify-2fa')
    ) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          originalRequest._retry = true
          const r = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
          const { access_token, refresh_token: new_refresh } = r.data
          localStorage.setItem('access_token', access_token)
          if (new_refresh) localStorage.setItem('refresh_token', new_refresh)
          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${access_token}`
          }
          return api(originalRequest)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('selectedCondominiumId')
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api

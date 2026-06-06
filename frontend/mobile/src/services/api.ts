import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) || 'http://10.0.2.2:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('access_token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/verify-2fa')
    ) {
      const refresh = await AsyncStorage.getItem('refresh_token')
      if (refresh) {
        try {
          originalRequest._retry = true
          const r = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refresh,
          })
          await AsyncStorage.setItem('access_token', r.data.access_token)
          if (r.data.refresh_token) {
            await AsyncStorage.setItem('refresh_token', r.data.refresh_token)
          }
          originalRequest.headers.Authorization = `Bearer ${r.data.access_token}`
          return api(originalRequest)
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token'])
        }
      }
    }
    return Promise.reject(error)
  },
)

export default api

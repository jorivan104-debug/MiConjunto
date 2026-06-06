import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootNavigator from './src/navigation/RootNavigator'
import { useAuthStore } from './src/store/authStore'

export default function App() {
  const { checkAuth } = useAuthStore()
  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  )
}

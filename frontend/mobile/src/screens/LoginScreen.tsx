import React, { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import BrandLogo from '../components/BrandLogo'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'

export default function LoginScreen() {
  const navigation = useNavigation<any>()
  const { login } = useAuthStore()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!identifier) {
      Alert.alert('Atención', 'Ingresa tu usuario o correo')
      return
    }
    setLoading(true)
    try {
      const res = await login(identifier.trim(), password)
      if (res.requires_2fa) {
        navigation.navigate('TwoFactor')
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'No pudimos iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <BrandLogo variant="full" />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Hola de nuevo</Text>
          <Text style={styles.subtitle}>Inicia sesión en tu comunidad</Text>

          <View style={{ marginTop: 16, gap: 12 }}>
            <Input
              label="Usuario o correo"
              placeholder="admin / tu@correo.com"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
            />
            <Input
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={{ marginTop: 20 }}>
            <Button title="Entrar" variant="primary" onPress={handleLogin} loading={loading} fullWidth />
          </View>
        </View>
        <Text style={styles.foot}>Mi Conjunto · Convivencia organizada</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', backgroundColor: colors.bgSubtle, padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.ink100 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink900, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.ink500, textAlign: 'center', marginTop: 4 },
  foot: { textAlign: 'center', color: colors.ink400, fontSize: 11, marginTop: 24 },
})

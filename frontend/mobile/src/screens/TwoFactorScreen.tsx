import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import BrandLogo from '../components/BrandLogo'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'

export default function TwoFactorScreen() {
  const { verify2fa } = useAuthStore()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async () => {
    setLoading(true)
    try {
      await verify2fa(code.trim())
    } catch (err: any) {
      Alert.alert('Verificación fallida', err?.response?.data?.detail || 'Código incorrecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoWrap}>
        <BrandLogo variant="icon" />
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Verificación en dos pasos</Text>
        <Text style={styles.subtitle}>Ingresa el código de tu app autenticadora.</Text>
        <View style={{ marginTop: 16 }}>
          <Input label="Código de 6 dígitos" placeholder="123456" keyboardType="number-pad" value={code} onChangeText={setCode} />
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title="Verificar" variant="primary" onPress={handle} loading={loading} fullWidth />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', backgroundColor: colors.bgSubtle, padding: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.ink100 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink900 },
  subtitle: { fontSize: 13, color: colors.ink500, marginTop: 4 },
})

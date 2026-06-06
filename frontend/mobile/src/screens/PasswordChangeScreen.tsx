import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import api from '../services/api'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'

export default function PasswordChangeScreen() {
  const { user, refreshMe } = useAuthStore()
  const isFirst = !!(user?.must_change_password || user?.needs_password_change)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (next.length < 8) {
      Alert.alert('Atención', 'La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (next !== confirm) {
      Alert.alert('Atención', 'Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        current_password: isFirst ? undefined : current,
        new_password: next,
      })
      await refreshMe()
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'No pudimos cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{isFirst ? 'Crea tu contraseña' : 'Cambiar contraseña'}</Text>
        <Text style={styles.subtitle}>{isFirst ? 'Por seguridad, define una nueva contraseña.' : 'Cambia tu contraseña actual.'}</Text>
        <View style={{ marginTop: 16, gap: 12 }}>
          {!isFirst && <Input label="Contraseña actual" secureTextEntry value={current} onChangeText={setCurrent} />}
          <Input label="Nueva contraseña" hint="Mínimo 8 caracteres." secureTextEntry value={next} onChangeText={setNext} />
          <Input label="Confirmar contraseña" secureTextEntry value={confirm} onChangeText={setConfirm} />
        </View>
        <View style={{ marginTop: 20 }}>
          <Button title="Guardar" variant="primary" onPress={submit} loading={loading} fullWidth />
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', backgroundColor: colors.bgSubtle, padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.ink100 },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink900 },
  subtitle: { fontSize: 13, color: colors.ink500, marginTop: 4 },
})

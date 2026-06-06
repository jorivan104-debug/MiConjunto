import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'

export default function RequestsScreen() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!condoId) return
    if (!title || !body) {
      Alert.alert('Atención', 'Completa título y mensaje')
      return
    }
    setLoading(true)
    try {
      await api.post('/forum/posts', {
        condominium_id: condoId,
        title,
        body,
        is_anonymous: anonymous,
      })
      Alert.alert('Solicitud enviada', 'Te avisaremos cuando haya respuesta.')
      setTitle('')
      setBody('')
      setAnonymous(false)
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'No pudimos enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Solicitudes (PQRS)</Text>
        <Text style={styles.subtitle}>Envía una petición, queja, reclamo o sugerencia.</Text>

        <Card style={{ marginTop: 16, gap: 12 }}>
          <Input label="Título" value={title} onChangeText={setTitle} />
          <Input
            label="Mensaje"
            value={body}
            onChangeText={setBody}
            multiline
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
          <View style={styles.row}>
            <Text style={{ flex: 1, color: colors.ink700 }}>Enviar de forma anónima</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: colors.ink200, true: colors.blueLight }}
              thumbColor={anonymous ? colors.blue : colors.ink400}
            />
          </View>
          <Button title="Enviar solicitud" variant="primary" onPress={submit} loading={loading} fullWidth />
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink900 },
  subtitle: { fontSize: 13, color: colors.ink500, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
})

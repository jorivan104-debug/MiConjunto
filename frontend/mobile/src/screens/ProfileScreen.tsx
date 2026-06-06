import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>Datos personales y seguridad.</Text>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.name}>{user?.full_name || 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.username && <Text style={styles.username}>@{user.username}</Text>}
          <View style={styles.roles}>
            {user?.roles?.map(r => (
              <Badge key={r.id} tone="info" label={r.name} />
            ))}
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Doble autenticación</Text>
            <Badge tone={user?.totp_enabled ? 'success' : 'neutral'} label={user?.totp_enabled ? 'Activa' : 'Desactivada'} />
          </View>
          <Text style={styles.note}>
            Activa el 2FA desde la versión web para una capa extra de seguridad. Próximamente desde la app.
          </Text>
        </Card>

        <View style={{ marginTop: 16 }}>
          <Button title="Cerrar sesión" variant="danger" onPress={logout} fullWidth />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink900 },
  subtitle: { fontSize: 13, color: colors.ink500, marginTop: 4 },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink900 },
  email: { fontSize: 13, color: colors.ink500, marginTop: 2 },
  username: { fontSize: 12, color: colors.ink400, marginTop: 2 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.ink900, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: colors.ink700 },
  note: { fontSize: 11, color: colors.ink500, marginTop: 8 },
})

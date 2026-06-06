import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Card from '../components/Card'
import Badge from '../components/Badge'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'
import { formatCurrency, formatDate } from '../utils/format'

export default function DashboardScreen() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const propertyIds = user?.condominiums?.[0]?.property_ids || []
  const [loading, setLoading] = useState(true)
  const [billings, setBillings] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [assemblies, setAssemblies] = useState<any[]>([])

  useEffect(() => {
    if (!condoId) {
      setLoading(false)
      return
    }
    Promise.allSettled([
      api.get(`/billing/condominium/${condoId}`),
      api.get(`/forum/condominium/${condoId}/posts`),
      api.get(`/assemblies/condominium/${condoId}`),
    ]).then(([b, p, a]) => {
      if (b.status === 'fulfilled') {
        const own = (b.value.data || []).filter((x: any) =>
          propertyIds.length === 0 ? true : propertyIds.includes(x.property_id),
        )
        setBillings(own)
      }
      if (p.status === 'fulfilled') setPosts((p.value.data || []).slice(0, 3))
      if (a.status === 'fulfilled') setAssemblies((a.value.data || []).slice(0, 2))
      setLoading(false)
    })
  }, [condoId])

  const pending = billings.filter(b => ['pending', 'partial', 'overdue'].includes(b.status))
  const totalPending = pending.reduce((a, b) => a + (b.balance || 0), 0)
  const hasOverdue = billings.some(b => b.status === 'overdue')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.greeting}>Hola{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋</Text>
        <Text style={styles.subtitle}>Esto es lo que pasa en tu comunidad hoy.</Text>

        <Card tone={hasOverdue ? 'red' : totalPending > 0 ? 'blue' : 'green'} style={{ marginTop: 16 }}>
          <Text style={styles.kpiLabel}>
            {hasOverdue ? 'Tienes pagos vencidos' : totalPending > 0 ? 'Pagos pendientes' : 'Estás al día'}
          </Text>
          <Text style={styles.kpiValue}>{formatCurrency(totalPending)}</Text>
          {loading ? (
            <ActivityIndicator color={colors.blue} style={{ marginTop: 8 }} />
          ) : (
            pending.slice(0, 3).map(b => (
              <View key={b.id} style={styles.row}>
                <View>
                  <Text style={styles.rowTitle}>{b.document_number}</Text>
                  <Text style={styles.rowSub}>Vence {formatDate(b.due_date)}</Text>
                </View>
                <Badge
                  tone={b.status === 'overdue' ? 'danger' : b.status === 'partial' ? 'warning' : 'info'}
                  label={b.status}
                />
              </View>
            ))
          )}
        </Card>

        <Card tone="yellow" style={{ marginTop: 12 }}>
          <Text style={styles.cardHeader}>Anuncios y eventos</Text>
          {loading ? <ActivityIndicator color={colors.yellow} /> : posts.length === 0 ? (
            <Text style={styles.empty}>Aún no hay publicaciones.</Text>
          ) : (
            posts.map(p => (
              <View key={p.id} style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={1}>{p.title}</Text>
              </View>
            ))
          )}
        </Card>

        <Card tone="blue" style={{ marginTop: 12, marginBottom: 24 }}>
          <Text style={styles.cardHeader}>Próximas asambleas</Text>
          {loading ? <ActivityIndicator color={colors.blue} /> : assemblies.length === 0 ? (
            <Text style={styles.empty}>No hay asambleas programadas.</Text>
          ) : (
            assemblies.map(a => (
              <View key={a.id} style={styles.row}>
                <View>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowSub}>{formatDate(a.scheduled_date)}</Text>
                </View>
                <Badge tone="info" label={a.status} />
              </View>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  scroll: { padding: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.ink900 },
  subtitle: { fontSize: 13, color: colors.ink500, marginTop: 4 },
  kpiLabel: { fontSize: 12, fontWeight: '600', color: colors.ink600, textTransform: 'uppercase' },
  kpiValue: { fontSize: 26, fontWeight: '700', color: colors.ink900, marginTop: 8 },
  cardHeader: { fontSize: 14, fontWeight: '600', color: colors.ink900, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowTitle: { fontSize: 13, fontWeight: '600', color: colors.ink900 },
  rowSub: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  empty: { fontSize: 13, color: colors.ink500 },
})

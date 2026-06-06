import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Card from '../components/Card'
import Badge from '../components/Badge'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'
import { formatCurrency, formatDate } from '../utils/format'

export default function PaymentsScreen() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const propertyIds = user?.condominiums?.[0]?.property_ids || []
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState<any[]>([])

  useEffect(() => {
    if (!condoId) return
    api
      .get(`/billing/condominium/${condoId}`)
      .then(r => {
        const own = (r.data || []).filter((x: any) =>
          propertyIds.length === 0 ? true : propertyIds.includes(x.property_id),
        )
        setDocs(own)
      })
      .finally(() => setLoading(false))
  }, [condoId])

  const totalPending = docs
    .filter(d => d.status !== 'paid' && d.status !== 'cancelled')
    .reduce((a, b) => a + (b.balance || 0), 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Pagos</Text>
        <Text style={styles.subtitle}>Historial y estado de tus cuentas.</Text>

        <Card tone={totalPending > 0 ? 'blue' : 'green'} style={{ marginTop: 16 }}>
          <Text style={styles.kpiLabel}>Saldo total pendiente</Text>
          <Text style={styles.kpiValue}>{formatCurrency(totalPending)}</Text>
        </Card>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.blue} />
        ) : docs.length === 0 ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={styles.empty}>No hay cuentas asociadas a tu unidad.</Text>
          </Card>
        ) : (
          docs.map(d => (
            <Card key={d.id} style={{ marginTop: 12 }}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{d.document_number}</Text>
                  <Text style={styles.itemSub}>
                    Período {String(d.period_month).padStart(2, '0')}/{d.period_year} · vence {formatDate(d.due_date)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amount}>{formatCurrency(d.balance ?? d.total)}</Text>
                  <Badge
                    tone={
                      d.status === 'paid'
                        ? 'success'
                        : d.status === 'overdue'
                          ? 'danger'
                          : d.status === 'partial'
                            ? 'warning'
                            : 'info'
                    }
                    label={d.status}
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgSubtle },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink900 },
  subtitle: { fontSize: 13, color: colors.ink500, marginTop: 4 },
  kpiLabel: { fontSize: 12, fontWeight: '600', color: colors.ink600, textTransform: 'uppercase' },
  kpiValue: { fontSize: 28, fontWeight: '700', color: colors.ink900, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: colors.ink900 },
  itemSub: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.ink900, marginBottom: 4 },
  empty: { fontSize: 13, color: colors.ink500 },
})

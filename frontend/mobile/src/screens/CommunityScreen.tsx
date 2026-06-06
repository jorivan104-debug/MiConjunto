import React, { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Card from '../components/Card'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'
import { formatDate } from '../utils/format'

export default function CommunityScreen() {
  const { user } = useAuthStore()
  const condoId = user?.condominiums?.[0]?.id
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<any[]>([])

  useEffect(() => {
    if (!condoId) return
    api.get(`/forum/condominium/${condoId}/posts`).then(r => setPosts(r.data || [])).finally(() => setLoading(false))
  }, [condoId])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Comunidad</Text>
        <Text style={styles.subtitle}>Anuncios, eventos y conversaciones.</Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color={colors.blue} />
        ) : posts.length === 0 ? (
          <Card style={{ marginTop: 16 }}>
            <Text style={styles.empty}>Aún no hay publicaciones.</Text>
          </Card>
        ) : (
          posts.map(p => (
            <Card key={p.id} style={{ marginTop: 12 }}>
              <Text style={styles.postTitle}>{p.title}</Text>
              <Text style={styles.postMeta}>{formatDate(p.created_at)}</Text>
              <Text style={styles.postBody} numberOfLines={4}>{p.body}</Text>
              <View style={styles.foot}>
                <Text style={styles.footItem}>♥ {p.likes_count || 0}</Text>
                <Text style={styles.footItem}>💬 {p.replies_count || 0}</Text>
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
  postTitle: { fontSize: 14, fontWeight: '600', color: colors.ink900 },
  postMeta: { fontSize: 11, color: colors.ink500, marginTop: 2 },
  postBody: { fontSize: 13, color: colors.ink700, marginTop: 8, lineHeight: 18 },
  foot: { flexDirection: 'row', gap: 12, marginTop: 10 },
  footItem: { fontSize: 12, color: colors.ink500 },
  empty: { fontSize: 13, color: colors.ink500 },
})

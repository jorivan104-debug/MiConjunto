import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, radii } from '../theme/tokens'

type Tone = 'success' | 'info' | 'danger' | 'warning' | 'neutral'

const MAP: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.greenLight, fg: colors.green },
  info: { bg: colors.blueLight, fg: colors.blue },
  danger: { bg: colors.redLight, fg: colors.red },
  warning: { bg: colors.yellowLight, fg: '#8a6300' },
  neutral: { bg: colors.ink100, fg: colors.ink600 },
}

export default function Badge({ tone = 'neutral', label }: { tone?: Tone; label: string }) {
  const t = MAP[tone]
  return (
    <View style={[styles.wrap, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '600' },
})

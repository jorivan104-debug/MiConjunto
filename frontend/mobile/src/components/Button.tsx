import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native'
import { colors, radii } from '../theme/tokens'

type Variant = 'primary' | 'secondary' | 'danger' | 'community' | 'ghost' | 'outline'

interface Props extends TouchableOpacityProps {
  title: string
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

const TONE: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.green, fg: colors.white },
  secondary: { bg: colors.blue, fg: colors.white },
  danger: { bg: colors.red, fg: colors.white },
  community: { bg: colors.yellow, fg: colors.ink900 },
  ghost: { bg: 'transparent', fg: colors.ink700 },
  outline: { bg: 'transparent', fg: colors.ink700, border: colors.ink200 },
}

export default function Button({ title, variant = 'primary', loading, fullWidth, style, disabled, ...rest }: Props) {
  const t = TONE[variant]
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.base,
        { backgroundColor: t.bg, borderColor: t.border || 'transparent', borderWidth: t.border ? 1 : 0 },
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.6 },
        style,
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={t.fg} /> : <Text style={[styles.text, { color: t.fg }]}>{title}</Text>}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 15, fontWeight: '600' },
})

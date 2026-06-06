import React from 'react'
import { StyleSheet, View, ViewProps } from 'react-native'
import { colors, radii } from '../theme/tokens'

type Tone = 'default' | 'green' | 'blue' | 'red' | 'yellow'

const TONE_BG: Record<Tone, string> = {
  default: colors.white,
  green: colors.greenLight,
  blue: colors.blueLight,
  red: colors.redLight,
  yellow: colors.yellowLight,
}

interface Props extends ViewProps {
  tone?: Tone
}

export default function Card({ tone = 'default', style, children, ...rest }: Props) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: TONE_BG[tone], borderColor: tone === 'default' ? colors.ink100 : 'transparent' },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xl,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
})

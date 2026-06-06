import React, { useState } from 'react'
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native'
import { colors, radii } from '../theme/tokens'

interface Props extends TextInputProps {
  label?: string
  hint?: string
  error?: string
}

export default function Input({ label, hint, error, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ width: '100%' }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.ink400}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          {
            borderColor: error ? colors.red : focused ? colors.blue : colors.ink200,
          },
          style,
        ]}
        {...rest}
      />
      {(hint || error) && <Text style={[styles.hint, error ? { color: colors.red } : null]}>{error || hint}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '500', color: colors.ink700, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.ink900,
    minHeight: 48,
  },
  hint: { fontSize: 11, color: colors.ink500, marginTop: 4 },
})

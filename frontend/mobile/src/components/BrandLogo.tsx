import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native'

type Variant = 'full' | 'icon'

const SOURCES: Record<Variant, ImageSourcePropType> = {
  full: require('../../assets/splash.png'),
  icon: require('../../assets/icon.png'),
}

const SIZES: Record<Variant, { width: number; height: number }> = {
  full: { width: 220, height: 220 },
  icon: { width: 56, height: 56 },
}

export default function BrandLogo({ variant = 'icon' }: { variant?: Variant }) {
  return (
    <View style={styles.wrap}>
      <Image
        source={SOURCES[variant]}
        style={[SIZES[variant], styles.img]}
        resizeMode="contain"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  img: {},
})

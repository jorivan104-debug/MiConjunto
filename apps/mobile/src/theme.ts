// Tokens para la app móvil (React Native / Expo), iguales a los de la web.
export const colors = {
  green: '#39A935', green700: '#1F7C3A', greenLight: '#EAF7E8',
  blue: '#1F66D1', blueLight: '#EAF2FD',
  red: '#FF4040', red700: '#D92B2B', redLight: '#FFE9E9',
  yellow: '#F4B400', yellow800: '#8A6300', yellowLight: '#FFF4D6',
  navy: '#01234C', white: '#FFFFFF',
  bg: '#FFFFFF', bgSubtle: '#F8FAFC', bgMuted: '#F1F5F9',
  ink900: '#0F172A', ink800: '#1E293B', ink700: '#334155', ink600: '#475569',
  ink500: '#64748B', ink400: '#94A3B8', ink300: '#CBD5E1', ink200: '#E2E8F0', ink100: '#F1F5F9',
}
export const radii = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 }
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }
export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.navy },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.ink900 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.ink900 },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.ink700 },
  label: { fontSize: 12, fontWeight: '500' as const, color: colors.ink600 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.ink500 },
}
export const motion = { fast: 150, base: 220, slow: 320 }

// Mi Conjunto — Design tokens (mobile)
// Mismos colores y radios que el sistema web.

export const colors = {
  // Brand
  green: '#39A935',
  blue: '#1F66D1',
  red: '#FF4040',
  yellow: '#F4B400',
  white: '#FFFFFF',
  greenLight: '#EAF7E8',
  blueLight: '#EAF2FD',
  redLight: '#FFE9E9',
  yellowLight: '#FFF4D6',
  // Surfaces & ink
  bg: '#FFFFFF',
  bgSubtle: '#F8FAFC',
  bgMuted: '#F1F5F9',
  ink900: '#0F172A',
  ink800: '#1E293B',
  ink700: '#334155',
  ink600: '#475569',
  ink500: '#64748B',
  ink400: '#94A3B8',
  ink300: '#CBD5E1',
  ink200: '#E2E8F0',
  ink100: '#F1F5F9',
}

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, color: colors.ink900 },
  h2: { fontSize: 22, fontWeight: '600' as const, color: colors.ink900 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.ink900 },
  body: { fontSize: 14, fontWeight: '400' as const, color: colors.ink700 },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.ink500 },
  label: { fontSize: 12, fontWeight: '500' as const, color: colors.ink600 },
}

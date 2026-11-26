import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from './theme';

export function Boton({ titulo, onPress, variante = 'primary', cargando, estilo }: { titulo: string; onPress: () => void; variante?: 'primary' | 'secondary' | 'outline'; cargando?: boolean; estilo?: ViewStyle }) {
  const fondo = variante === 'primary' ? colors.green700 : variante === 'secondary' ? colors.blue : colors.white;
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      style={({ pressed }) => [s.boton, { backgroundColor: fondo, transform: [{ scale: pressed ? 0.97 : 1 }] }, variante === 'outline' && s.botonBorde, estilo]}
      accessibilityRole="button"
    >
      {cargando ? <ActivityIndicator color={variante === 'outline' ? colors.ink700 : colors.white} /> : <Text style={[s.botonTexto, variante === 'outline' && { color: colors.ink700 }]}>{titulo}</Text>}
    </Pressable>
  );
}

export function Tarjeta({ children, estilo, onPress }: { children: React.ReactNode; estilo?: ViewStyle; onPress?: () => void }) {
  const contenido = <View style={[s.tarjeta, estilo]}>{children}</View>;
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => ({ transform: [{ translateY: pressed ? -2 : 0 }] })}>{contenido}</Pressable> : contenido;
}

export function Campo({ etiqueta, ...p }: TextInputProps & { etiqueta: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={typography.label}>{etiqueta}</Text>
      <TextInput placeholderTextColor={colors.ink400} style={s.campo} {...p} />
    </View>
  );
}

const TONOS: Record<string, [string, string, string]> = {
  PENDIENTE: ['Pendiente', colors.blueLight, colors.blue],
  VENCIDO: ['En mora', colors.redLight, colors.red700],
  PAGADO: ['Pagado', colors.greenLight, colors.green700],
  CONFIRMADO: ['Confirmado', colors.greenLight, colors.green700],
  RECHAZADO: ['Rechazado', colors.redLight, colors.red700],
  ANULADO: ['Anulado', colors.bgMuted, colors.ink600],
  RADICADA: ['Radicada', colors.blueLight, colors.blue],
  EN_PROCESO: ['En proceso', colors.yellowLight, colors.yellow800],
  RESUELTA: ['Resuelta', colors.greenLight, colors.green700],
  CERRADA: ['Cerrada', colors.bgMuted, colors.ink600],
  APROBADA: ['Aprobada', colors.greenLight, colors.green700],
  RECHAZADA: ['Rechazada', colors.redLight, colors.red700],
  CANCELADA: ['Cancelada', colors.bgMuted, colors.ink600],
};
export function Estado({ estado }: { estado: string }) {
  const [t, bg, fg] = TONOS[estado] ?? [estado, colors.bgMuted, colors.ink600];
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '500' }}>{t}</Text>
    </View>
  );
}

export const Titulo = ({ children }: { children: React.ReactNode }) => <Text style={[typography.h1, { marginBottom: spacing.md }]}>{children}</Text>;
export const Subtitulo = ({ children }: { children: React.ReactNode }) => <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>{children}</Text>;
export const Cargando = () => <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.blue} />;

export const s = StyleSheet.create({
  boton: { minHeight: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  botonBorde: { borderWidth: 1, borderColor: colors.ink200 },
  botonTexto: { color: colors.white, fontWeight: '600', fontSize: 15 },
  tarjeta: { backgroundColor: colors.white, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.sm + 4, borderWidth: 1, borderColor: colors.ink200, shadowColor: '#0F172A', shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  campo: { marginTop: 6, minHeight: 48, borderRadius: radii.md, borderWidth: 1, borderColor: colors.ink200, paddingHorizontal: 14, fontSize: 15, color: colors.ink900, backgroundColor: colors.white },
  pill: { alignSelf: 'flex-start', borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 4 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});

import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { api, sesion } from './src/api';
import Login from './src/screens/Login';
import { Avisos, Contexto, Inicio, Pagos, Pqrs, Reservas } from './src/screens/Pantallas';
import { colors, spacing } from './src/theme';
import { Boton, Cargando } from './src/ui';

const TABS = [
  { id: 'inicio', texto: 'Inicio', icono: 'home-outline' },
  { id: 'pagos', texto: 'Pagos', icono: 'wallet-outline' },
  { id: 'reservas', texto: 'Reservas', icono: 'calendar-outline' },
  { id: 'pqrs', texto: 'PQRS', icono: 'chatbox-ellipses-outline' },
  { id: 'avisos', texto: 'Avisos', icono: 'megaphone-outline' },
] as const;

export default function App() {
  const [estado, setEstado] = useState<'cargando' | 'fuera' | 'dentro'>('cargando');
  const [ctx, setCtx] = useState<Contexto | null>(null);
  const [aviso, setAviso] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('inicio');

  const entrar = async () => {
    try {
      const p = await api('/auth/perfil');
      if (p.debeCambiarPassword || !p.autorizacionDatos) {
        setAviso('Completa tu primer ingreso (contraseña y autorización de datos) en la versión web y vuelve aquí.');
        setEstado('fuera');
        return;
      }
      const cop = p.copropiedades[0];
      if (!cop) {
        setAviso('Tu cuenta aún no está vinculada a una copropiedad.');
        setEstado('fuera');
        return;
      }
      const unidad = p.unidades.find((u: any) => u.copropiedadId === cop.id);
      setCtx({ copId: cop.id, unidadId: unidad?.id ?? null, unidadNombre: unidad ? `${cop.nombre} · ${unidad.nombre}` : cop.nombre, nombre: p.nombre });
      setEstado('dentro');
    } catch {
      await sesion.cerrar();
      setEstado('fuera');
    }
  };

  useEffect(() => {
    sesion.cargar().then((t) => (t ? entrar() : setEstado('fuera')));
  }, []);

  const salir = async () => {
    await sesion.cerrar();
    setCtx(null);
    setEstado('fuera');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgSubtle }} edges={['top']}>
        {estado === 'cargando' && <Cargando />}
        {estado === 'fuera' && (
          <View style={{ flex: 1 }}>
            {!!aviso && <Text style={{ padding: spacing.md, color: colors.yellow800, backgroundColor: colors.yellowLight }}>{aviso}</Text>}
            <Login alEntrar={() => { setAviso(''); entrar(); }} />
          </View>
        )}
        {estado === 'dentro' && ctx && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.ink200 }}>
              <Image source={require('./assets/name.png')} style={{ width: 140, height: 28 }} resizeMode="contain" />
              <Pressable onPress={salir} accessibilityLabel="Salir"><Ionicons name="log-out-outline" size={22} color={colors.ink600} /></Pressable>
            </View>
            <View style={{ flex: 1 }}>
              {tab === 'inicio' && <Inicio c={ctx} />}
              {tab === 'pagos' && <Pagos c={ctx} />}
              {tab === 'reservas' && <Reservas c={ctx} />}
              {tab === 'pqrs' && <Pqrs c={ctx} />}
              {tab === 'avisos' && <Avisos c={ctx} />}
            </View>
            <SafeAreaView edges={['bottom']} style={{ flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.ink200 }}>
              {TABS.map((t) => {
                const activo = tab === t.id;
                return (
                  <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }} accessibilityRole="tab" accessibilityState={{ selected: activo }}>
                    {activo && <View style={{ position: 'absolute', top: 0, width: 32, height: 3, borderRadius: 2, backgroundColor: colors.blue }} />}
                    <Ionicons name={t.icono as any} size={22} color={activo ? colors.blue : colors.ink500} />
                    <Text style={{ fontSize: 11, marginTop: 2, color: activo ? colors.blue : colors.ink500, fontWeight: '500' }}>{t.texto}</Text>
                  </Pressable>
                );
              })}
            </SafeAreaView>
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

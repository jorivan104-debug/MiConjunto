import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, Text, View } from 'react-native';
import { api, fecha, hora, pesos } from '../api';
import { colors, spacing, typography } from '../theme';
import { Boton, Campo, Cargando, Estado, s, Subtitulo, Tarjeta, Titulo } from '../ui';

export interface Contexto {
  copId: string;
  unidadId: string | null;
  unidadNombre: string;
  nombre: string;
}

function useDatos<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [cargando, setCargando] = useState(false);
  const cargar = useCallback(async () => {
    if (!path) return;
    setCargando(true);
    try {
      setData(await api<T>(path));
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCargando(false);
    }
  }, [path]);
  useEffect(() => {
    cargar();
  }, [cargar]);
  return { data, cargando, cargar };
}

const Pantalla = ({ children, cargando, onRefresh }: { children: React.ReactNode; cargando: boolean; onRefresh: () => void }) => (
  <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={cargando} onRefresh={onRefresh} />}>
    {children}
  </ScrollView>
);

export function Inicio({ c }: { c: Contexto }) {
  const { data: ec, cargando, cargar } = useDatos<any>(c.unidadId ? `/copropiedades/${c.copId}/cobros/estado-cuenta/${c.unidadId}` : null);
  const { data: avisos } = useDatos<any[]>(`/copropiedades/${c.copId}/comunicados`);
  return (
    <Pantalla cargando={cargando} onRefresh={cargar}>
      <Text style={typography.caption}>{c.unidadNombre}</Text>
      <Titulo>Hola, {c.nombre.split(' ')[0]}</Titulo>
      {!c.unidadId ? <Text style={typography.body}>Pide a la administración que te vincule a tu unidad.</Text> : !ec ? <Cargando /> : (
        <Tarjeta estilo={{ backgroundColor: ec.vencido > 0 ? colors.redLight : colors.greenLight, borderColor: 'transparent' }}>
          <Text style={typography.label}>Saldo pendiente</Text>
          <Text style={{ fontSize: 34, fontWeight: '700', color: colors.navy, marginVertical: 4 }}>{pesos(ec.saldo)}</Text>
          <Estado estado={ec.vencido > 0 ? 'VENCIDO' : ec.saldo > 0 ? 'PENDIENTE' : 'PAGADO'} />
        </Tarjeta>
      )}
      <Subtitulo>Avisos recientes</Subtitulo>
      {(avisos ?? []).slice(0, 3).map((a) => (
        <Tarjeta key={a.id}>
          <View style={s.fila}>
            <Text style={[typography.h3, { flex: 1, fontSize: 16 }]}>{a.titulo}</Text>
            {!a.leido && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.yellow }} />}
          </View>
          <Text style={typography.body} numberOfLines={2}>{a.cuerpo}</Text>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

export function Pagos({ c }: { c: Contexto }) {
  const { data: ec, cargando, cargar } = useDatos<any>(c.unidadId ? `/copropiedades/${c.copId}/cobros/estado-cuenta/${c.unidadId}` : null);
  const [pagando, setPagando] = useState(false);
  const pagar = async () => {
    setPagando(true);
    try {
      const r = await api(`/copropiedades/${c.copId}/pagos/checkout/${c.unidadId}`, {});
      await Linking.openURL(r.url);
    } catch (e: any) {
      Alert.alert('Pago en línea', e.message);
    } finally {
      setPagando(false);
    }
  };
  if (!ec) return <Cargando />;
  const pendientes = ec.cargos.filter((x: any) => x.estado === 'PENDIENTE');
  return (
    <Pantalla cargando={cargando} onRefresh={cargar}>
      <Titulo>Estado de cuenta</Titulo>
      <Tarjeta>
        <Text style={typography.label}>Total a pagar</Text>
        <Text style={{ fontSize: 32, fontWeight: '700', color: colors.navy, marginVertical: 4 }}>{pesos(ec.saldo)}</Text>
        {ec.vencido > 0 && <Text style={{ color: colors.red700, marginBottom: spacing.sm }}>Incluye {pesos(ec.vencido)} vencidos</Text>}
        {ec.saldo > 0 && <Boton titulo="Pagar en línea (PSE)" onPress={pagar} cargando={pagando} />}
      </Tarjeta>
      <Subtitulo>Cobros pendientes</Subtitulo>
      {pendientes.length === 0 && <Text style={typography.body}>No tienes cobros pendientes.</Text>}
      {pendientes.map((x: any) => (
        <Tarjeta key={x.id}>
          <View style={s.fila}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.ink900 }}>{x.descripcion}</Text>
              <Text style={typography.caption}>Vence {fecha(x.vencimiento)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontWeight: '700' }}>{pesos(x.saldo)}</Text>
              <Estado estado={new Date(x.vencimiento) < new Date() ? 'VENCIDO' : 'PENDIENTE'} />
            </View>
          </View>
        </Tarjeta>
      ))}
      <Subtitulo>Pagos</Subtitulo>
      {ec.pagos.map((p: any) => (
        <Tarjeta key={p.id}>
          <View style={s.fila}>
            <Text>{fecha(p.fecha)}</Text>
            <Text style={{ fontWeight: '700', color: colors.green700 }}>{pesos(p.valor)}</Text>
            <Estado estado={p.estado} />
          </View>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

export function Reservas({ c }: { c: Contexto }) {
  const { data: zonas } = useDatos<any[]>(`/copropiedades/${c.copId}/reservas/zonas`);
  const { data: reservas, cargando, cargar } = useDatos<any[]>(`/copropiedades/${c.copId}/reservas`);
  const [zona, setZona] = useState<any>(null);
  const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [f, setF] = useState({ dia: manana, desde: '10:00', hasta: '12:00' });
  const reservar = async () => {
    try {
      const r = await api(`/copropiedades/${c.copId}/reservas`, { zonaId: zona.id, unidadId: c.unidadId, inicio: `${f.dia}T${f.desde}:00-05:00`, fin: `${f.dia}T${f.hasta}:00-05:00` });
      Alert.alert('Reservas', r.estado === 'APROBADA' ? '¡Reserva confirmada!' : 'Solicitud enviada a la administración.');
      setZona(null);
      cargar();
    } catch (e: any) {
      Alert.alert('No se pudo reservar', e.message);
    }
  };
  return (
    <Pantalla cargando={cargando} onRefresh={cargar}>
      <Titulo>Reservas</Titulo>
      {zona ? (
        <Tarjeta>
          <Text style={typography.h3}>{zona.nombre}</Text>
          <Text style={[typography.caption, { marginBottom: spacing.md }]}>{zona.horaApertura} a {zona.horaCierre} · máx. {zona.maxHoras} h · {zona.tarifa ? pesos(zona.tarifa) : 'Sin costo'}</Text>
          <Campo etiqueta="Día (AAAA-MM-DD)" value={f.dia} onChangeText={(dia) => setF({ ...f, dia })} />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}><Campo etiqueta="Desde (HH:MM)" value={f.desde} onChangeText={(desde) => setF({ ...f, desde })} /></View>
            <View style={{ flex: 1 }}><Campo etiqueta="Hasta (HH:MM)" value={f.hasta} onChangeText={(hasta) => setF({ ...f, hasta })} /></View>
          </View>
          <Boton titulo={zona.requiereAprobacion ? 'Solicitar reserva' : 'Reservar'} onPress={reservar} />
          <Boton titulo="Volver" variante="outline" onPress={() => setZona(null)} estilo={{ marginTop: spacing.sm }} />
        </Tarjeta>
      ) : (
        (zonas ?? []).filter((z) => z.activa).map((z) => (
          <Tarjeta key={z.id} onPress={() => setZona(z)}>
            <Text style={[typography.h3, { fontSize: 16 }]}>{z.nombre}</Text>
            <Text style={typography.caption}>{z.horaApertura} a {z.horaCierre} · {z.tarifa ? pesos(z.tarifa) : 'Sin costo'}</Text>
          </Tarjeta>
        ))
      )}
      <Subtitulo>Mis reservas</Subtitulo>
      {(reservas ?? []).map((r) => (
        <Tarjeta key={r.id}>
          <View style={s.fila}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>{r.zona}</Text>
              <Text style={typography.caption}>{fecha(r.inicio)} · {hora(r.inicio)} a {hora(r.fin)}</Text>
            </View>
            <Estado estado={r.estado} />
          </View>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

const TIPOS: Record<string, string> = { PETICION: 'Petición', QUEJA: 'Queja', RECLAMO: 'Reclamo', SUGERENCIA: 'Sugerencia', DANO: 'Daño' };

export function Pqrs({ c }: { c: Contexto }) {
  const { data, cargando, cargar } = useDatos<any[]>(`/copropiedades/${c.copId}/pqrs`);
  const [nueva, setNueva] = useState(false);
  const [f, setF] = useState({ tipo: 'PETICION', asunto: '', descripcion: '' });
  const radicar = async () => {
    try {
      const r = await api(`/copropiedades/${c.copId}/pqrs`, { ...f, unidadId: c.unidadId ?? undefined });
      Alert.alert('Solicitud radicada', `Número de radicado: ${r.radicado}`);
      setNueva(false);
      setF({ tipo: 'PETICION', asunto: '', descripcion: '' });
      cargar();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };
  return (
    <Pantalla cargando={cargando} onRefresh={cargar}>
      <Titulo>Mis solicitudes</Titulo>
      {nueva ? (
        <Tarjeta>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md }}>
            {Object.entries(TIPOS).map(([k, v]) => (
              <Text key={k} onPress={() => setF({ ...f, tipo: k })} style={[s.pill, { backgroundColor: f.tipo === k ? colors.blueLight : colors.bgMuted, color: f.tipo === k ? colors.blue : colors.ink600, overflow: 'hidden' }]}>{v}</Text>
            ))}
          </View>
          <Campo etiqueta="Asunto" value={f.asunto} onChangeText={(asunto) => setF({ ...f, asunto })} />
          <Campo etiqueta="Descripción" value={f.descripcion} onChangeText={(descripcion) => setF({ ...f, descripcion })} multiline style={[s.campo, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]} />
          <Boton titulo="Radicar" onPress={radicar} />
          <Boton titulo="Cancelar" variante="outline" onPress={() => setNueva(false)} estilo={{ marginTop: spacing.sm }} />
        </Tarjeta>
      ) : (
        <Boton titulo="Nueva solicitud" variante="secondary" onPress={() => setNueva(true)} estilo={{ marginBottom: spacing.md }} />
      )}
      {(data ?? []).map((p) => (
        <Tarjeta key={p.id}>
          <View style={s.fila}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.navy }}>{p.asunto}</Text>
              <Text style={typography.caption}>#{p.radicado} · {TIPOS[p.tipo]} · {fecha(p.createdAt)}</Text>
              {p.respuesta && <Text style={[typography.body, { marginTop: 6, color: colors.green700 }]}>{p.respuesta}</Text>}
            </View>
            <Estado estado={p.estado} />
          </View>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

export function Avisos({ c }: { c: Contexto }) {
  const { data, cargando, cargar } = useDatos<any[]>(`/copropiedades/${c.copId}/comunicados`);
  const leer = async (id: string) => {
    await api(`/copropiedades/${c.copId}/comunicados/${id}/leido`, {});
    cargar();
  };
  return (
    <Pantalla cargando={cargando} onRefresh={cargar}>
      <Titulo>Avisos</Titulo>
      {(data ?? []).map((a) => (
        <Tarjeta key={a.id} onPress={() => !a.leido && leer(a.id)} estilo={!a.leido ? { borderColor: colors.yellow } : undefined}>
          <Text style={[typography.h3, { fontSize: 16 }]}>{a.titulo}</Text>
          <Text style={[typography.body, { marginTop: 4 }]}>{a.cuerpo}</Text>
          <Text style={[typography.caption, { marginTop: 8 }]}>{fecha(a.createdAt)} · {a.autor}{!a.leido ? ' · toca para marcar como leído' : ''}</Text>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

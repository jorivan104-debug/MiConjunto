import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { api, sesion } from '../api';
import { colors, spacing, typography } from '../theme';
import { Boton, Campo } from '../ui';

export default function Login({ alEntrar }: { alEntrar: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const entrar = async () => {
    setCargando(true);
    setError('');
    try {
      const r = await api<{ token: string }>('/auth/login', { email: email.trim(), password });
      await sesion.guardar(r.token);
      alEntrar();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  };
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.white }}>
      <Image source={require('../../assets/logo.png')} style={{ width: 180, height: 180, alignSelf: 'center' }} resizeMode="contain" />
      <Text style={[typography.h2, { textAlign: 'center', marginBottom: spacing.lg }]}>Bienvenido</Text>
      <Campo etiqueta="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Campo etiqueta="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
      {!!error && <Text style={{ color: colors.red700, marginBottom: spacing.md }}>{error}</Text>}
      <Boton titulo="Ingresar" onPress={entrar} cargando={cargando} />
      <View style={{ height: spacing.xl }} />
    </KeyboardAvoidingView>
  );
}

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  SafeAreaView, StatusBar, Platform, KeyboardAvoidingView, ScrollView,
  StyleSheet,
} from 'react-native';

interface Props {
  onLogin: (email: string, pw: string) => Promise<void>;
  onRegister: (email: string, pw: string) => Promise<void>;
  onGoogle: () => Promise<void>;
}

export default function LoginScreen({ onLogin, onRegister, onGoogle }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    setBusy(true);
    setError('');
    try {
      if (isRegister) {
        await onRegister(email.trim(), password);
      } else {
        await onLogin(email.trim(), password);
      }
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') setError('Credenciales incorrectas');
      else if (code === 'auth/user-not-found') setError('No existe esa cuenta');
      else if (code === 'auth/email-already-in-use') setError('Ese email ya está registrado');
      else if (code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres');
      else if (code === 'auth/invalid-email') setError('Email no válido');
      else setError('Error de autenticación');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Speed Music</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, busy && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#B8C8E0" size="small" />
            ) : (
              <Text style={styles.btnText}>
                {isRegister ? 'Registrarse' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={async () => {
              setBusy(true);
              setError('');
              try { await onGoogle(); } catch { setError('Error al iniciar con Google'); }
              finally { setBusy(false); }
            }}
            disabled={busy}
          >
            <Text style={styles.googleBtnText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(''); }}>
            <Text style={styles.toggle}>
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 14,
    color: '#E8E8E8',
    fontSize: 15,
  },
  btn: {
    backgroundColor: 'rgba(139,157,195,0.2)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
    marginTop: 4,
  },
  btnText: {
    color: '#B8C8E0',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  toggle: {
    color: '#8B9DC3',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
  },
  error: {
    color: '#E57373',
    textAlign: 'center',
    fontSize: 13,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dividerText: {
    color: '#666',
    marginHorizontal: 12,
    fontSize: 13,
  },
  googleBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  googleBtnText: {
    color: '#E8E8E8',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

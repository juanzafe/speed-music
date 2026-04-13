import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import SearchBar from './src/components/SearchBar';
import TrackList from './src/components/TrackList';
import TrackDetail from './src/components/TrackDetail';
import { useHistory } from './src/hooks/useHistory';
import { useDownload } from './src/hooks/useDownload';
import { useSavedSongs } from './src/hooks/useSavedSongs';
import { useFavorites } from './src/hooks/useFavorites';
import { useAuth } from './src/hooks/useAuth';
import { wakeBackend, searchTracks, getTrackById } from './src/api';
import { getSpotifyTrackId } from './src/utils/spotify';
import { Track } from './src/types';

type Tab = 'search' | 'library' | 'history' | 'favorites';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('search');

  const { user, loading: authLoading, login, register, loginWithGoogle, logout } = useAuth();
  const { history, addToHistory } = useHistory();
  const { downloading, fullAudioUri, loadedFromDisk, downloadFull, reset: resetDownload } = useDownload();
  const { savedSongs, isSaved, saveSong, removeSong, loadSavedAudio } = useSavedSongs();
  const { favorites, isFavorite, toggleFavorite } = useFavorites(user);

  useEffect(() => { wakeBackend(); }, []);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResults([]);
    setSelectedTrack(null);
    setActiveTab('search');

    try {
      const trackId = getSpotifyTrackId(trimmed);
      if (trackId) {
        const data = await getTrackById(trackId);
        setSelectedTrack(data);
      } else {
        const data = await searchTracks(trimmed);
        setResults(data);
      }
    } catch {
      alert('Error conectando con el backend');
    } finally {
      setLoading(false);
    }
  }

  function selectTrack(track: Track) {
    setSelectedTrack(track);
    resetDownload();
  }

  function handleBack() {
    setSelectedTrack(null);
    resetDownload();
  }

  function handleDownload(saveToDisk: boolean) {
    if (!selectedTrack || downloading) return;
    downloadFull(selectedTrack, {
      onHistorySave: () => addToHistory(selectedTrack),
      isSaved: isSaved(selectedTrack.id),
      loadSavedAudio,
      saveToDisk: saveToDisk ? (track, url) => saveSong(track, url) : undefined,
    });
  }

  async function handleRemoveFromDisk() {
    if (!selectedTrack) return;
    await removeSong(selectedTrack.id);
  }

  function handleToggleFavorite() {
    if (!selectedTrack) return;
    toggleFavorite(selectedTrack);
  }

  const showContent = !selectedTrack && !loading;

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color="#8B9DC3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} onGoogle={loginWithGoogle} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('./assets/bg.webp')}
        style={styles.bgImage}
        imageStyle={styles.bgImageInner}
        resizeMode="cover"
      >
        <View style={styles.bgOverlay} />
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Speed Music</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>

          <SearchBar query={query} onChangeQuery={setQuery} onSearch={handleSearch} />

          {loading && <ActivityIndicator size="large" color="#8B9DC3" />}

          {showContent && activeTab === 'search' && results.length > 0 && (
            <TrackList tracks={results} onSelect={selectTrack} />
          )}

          {showContent && activeTab === 'history' && (
            history.length > 0 ? (
              <TrackList tracks={history} onSelect={selectTrack} keyPrefix="h-" />
            ) : (
              <Text style={styles.emptyText}>No hay canciones en el historial</Text>
            )
          )}

          {showContent && activeTab === 'library' && (
            savedSongs.length > 0 ? (
              <TrackList tracks={savedSongs} onSelect={selectTrack} keyPrefix="lib-" />
            ) : (
              <Text style={styles.emptyText}>No hay canciones guardadas en disco</Text>
            )
          )}

          {showContent && activeTab === 'favorites' && (
            favorites.length > 0 ? (
              <TrackList tracks={favorites} onSelect={selectTrack} keyPrefix="fav-" />
            ) : (
              <Text style={styles.emptyText}>No tienes canciones favoritas</Text>
            )
          )}

          {selectedTrack && (
            <TrackDetail
              track={selectedTrack}
              fullAudioUri={fullAudioUri}
              downloading={downloading}
              onDownload={handleDownload}
              onBack={handleBack}
              isSavedOnDisk={isSaved(selectedTrack.id)}
              loadedFromDisk={loadedFromDisk}
              onRemoveFromDisk={handleRemoveFromDisk}
              isFavorite={isFavorite(selectedTrack.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => { setActiveTab('library'); setSelectedTrack(null); resetDownload(); }}
          >
            <Text style={styles.tabIcon}>💾</Text>
            <Text style={[styles.tabLabel, activeTab === 'library' && styles.tabLabelActive]}>
              Biblioteca
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => { setActiveTab('history'); setSelectedTrack(null); resetDownload(); }}
          >
            <Text style={styles.tabIcon}>🕐</Text>
            <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
              Historial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => { setActiveTab('favorites'); setSelectedTrack(null); resetDownload(); }}
          >
            <Text style={styles.tabIcon}>❤️</Text>
            <Text style={[styles.tabLabel, activeTab === 'favorites' && styles.tabLabelActive]}>
              Favoritos
            </Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  bgImage: {
    flex: 1,
  },
  bgImageInner: {
    opacity: 0.55,
    resizeMode: 'cover',
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? { filter: 'blur(3px)', transform: [{ scale: 1.02 }], objectFit: 'cover', objectPosition: 'center' } : {}),
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    paddingBottom: 0,
    gap: 16,
  },
  header: {
    fontSize: 30,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoutBtn: {
    position: 'absolute',
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  logoutText: {
    color: '#999',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18,18,18,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'web' ? 8 : 20,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    color: '#666',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: '#B8C8E0',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

/* ── Login / Register Screen ── */

function LoginScreen({ onLogin, onRegister, onGoogle }: {
  onLogin: (email: string, pw: string) => Promise<void>;
  onRegister: (email: string, pw: string) => Promise<void>;
  onGoogle: () => Promise<void>;
}) {
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
    <SafeAreaView style={loginStyles.safe}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={loginStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={loginStyles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={loginStyles.title}>Speed Music</Text>
          <Text style={loginStyles.subtitle}>
            {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
          </Text>

          <TextInput
            style={loginStyles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={loginStyles.input}
            placeholder="Contraseña"
            placeholderTextColor="#666"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={loginStyles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[loginStyles.btn, busy && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#B8C8E0" size="small" />
            ) : (
              <Text style={loginStyles.btnText}>
                {isRegister ? 'Registrarse' : 'Entrar'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={loginStyles.divider}>
            <View style={loginStyles.dividerLine} />
            <Text style={loginStyles.dividerText}>o</Text>
            <View style={loginStyles.dividerLine} />
          </View>

          <TouchableOpacity
            style={loginStyles.googleBtn}
            onPress={async () => {
              setBusy(true);
              setError('');
              try { await onGoogle(); } catch { setError('Error al iniciar con Google'); }
              finally { setBusy(false); }
            }}
            disabled={busy}
          >
            <Text style={loginStyles.googleBtnText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(''); }}>
            <Text style={loginStyles.toggle}>
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const loginStyles = StyleSheet.create({
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
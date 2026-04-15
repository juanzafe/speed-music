import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import SearchBar from './src/components/SearchBar';
import TrackList from './src/components/TrackList';
import TrackDetail from './src/components/TrackDetail';
import LibraryTab from './src/components/LibraryTab';
import LoginScreen from './src/components/LoginScreen';
import { useHistory } from './src/hooks/useHistory';
import { useDownload } from './src/hooks/useDownload';
import { useSavedSongs } from './src/hooks/useSavedSongs';
import { useFavorites } from './src/hooks/useFavorites';
import { useFolders } from './src/hooks/useFolders';
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
  const { folders, songFolders, createFolder, deleteFolder, assignToFolder } = useFolders();

  const autoLoadedRef = useRef<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => { wakeBackend(); }, []);

  useEffect(() => {
    if (selectedTrack && isSaved(selectedTrack.id) && !fullAudioUri && !downloading && autoLoadedRef.current !== selectedTrack.id) {
      autoLoadedRef.current = selectedTrack.id;
      handleDownload(false);
    }
  }, [selectedTrack?.id]);

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
    autoLoadedRef.current = null;
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

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setSelectedTrack(null);
    resetDownload();
  }

  function getCurrentTrackList(): Track[] {
    switch (activeTab) {
      case 'search': return results;
      case 'library': return savedSongs;
      case 'history': return history;
      case 'favorites': return favorites;
      default: return [];
    }
  }

  function handleNextTrack() {
    if (!selectedTrack) return;
    const list = getCurrentTrackList();
    const idx = list.findIndex(t => t.id === selectedTrack.id);
    if (idx >= 0 && idx < list.length - 1) {
      const next = list[idx + 1];
      setSelectedTrack(next);
      resetDownload();
      autoLoadedRef.current = null;
    }
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
            <LibraryTab
              savedSongs={savedSongs}
              folders={folders}
              songFolders={songFolders}
              onSelect={selectTrack}
              createFolder={createFolder}
              deleteFolder={deleteFolder}
              assignToFolder={assignToFolder}
            />
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
              autoPlay={autoPlay}
              onAutoPlayToggle={() => setAutoPlay(p => !p)}
              onNextTrack={handleNextTrack}
            />
          )}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('library')}>
            <Text style={styles.tabIcon}>💾</Text>
            <Text style={[styles.tabLabel, activeTab === 'library' && styles.tabLabelActive]}>
              Biblioteca
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('history')}>
            <Text style={styles.tabIcon}>🕐</Text>
            <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
              Historial
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab('favorites')}>
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

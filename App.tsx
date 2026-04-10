import { useEffect, useState } from 'react';
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
import { useHistory } from './src/hooks/useHistory';
import { useDownload } from './src/hooks/useDownload';
import { wakeBackend, searchTracks, getTrackById } from './src/api';
import { getSpotifyTrackId } from './src/utils/spotify';
import { Track } from './src/types';

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { history, addToHistory } = useHistory();
  const { downloading, fullAudioUri, downloadFull, reset: resetDownload } = useDownload();

  useEffect(() => { wakeBackend(); }, []);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResults([]);
    setSelectedTrack(null);
    setShowHistory(false);

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
    setShowHistory(false);
    resetDownload();
  }

  function handleBack() {
    setSelectedTrack(null);
    resetDownload();
  }

  function handleDownload() {
    if (!selectedTrack || downloading) return;
    downloadFull(selectedTrack, () => addToHistory(selectedTrack));
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
          <Text style={styles.header}>Speed Music</Text>

          <SearchBar query={query} onChangeQuery={setQuery} onSearch={handleSearch} />

          {!selectedTrack && (
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text style={styles.historyBtnText}>
                {showHistory ? 'Cerrar historial' : 'Historial'}
              </Text>
            </TouchableOpacity>
          )}

          {loading && <ActivityIndicator size="large" color="#8B9DC3" />}

          {showHistory && !selectedTrack && (
            history.length > 0 ? (
              <TrackList tracks={history} onSelect={selectTrack} keyPrefix="h-" />
            ) : (
              <Text style={styles.emptyText}>No hay canciones en el historial</Text>
            )
          )}

          {results.length > 0 && !showHistory && !selectedTrack && (
            <TrackList tracks={results} onSelect={selectTrack} />
          )}

          {selectedTrack && (
            <TrackDetail
              track={selectedTrack}
              fullAudioUri={fullAudioUri}
              downloading={downloading}
              onDownload={handleDownload}
              onBack={handleBack}
            />
          )}
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
    gap: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: '300',
    color: '#E8E8E8',
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  historyBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  historyBtnText: {
    color: '#B0B0B0',
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});
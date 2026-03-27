import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Image,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Platform } from 'react-native';
import Player from './src/components/Player';
import { getSpotifyTrackId } from './src/utils/spotify';

// En producción usa la URL del backend desplegado; en desarrollo usa localhost/IP local
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://speed-music-backend.onrender.com';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string | null;
  previewUrl: string | null;
  durationMs: number;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(false);

  // Despertar el backend apenas carga la app
  useEffect(() => {
    fetch(API_BASE).catch(() => {});
  }, []);

  async function handleSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResults([]);
    setSelectedTrack(null);

    try {
      // Si el usuario pegó un link de Spotify, cargar directamente esa canción
      const trackId = getSpotifyTrackId(trimmed);

      if (trackId) {
        const res = await fetch(`${API_BASE}/song/${trackId}`);
        const data: Track = await res.json();
        setSelectedTrack(data);
      } else {
        // Búsqueda por nombre
        const res = await fetch(
          `${API_BASE}/search?q=${encodeURIComponent(trimmed)}`
        );
        const data: Track[] = await res.json();
        setResults(data);
      }
    } catch (error) {
      console.error(error);
      alert('Error conectando con el backend');
    } finally {
      setLoading(false);
    }
  }

  function selectTrack(track: Track) {
    setSelectedTrack(track);
    setResults([]);
  }

  function renderTrackItem({ item }: { item: Track }) {
    const hasPreview = !!item.previewUrl;
    return (
      <TouchableOpacity
        style={[styles.resultItem, !hasPreview && styles.resultItemDisabled]}
        onPress={() => hasPreview && selectTrack(item)}
        activeOpacity={hasPreview ? 0.7 : 1}
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.thumbnail} />
        )}
        <View style={styles.resultText}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.resultArtist} numberOfLines={1}>
            {item.artist}
          </Text>
          {!hasPreview && (
            <Text style={styles.noPreview}>Sin preview disponible</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        <Text style={styles.header}>⚡ Speed Music</Text>

        {/* Barra de búsqueda */}
        <View style={styles.searchRow}>
          <TextInput
            placeholder="Buscar canción o pegar link de Spotify..."
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            style={styles.input}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#1DB954" />}

        {/* Resultados de búsqueda */}
        {results.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderTrackItem}
            style={styles.resultList}
          />
        )}

        {/* Canción seleccionada + Player */}
        {selectedTrack && (
          <ScrollView
            style={styles.selectedSection}
            contentContainerStyle={styles.selectedSectionContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.songInfo}>
              {selectedTrack.image && (
                <Image
                  source={{ uri: selectedTrack.image }}
                  style={styles.image}
                />
              )}
              <Text style={styles.title}>{selectedTrack.title}</Text>
              <Text style={styles.artist}>{selectedTrack.artist}</Text>
              <Text style={styles.album}>{selectedTrack.album}</Text>
            </View>

            {selectedTrack.previewUrl ? (
              <Player uri={selectedTrack.previewUrl} />
            ) : (
              <Text style={styles.noPreviewBig}>
                Esta canción no tiene preview de audio disponible en Spotify
              </Text>
            )}

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setSelectedTrack(null);
                setResults([]);
              }}
            >
              <Text style={styles.backBtnText}>← Buscar otra</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
    gap: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1DB954',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: {
    fontSize: 20,
  },
  resultList: {
    flex: 1,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  resultItemDisabled: {
    opacity: 0.4,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  resultText: {
    flex: 1,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultArtist: {
    color: '#aaa',
    fontSize: 13,
  },
  noPreview: {
    color: '#e74c3c',
    fontSize: 11,
    marginTop: 2,
  },
  selectedSection: {
    flex: 1,
  },
  selectedSectionContent: {
    gap: 16,
    paddingBottom: 24,
  },
  songInfo: {
    alignItems: 'center',
    gap: 6,
  },
  image: {
    width: 180,
    height: 180,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  artist: {
    fontSize: 16,
    color: '#bbb',
  },
  album: {
    fontSize: 13,
    color: '#777',
  },
  noPreviewBig: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
    padding: 20,
  },
  backBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: '#1DB954',
    fontSize: 16,
  },
});
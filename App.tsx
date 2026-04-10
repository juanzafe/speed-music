import { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import Player from './src/components/Player';
import { getSpotifyTrackId } from './src/utils/spotify';
import AsyncStorage from '@react-native-async-storage/async-storage';

// En producción usa la URL del backend desplegado; en desarrollo usa localhost/IP local
const RENDER_URL = 'https://speed-music-backend.onrender.com';
const isLocal = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
const API_BASE = isLocal
  ? (process.env.EXPO_PUBLIC_API_URL ?? RENDER_URL)
  : RENDER_URL;

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
  const [downloading, setDownloading] = useState(false);
  const [fullAudioUri, setFullAudioUri] = useState<string | null>(null);
  const [history, setHistory] = useState<Track[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Cargar historial y despertar backend
  useEffect(() => {
    fetch(API_BASE).catch(() => {});
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const stored = await AsyncStorage.getItem('songHistory');
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }

  async function addToHistory(track: Track) {
    try {
      const stored = await AsyncStorage.getItem('songHistory');
      let list: Track[] = stored ? JSON.parse(stored) : [];
      list = list.filter(t => t.id !== track.id);
      list.unshift(track);
      if (list.length > 50) list = list.slice(0, 50);
      await AsyncStorage.setItem('songHistory', JSON.stringify(list));
      setHistory(list);
    } catch {}
  }

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
    // Revoke previous blob URL to free memory
    if (fullAudioUri && fullAudioUri.startsWith('blob:')) {
      URL.revokeObjectURL(fullAudioUri);
    }
    setFullAudioUri(null);
    setDownloading(false);
  }

  /** Try streaming audio via backend proxy (Piped stream proxied through our server - no CORS issues) */
  async function tryStreamProxy(trackId: string): Promise<string | null> {
    try {
      console.log('Trying stream proxy...');
      const audioRes = await fetch(`${API_BASE}/download/${trackId}/stream`);
      if (!audioRes.ok) {
        console.log(`Stream proxy returned ${audioRes.status}`);
        return null;
      }
      const blob = await audioRes.blob();
      console.log(`Stream proxy blob: ${blob.size} bytes`);
      if (blob.size > 500_000) {
        return URL.createObjectURL(blob);
      }
      console.log('Stream proxy blob too small');
    } catch (e: any) {
      console.warn('Stream proxy failed:', e.message);
    }
    return null;
  }

  async function tryPipedDownload(trackId: string): Promise<string | null> {
    try {
      // Get YouTube video ID from backend (search works from datacenter)
      const vidRes = await fetch(`${API_BASE}/download/${trackId}/video-id`);
      if (!vidRes.ok) return null;
      const { videoId } = await vidRes.json();
      if (!videoId) return null;

      console.log('Client-side fallback: videoId =', videoId);

      // Try Invidious instances first (proxied via latest_version?local=true)
      const invidiousInstances = [
        'https://inv.thepixora.com',
        'https://invidious.materialio.us',
        'https://yewtu.be',
        'https://inv.tux.pizza',
        'https://invidious.privacyredirect.com',
      ];

      for (const instance of invidiousInstances) {
        try {
          console.log(`Trying Invidious: ${instance}`);
          // itag 140 = m4a 128kbps
          const url = `${instance}/latest_version?id=${videoId}&itag=140&local=true`;
          const audioRes = await fetch(url, { redirect: 'follow' });
          if (!audioRes.ok) { console.log(`  ${instance} returned ${audioRes.status}`); continue; }
          const blob = await audioRes.blob();
          console.log(`  Downloaded: ${blob.size} bytes`);
          if (blob.size > 500_000) {
            return URL.createObjectURL(blob);
          }
          console.log(`  Too small, skipping`);
        } catch (e: any) { console.warn(`  Invidious ${instance} error:`, e.message); continue; }
      }

      // Piped as last resort
      const pipedInstances = [
        'https://pipedapi.kavin.rocks',
        'https://pipedapi.leptons.xyz',
        'https://pipedapi.adminforge.de',
      ];

      for (const instance of pipedInstances) {
        try {
          console.log(`Trying Piped instance: ${instance}`);
          const streamRes = await fetch(`${instance}/streams/${videoId}`);
          if (!streamRes.ok) { console.log(`  ${instance} returned ${streamRes.status}`); continue; }
          const streamData = await streamRes.json();

          const audioStreams = (streamData.audioStreams || [])
            .filter((s: any) => s.url && s.mimeType?.startsWith('audio/'));
          const mp4Streams = audioStreams
            .filter((s: any) => s.mimeType?.includes('mp4'))
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
          const allSorted = audioStreams
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
          const best = mp4Streams[0] || allSorted[0];

          if (!best?.url) { console.log(`  No audio streams from ${instance}`); continue; }
          console.log(`  Found stream: ${best.mimeType} ${best.bitrate}bps`);

          const audioRes = await fetch(best.url);
          if (!audioRes.ok) { console.log(`  Audio fetch failed: ${audioRes.status}`); continue; }
          const blob = await audioRes.blob();
          console.log(`  Downloaded blob: ${blob.size} bytes`);
          if (blob.size > 500_000) {
            return URL.createObjectURL(blob);
          }
          console.log(`  Blob too small, skipping`);
        } catch (e: any) { console.warn(`  Piped ${instance} error:`, e.message); continue; }
      }
    } catch (e) { console.warn('Client-side fallback failed:', e); }
    return null;
  }

  async function handleDownloadFull(trackId: string) {
    setDownloading(true);
    try {
      // Strategy: try server download + stream proxy in parallel
      // Server download: yt-dlp (works on residential IPs)
      // Stream proxy: Piped via backend proxy (works from datacenter)
      // Save to history
      if (selectedTrack) addToHistory(selectedTrack);

      const serverPromise = tryServerDownload(trackId);
      const streamProxyPromise = tryStreamProxy(trackId);

      // Wait for server first (usually faster if cached)
      const serverUrl = await serverPromise;
      if (serverUrl) {
        setFullAudioUri(serverUrl);
        return;
      }

      // Server failed — wait for stream proxy
      console.log('Server download insufficient, waiting for stream proxy...');
      const streamUrl = await streamProxyPromise;
      if (streamUrl) {
        setFullAudioUri(streamUrl);
        return;
      }

      // Both failed — try client-side Piped as last resort
      console.log('Stream proxy failed, trying client-side Piped...');
      const pipedUrl = await tryPipedDownload(trackId);
      if (pipedUrl) {
        setFullAudioUri(pipedUrl);
        return;
      }

      // Final fallback: poll server status (might still be downloading in background)
      console.log('All methods failed, polling server...');
      try {
        for (let i = 0; i < 20; i++) {
          const statusRes = await fetch(`${API_BASE}/download/${trackId}/status`);
          if (statusRes.ok) {
            const d = await statusRes.json();
            if (d.status === 'ready' && d.size > 10_000) {
              const audioRes = await fetch(`${API_BASE}/download/${trackId}`);
              if (audioRes.ok) {
                const blob = await audioRes.blob();
                if (blob.size > 10_000) {
                  setFullAudioUri(URL.createObjectURL(blob));
                  return;
                }
              }
              break;
            }
            if (d.status === 'error' || d.status === 'none') break;
          }
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch {}

      throw new Error('No se pudo descargar');
    } catch (e) {
      console.error(e);
      alert('Error descargando canción completa. Intenta con otra canción.');
    } finally {
      setDownloading(false);
    }
  }

  /** Try server-side download: prepare → poll → download blob. Returns blob URL if full song. */
  async function tryServerDownload(trackId: string): Promise<string | null> {
    try {
      const prepareRes = await fetch(`${API_BASE}/download/${trackId}/prepare`);
      if (!prepareRes.ok) return null;

      let prepareData;
      try { prepareData = await prepareRes.json(); } catch { return null; }

      // Poll until ready
      let fileSize = 0;
      if (prepareData.status === 'ready') {
        // Already cached — get size
        try {
          const statusRes = await fetch(`${API_BASE}/download/${trackId}/status`);
          if (statusRes.ok) {
            const d = await statusRes.json();
            fileSize = d.size || 0;
          }
        } catch {}
      } else {
        // Wait for download to complete
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const statusRes = await fetch(`${API_BASE}/download/${trackId}/status`);
            if (!statusRes.ok) continue;
            const d = await statusRes.json();
            if (d.status === 'ready') { fileSize = d.size || 0; break; }
            if (d.status === 'error') { console.warn('Server download error:', d.error); return null; }
          } catch { continue; }
        }
      }

      // Only use server file if it's a full song (>500KB)
      if (fileSize > 500_000) {
        const audioRes = await fetch(`${API_BASE}/download/${trackId}`);
        if (audioRes.ok) {
          const blob = await audioRes.blob();
          if (blob.size > 500_000) {
            return URL.createObjectURL(blob);
          }
        }
      }
    } catch (e) { console.warn('Server download failed:', e); }
    return null;
  }

  function renderTrackItem({ item }: { item: Track }) {
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => selectTrack(item)}
        activeOpacity={0.7}
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
        </View>
      </TouchableOpacity>
    );
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

        {/* Botón historial */}
        {!selectedTrack && (
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => setShowHistory(!showHistory)}
          >
            <Text style={styles.historyBtnText}>
              {showHistory ? '✕ Cerrar historial' : '🕒 Historial'}
            </Text>
          </TouchableOpacity>
        )}

        {loading && <ActivityIndicator size="large" color="#1DB954" />}

        {/* Historial */}
        {showHistory && !selectedTrack && (
          history.length > 0 ? (
            <FlatList
              data={history}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              renderItem={renderTrackItem}
              style={styles.resultList}
            />
          ) : (
            <Text style={styles.noHistoryText}>No hay canciones en el historial</Text>
          )
        )}

        {/* Resultados de búsqueda */}
        {results.length > 0 && !showHistory && (
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

            {/* Full song via yt-dlp download */}
            {fullAudioUri ? (
              <Player uri={fullAudioUri} />
            ) : (
              <>
                {/* Download full song button */}
                <TouchableOpacity
                  style={[styles.downloadBtn, downloading && { opacity: 0.5 }]}
                  onPress={() => !downloading && handleDownloadFull(selectedTrack.id)}
                  disabled={downloading}
                >
                  {downloading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.downloadBtnText}>⬇️ Descargar canción completa</Text>
                  )}
                </TouchableOpacity>

                {/* Preview player as fallback while not downloaded */}
                {selectedTrack.previewUrl && (
                  <>
                    <Text style={styles.previewHint}>Preview (30s):</Text>
                    <Player uri={selectedTrack.previewUrl} />
                  </>
                )}

                {!selectedTrack.previewUrl && (
                  <Text style={styles.noPreviewBig}>
                    Pulsa el botón de arriba para descargar la canción completa
                  </Text>
                )}
              </>
            )}

            {/* Open in Spotify app (mobile) */}
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={styles.openSpotifyBtn}
                onPress={() => Linking.openURL(`https://open.spotify.com/track/${selectedTrack.id}`)}
              >
                <Text style={styles.openSpotifyBtnText}>🎵 Abrir en Spotify</Text>
              </TouchableOpacity>
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

  toggleBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  toggleBtnText: {
    color: '#1DB954',
    fontSize: 13,
  },
  openSpotifyBtn: {
    alignSelf: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  openSpotifyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  downloadBtn: {
    alignSelf: 'center',
    backgroundColor: '#e67e22',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  previewHint: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  historyBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
  },
  historyBtnText: {
    color: '#1DB954',
    fontSize: 14,
  },
  noHistoryText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
  },
});
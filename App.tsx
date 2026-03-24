import { useState } from 'react';
import { View, TextInput, Button, Text, Image, StyleSheet } from 'react-native';
import Player from './src/components/Player';
import { getSpotifyTrackId } from './src/utils/spotify';

export default function App() {
  const [url, setUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [song, setSong] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function handleLoad() {
    const id = getSpotifyTrackId(url);

    if (!id) {
      alert('Link inválido');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`http://192.168.0.12/song/${id}`);
      const data = await res.json();

      setAudioUrl(data.audioUrl);
      setSong(data);

    } catch (error) {
      console.error(error);
      alert('Error conectando con backend');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Pega link de Spotify"
        value={url}
        onChangeText={setUrl}
        style={styles.input}
      />

      <Button
        title={loading ? "Cargando..." : "Cargar canción"}
        onPress={handleLoad}
      />

      {/* Info canción */}
      {song && (
        <View style={styles.songInfo}>
          <Image source={{ uri: song.image }} style={styles.image} />
          <Text style={styles.title}>{song.title}</Text>
          <Text>{song.artist}</Text>
        </View>
      )}

      {/* Player */}
      {audioUrl && <Player uri={audioUrl} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 40,
    gap: 20,
  },
  input: {
    borderWidth: 1,
    padding: 10,
  },
  songInfo: {
    alignItems: 'center',
    gap: 10,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
});
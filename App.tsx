import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import Player from './src/components/Player';
import { getSpotifyTrackId } from './src/utils/spotify';

export default function App() {
  const [url, setUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  function handleLoad() {
    const id = getSpotifyTrackId(url);
    console.log("Track ID:", id);

    // 🔥 AUDIO LIBRE (MVP)
    setAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
  }

  return (
    <View style={{ padding: 40 }}>
      <TextInput
        placeholder="Pega link de Spotify"
        value={url}
        onChangeText={setUrl}
        style={{ borderWidth: 1, marginBottom: 10 }}
      />

      <Button title="Cargar canción" onPress={handleLoad} />

      {audioUrl && <Player uri={audioUrl} />}
    </View>
  );
}
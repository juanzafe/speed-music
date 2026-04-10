import {
  View, ScrollView, Image, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, Linking, Platform,
} from 'react-native';
import { Track } from '../types';
import Player from './Player';

interface Props {
  track: Track;
  fullAudioUri: string | null;
  downloading: boolean;
  onDownload: () => void;
  onBack: () => void;
}

export default function TrackDetail({ track, fullAudioUri, downloading, onDownload, onBack }: Props) {
  return (
    <ScrollView
      style={styles.section}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.info}>
        {track.image && (
          <Image source={{ uri: track.image }} style={styles.image} />
        )}
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.artist}>{track.artist}</Text>
        <Text style={styles.album}>{track.album}</Text>
      </View>

      {fullAudioUri ? (
        <Player uri={fullAudioUri} />
      ) : (
        <>
          <TouchableOpacity
            style={[styles.downloadBtn, downloading && { opacity: 0.5 }]}
            onPress={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.downloadBtnText}>⬇️ Descargar canción completa</Text>
            )}
          </TouchableOpacity>

          {track.previewUrl && (
            <>
              <Text style={styles.previewHint}>Preview (30s):</Text>
              <Player uri={track.previewUrl} />
            </>
          )}

          {!track.previewUrl && (
            <Text style={styles.noPreview}>
              Pulsa el botón de arriba para descargar la canción completa
            </Text>
          )}
        </>
      )}

      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.spotifyBtn}
          onPress={() => Linking.openURL(`https://open.spotify.com/track/${track.id}`)}
        >
          <Text style={styles.spotifyBtnText}>🎵 Abrir en Spotify</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>← Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
  },
  content: {
    gap: 16,
    paddingBottom: 24,
  },
  info: {
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
  noPreview: {
    color: '#e74c3c',
    textAlign: 'center',
    fontSize: 14,
    padding: 20,
  },
  spotifyBtn: {
    alignSelf: 'center',
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  spotifyBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
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

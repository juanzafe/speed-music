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
            style={[styles.downloadBtn, downloading && { opacity: 0.4 }]}
            onPress={onDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator color="#B8C8E0" size="small" />
            ) : (
              <Text style={styles.downloadBtnText}>Descargar canción completa</Text>
            )}
          </TouchableOpacity>

          {track.previewUrl && (
            <>
              <Text style={styles.previewHint}>Vista previa · 30s</Text>
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
          <Text style={styles.spotifyBtnText}>Abrir en Spotify</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backBtnText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
  },
  content: {
    gap: 18,
    paddingBottom: 24,
  },
  info: {
    alignItems: 'center',
    gap: 8,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 6,
  },
  title: {
    fontWeight: '500',
    fontSize: 20,
    color: '#E8E8E8',
    textAlign: 'center',
    marginTop: 4,
  },
  artist: {
    fontSize: 15,
    color: '#999',
  },
  album: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  downloadBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(139,157,195,0.18)',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
  },
  downloadBtnText: {
    color: '#B8C8E0',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  previewHint: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  noPreview: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    padding: 20,
    fontStyle: 'italic',
  },
  spotifyBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  spotifyBtnText: {
    color: '#B0B0B0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  backBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: '#888',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

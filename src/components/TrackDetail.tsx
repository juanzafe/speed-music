import { useState } from 'react';
import {
  View, ScrollView, Image, Text, TouchableOpacity,
  ActivityIndicator, StyleSheet, Linking, Platform, Modal,
} from 'react-native';
import { Track } from '../types';
import Player from './Player';

interface Props {
  track: Track;
  fullAudioUri: string | null;
  downloading: boolean;
  onDownload: (saveToDisk: boolean) => void;
  onBack: () => void;
  isSavedOnDisk?: boolean;
  loadedFromDisk?: boolean;
  onRemoveFromDisk?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  autoPlay?: boolean;
  onAutoPlayToggle?: () => void;
  onNextTrack?: () => void;
}

export default function TrackDetail({
  track, fullAudioUri, downloading, onDownload, onBack,
  isSavedOnDisk, loadedFromDisk, onRemoveFromDisk,
  isFavorite, onToggleFavorite,
  autoPlay, onAutoPlayToggle, onNextTrack,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  function handleDownloadPress() {
    if (downloading) return;
    setShowModal(true);
  }

  function handleChoice(save: boolean) {
    setShowModal(false);
    onDownload(save);
  }

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

        <TouchableOpacity style={styles.favBtn} onPress={onToggleFavorite}>
          <Text style={styles.favBtnIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
          <Text style={[styles.favBtnText, isFavorite && styles.favBtnTextActive]}>
            {isFavorite ? 'Favorita' : 'Añadir a favoritos'}
          </Text>
        </TouchableOpacity>
      </View>

      {fullAudioUri ? (
        <>
          <Player
            uri={fullAudioUri}
            autoPlay={autoPlay}
            onAutoPlayToggle={onAutoPlayToggle}
            onTrackEnd={onNextTrack}
          />

          {loadedFromDisk && (
            <Text style={styles.diskHint}>Cargada desde disco</Text>
          )}

          {isSavedOnDisk && (
            <TouchableOpacity style={styles.removeDiskBtn} onPress={onRemoveFromDisk}>
              <Text style={styles.removeDiskBtnText}>Eliminar del disco</Text>
            </TouchableOpacity>
          )}
        </>
      ) : isSavedOnDisk ? (
        <View style={styles.loadingDisk}>
          <ActivityIndicator color="#B8C8E0" size="small" />
          <Text style={styles.loadingDiskText}>Cargando desde disco…</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.downloadBtn, downloading && { opacity: 0.4 }]}
            onPress={handleDownloadPress}
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

      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Guardar en este dispositivo?</Text>
            <Text style={styles.modalDesc}>
              Si la guardas, podrás escucharla sin conexión desde la Biblioteca.
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalBtnYes} onPress={() => handleChoice(true)}>
                <Text style={styles.modalBtnYesText}>💾 Sí, guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnNo} onPress={() => handleChoice(false)}>
                <Text style={styles.modalBtnNoText}>Solo escuchar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  favBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  favBtnIcon: {
    fontSize: 16,
  },
  favBtnText: {
    color: '#999',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  favBtnTextActive: {
    color: '#E57373',
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
  diskHint: {
    color: '#81C784',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  removeDiskBtn: {
    alignSelf: 'center',
    backgroundColor: 'rgba(244,67,54,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
  },
  removeDiskBtnText: {
    color: '#E57373',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  loadingDisk: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingDiskText: {
    color: '#999',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#E8E8E8',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalDesc: {
    color: '#999',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBtns: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  modalBtnYes: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.4)',
    alignItems: 'center',
  },
  modalBtnYesText: {
    color: '#81C784',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalBtnNo: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  modalBtnNoText: {
    color: '#B0B0B0',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

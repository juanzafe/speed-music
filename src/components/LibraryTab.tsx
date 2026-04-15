import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert, Modal,
} from 'react-native';
import TrackList from './TrackList';
import { Track } from '../types';

interface Props {
  savedSongs: Track[];
  folders: string[];
  songFolders: Record<string, string>;
  onSelect: (track: Track) => void;
  createFolder: (name: string) => void;
  deleteFolder: (name: string) => void;
  assignToFolder: (trackId: string, folder: string | null) => void;
}

export default function LibraryTab({
  savedSongs, folders, songFolders, onSelect,
  createFolder, deleteFolder, assignToFolder,
}: Props) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [folderModalTrack, setFolderModalTrack] = useState<Track | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

  const filtered = selectedFolder === null
    ? savedSongs
    : savedSongs.filter(s => songFolders[s.id] === selectedFolder);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.folderBar}
        contentContainerStyle={styles.folderBarContent}
      >
        <TouchableOpacity
          style={[styles.folderChip, selectedFolder === null && styles.folderChipActive]}
          onPress={() => setSelectedFolder(null)}
        >
          <Text style={[styles.folderChipText, selectedFolder === null && styles.folderChipTextActive]}>
            Todas
          </Text>
        </TouchableOpacity>

        {folders.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.folderChip, selectedFolder === f && styles.folderChipActive]}
            onPress={() => setSelectedFolder(f)}
            onLongPress={() => {
              if (Platform.OS === 'web') {
                if (confirm(`¿Eliminar carpeta "${f}"?`)) {
                  deleteFolder(f);
                  if (selectedFolder === f) setSelectedFolder(null);
                }
              } else {
                Alert.alert('Eliminar carpeta', `¿Eliminar "${f}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar', style: 'destructive',
                    onPress: () => { deleteFolder(f); if (selectedFolder === f) setSelectedFolder(null); },
                  },
                ]);
              }
            }}
          >
            <Text style={[styles.folderChipText, selectedFolder === f && styles.folderChipTextActive]}>
              📁 {f}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.folderAddChip}
          onPress={() => {
            if (Platform.OS === 'web') {
              const name = prompt('Nombre de la carpeta');
              if (name) createFolder(name);
            } else {
              Alert.prompt?.('Nueva carpeta', 'Nombre:', (name: string) => { if (name) createFolder(name); });
            }
          }}
        >
          <Text style={styles.folderAddChipText}>+ Carpeta</Text>
        </TouchableOpacity>
      </ScrollView>

      {filtered.length > 0 ? (
        <TrackList
          tracks={filtered}
          onSelect={onSelect}
          keyPrefix="lib-"
          onFolderPress={(track) => setFolderModalTrack(track)}
        />
      ) : (
        <Text style={styles.emptyText}>
          {selectedFolder ? `No hay canciones en "${selectedFolder}"` : 'No hay canciones guardadas en disco'}
        </Text>
      )}

      <Modal visible={!!folderModalTrack} transparent animationType="fade">
        <View style={styles.fmOverlay}>
          <View style={styles.fmBox}>
            <Text style={styles.fmTitle}>📁 Mover a carpeta</Text>
            {folderModalTrack && (
              <Text style={styles.fmTrackName} numberOfLines={1}>{folderModalTrack.title}</Text>
            )}

            <TouchableOpacity
              style={[styles.fmOption, folderModalTrack && !songFolders[folderModalTrack.id] && styles.fmOptionActive]}
              onPress={() => { if (folderModalTrack) { assignToFolder(folderModalTrack.id, null); setFolderModalTrack(null); } }}
            >
              <Text style={styles.fmOptionText}>Sin carpeta</Text>
            </TouchableOpacity>

            {folders.map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.fmOption, folderModalTrack && songFolders[folderModalTrack.id] === f && styles.fmOptionActive]}
                onPress={() => { if (folderModalTrack) { assignToFolder(folderModalTrack.id, f); setFolderModalTrack(null); } }}
              >
                <Text style={styles.fmOptionText}>📁 {f}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.fmNewRow}>
              <TextInput
                style={styles.fmInput}
                placeholder="Nueva carpeta…"
                placeholderTextColor="#666"
                value={newFolderName}
                onChangeText={setNewFolderName}
              />
              <TouchableOpacity
                style={styles.fmCreateBtn}
                onPress={() => {
                  const name = newFolderName.trim();
                  if (name && folderModalTrack) {
                    createFolder(name);
                    assignToFolder(folderModalTrack.id, name);
                    setNewFolderName('');
                    setFolderModalTrack(null);
                  }
                }}
              >
                <Text style={styles.fmCreateBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.fmCancel}
              onPress={() => { setFolderModalTrack(null); setNewFolderName(''); }}
            >
              <Text style={styles.fmCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  folderBar: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 40,
  },
  folderBarContent: {
    gap: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  folderChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  folderChipActive: {
    backgroundColor: 'rgba(139,157,195,0.2)',
    borderColor: 'rgba(139,157,195,0.4)',
  },
  folderChipText: {
    color: '#999',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  folderChipTextActive: {
    color: '#B8C8E0',
  },
  folderAddChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.25)',
    borderStyle: 'dashed',
  },
  folderAddChipText: {
    color: '#8B9DC3',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  fmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  fmBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fmTitle: {
    color: '#E8E8E8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  fmTrackName: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  fmOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  fmOptionActive: {
    backgroundColor: 'rgba(139,157,195,0.15)',
    borderColor: 'rgba(139,157,195,0.35)',
  },
  fmOptionText: {
    color: '#CCC',
    fontSize: 14,
  },
  fmNewRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  fmInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#E8E8E8',
    fontSize: 13,
  },
  fmCreateBtn: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.35)',
  },
  fmCreateBtnText: {
    color: '#81C784',
    fontSize: 13,
    fontWeight: '600',
  },
  fmCancel: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  fmCancelText: {
    color: '#888',
    fontSize: 13,
  },
});

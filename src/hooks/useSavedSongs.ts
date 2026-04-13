import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../types';
import { saveAudioBlob, loadAudioBlob, deleteAudioBlob } from '../utils/audioStorage';

const SAVED_KEY = 'savedSongs';

export function useSavedSongs() {
  const [savedSongs, setSavedSongs] = useState<Track[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_KEY)
      .then(stored => { if (stored) setSavedSongs(JSON.parse(stored)); })
      .catch(() => {});
  }, []);

  function isSaved(trackId: string) {
    return savedSongs.some(t => t.id === trackId);
  }

  async function saveSong(track: Track, blobUrl: string) {
    try {
      const res = await fetch(blobUrl);
      const blob = await res.blob();
      await saveAudioBlob(track.id, blob);

      const stored = await AsyncStorage.getItem(SAVED_KEY);
      let list: Track[] = stored ? JSON.parse(stored) : [];
      list = list.filter(t => t.id !== track.id);
      list.unshift(track);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(list));
      setSavedSongs(list);
    } catch (e) {
      console.error('Error guardando canción:', e);
    }
  }

  async function removeSong(trackId: string) {
    try {
      await deleteAudioBlob(trackId);

      const stored = await AsyncStorage.getItem(SAVED_KEY);
      let list: Track[] = stored ? JSON.parse(stored) : [];
      list = list.filter(t => t.id !== trackId);
      await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(list));
      setSavedSongs(list);
    } catch (e) {
      console.error('Error eliminando canción:', e);
    }
  }

  async function loadSavedAudio(trackId: string): Promise<string | null> {
    try {
      const blob = await loadAudioBlob(trackId);
      if (blob) return URL.createObjectURL(blob);
    } catch {}
    return null;
  }

  return { savedSongs, isSaved, saveSong, removeSong, loadSavedAudio };
}

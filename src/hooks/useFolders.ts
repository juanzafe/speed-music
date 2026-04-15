import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FOLDERS_KEY = 'libraryFolders';
const SONG_FOLDERS_KEY = 'songFolderMap';

export function useFolders() {
  const [folders, setFolders] = useState<string[]>([]);
  const [songFolders, setSongFolders] = useState<Record<string, string>>({});

  useEffect(() => {
    AsyncStorage.getItem(FOLDERS_KEY).then(s => { if (s) setFolders(JSON.parse(s)); }).catch(() => {});
    AsyncStorage.getItem(SONG_FOLDERS_KEY).then(s => { if (s) setSongFolders(JSON.parse(s)); }).catch(() => {});
  }, []);

  async function createFolder(name: string) {
    const trimmed = name.trim();
    if (!trimmed || folders.includes(trimmed)) return;
    const updated = [...folders, trimmed];
    setFolders(updated);
    await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
  }

  async function deleteFolder(name: string) {
    const updated = folders.filter(f => f !== name);
    setFolders(updated);
    await AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(updated));
    const updatedSF = { ...songFolders };
    for (const key of Object.keys(updatedSF)) {
      if (updatedSF[key] === name) delete updatedSF[key];
    }
    setSongFolders(updatedSF);
    await AsyncStorage.setItem(SONG_FOLDERS_KEY, JSON.stringify(updatedSF));
  }

  async function assignToFolder(trackId: string, folderName: string | null) {
    const updated = { ...songFolders };
    if (folderName === null) {
      delete updated[trackId];
    } else {
      updated[trackId] = folderName;
    }
    setSongFolders(updated);
    await AsyncStorage.setItem(SONG_FOLDERS_KEY, JSON.stringify(updated));
  }

  function getFolderForSong(trackId: string): string | null {
    return songFolders[trackId] ?? null;
  }

  return { folders, songFolders, createFolder, deleteFolder, assignToFolder, getFolderForSong };
}

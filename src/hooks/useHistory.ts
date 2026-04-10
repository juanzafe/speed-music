import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track } from '../types';

const STORAGE_KEY = 'songHistory';
const MAX_HISTORY = 50;

export function useHistory() {
  const [history, setHistory] = useState<Track[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => { if (stored) setHistory(JSON.parse(stored)); })
      .catch(() => {});
  }, []);

  async function addToHistory(track: Track) {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let list: Track[] = stored ? JSON.parse(stored) : [];
      list = list.filter(t => t.id !== track.id);
      list.unshift(track);
      if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setHistory(list);
    } catch {}
  }

  return { history, addToHistory };
}

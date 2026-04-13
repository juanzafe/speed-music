import { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rtdb } from '../firebase';
import { Track } from '../types';

const LOCAL_KEY = 'favorites';

export function useFavorites(user: User | null) {
  const [favorites, setFavorites] = useState<Track[]>([]);

  useEffect(() => {
    loadFavorites();
  }, [user?.uid]);

  async function loadFavorites() {
    try {
      if (user) {
        const snap = await get(ref(rtdb, `users/${user.uid}/favorites`));
        const data = snap.val();
        setFavorites(Array.isArray(data) ? data : []);
      } else {
        const stored = await AsyncStorage.getItem(LOCAL_KEY);
        if (stored) setFavorites(JSON.parse(stored));
      }
    } catch {
      const stored = await AsyncStorage.getItem(LOCAL_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    }
  }

  function isFavorite(trackId: string) {
    return favorites.some(t => t.id === trackId);
  }

  async function toggleFavorite(track: Track) {
    try {
      let list = [...favorites];
      const exists = list.some(t => t.id === track.id);
      if (exists) {
        list = list.filter(t => t.id !== track.id);
      } else {
        list.unshift(track);
      }
      setFavorites(list);

      if (user) {
        await set(ref(rtdb, `users/${user.uid}/favorites`), list);
      }
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    } catch {}
  }

  return { favorites, isFavorite, toggleFavorite };
}

import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Slider from '@react-native-community/slider';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface Props {
  accessToken: string;
  trackUri: string; // spotify:track:XXXXX
}

export default function SpotifyWebPlayer({ accessToken, trackUri }: Props) {
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load Spotify SDK and create player
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function initPlayer() {
      const player = new window.Spotify.Player({
        name: 'Speed Music',
        getOAuthToken: (cb: (t: string) => void) => cb(accessToken),
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        deviceIdRef.current = device_id;
        playerRef.current = player;
        setIsReady(true);
      });

      player.addListener('not_ready', () => setIsReady(false));

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setIsPlaying(!state.paused);
        setPositionMs(state.position);
        setDurationMs(state.duration);
      });

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        setError('Error de inicialización');
      });

      player.addListener('authentication_error', () => {
        setError('Necesitas Spotify Premium para canciones completas');
      });

      player.addListener('account_error', () => {
        setError('Necesitas Spotify Premium para canciones completas');
      });

      player.connect();
    }

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [accessToken]);

  // Play track when ready or when trackUri changes
  useEffect(() => {
    if (!isReady || !deviceIdRef.current) return;

    async function play() {
      try {
        await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ uris: [trackUri] }),
          }
        );

        // Polling for position updates
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(async () => {
          const state = await playerRef.current?.getCurrentState();
          if (state) {
            setPositionMs(state.position);
            setDurationMs(state.duration);
            setIsPlaying(!state.paused);
          }
        }, 1000);
      } catch {
        setError('Error al reproducir');
      }
    }

    play();
  }, [isReady, trackUri]);

  async function togglePlay() {
    await playerRef.current?.togglePlay();
  }

  async function seekTo(ms: number) {
    await playerRef.current?.seek(ms);
    setPositionMs(ms);
  }

  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Conectando con Spotify...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>♫ Canción completa · Spotify</Text>
      </View>

      <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
        <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>

      <Text style={styles.time}>
        {formatTime(positionMs)} / {formatTime(durationMs)}
      </Text>

      <Slider
        style={{ width: '100%' }}
        minimumValue={0}
        maximumValue={durationMs || 1}
        value={positionMs}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#555"
        thumbTintColor="#1DB954"
        onSlidingComplete={seekTo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#1DB954',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    gap: 12,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#1DB954',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 15,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: {
    fontSize: 24,
  },
  time: {
    textAlign: 'center',
    fontSize: 14,
    color: '#ccc',
  },
});

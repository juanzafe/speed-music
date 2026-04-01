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

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function SpotifyWebPlayer({ accessToken, trackUri }: Props) {
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const rateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Aplica la velocidad al elemento <audio> de Spotify
  function applyRateToAudio(audio: HTMLAudioElement, r: number) {
    if (audio.playbackRate !== r) {
      audio.playbackRate = r;
    }
    (audio as any).preservesPitch = true;
    (audio as any).webkitPreservesPitch = true;
  }

  // Busca y hookea el elemento <audio> que crea Spotify SDK
  function hookAudioElement() {
    const audios = document.querySelectorAll('audio');
    // Spotify suele crear un audio element; tomamos el que tenga src
    let target: HTMLAudioElement | null = null;
    audios.forEach((el) => {
      if (el.src || el.srcObject) target = el;
    });
    if (!target && audios.length > 0) target = audios[0];

    if (target && target !== audioElRef.current) {
      audioElRef.current = target;
      applyRateToAudio(target, rateRef.current);

      // Interceptar ratechange para re-aplicar si Spotify lo resetea
      target.addEventListener('ratechange', () => {
        if (target && target.playbackRate !== rateRef.current) {
          target.playbackRate = rateRef.current;
        }
      });

      // También re-aplicar cuando empieza a reproducir
      target.addEventListener('playing', () => {
        if (target) applyRateToAudio(target, rateRef.current);
      });
    }

    return target;
  }

  // Observer: detecta cuando Spotify inserta/reemplaza el <audio>
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    observerRef.current = new MutationObserver(() => {
      hookAudioElement();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Polling cada 300ms como fallback para mantener la velocidad
    rateIntervalRef.current = setInterval(() => {
      const audio = audioElRef.current || hookAudioElement();
      if (audio) applyRateToAudio(audio, rateRef.current);
    }, 300);

    return () => {
      observerRef.current?.disconnect();
      if (rateIntervalRef.current) clearInterval(rateIntervalRef.current);
    };
  }, []);

  function changeSpeed(newRate: number) {
    const clamped = Math.round(newRate * 100) / 100;
    setRate(clamped);
    rateRef.current = clamped;
    const audio = audioElRef.current || hookAudioElement();
    if (audio) applyRateToAudio(audio, clamped);
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

      {/* Velocidad - Slider */}
      <Text style={styles.speedLabel}>Velocidad: {rate.toFixed(2)}x</Text>

      <Slider
        style={{ width: '100%' }}
        minimumValue={0.5}
        maximumValue={2}
        step={0.05}
        value={rate}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#555"
        thumbTintColor="#1DB954"
        onSlidingComplete={changeSpeed}
      />

      {/* Velocidad - Presets */}
      <View style={styles.presetRow}>
        {SPEED_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetBtn,
              Math.abs(rate - preset) < 0.01 && styles.presetBtnActive,
            ]}
            onPress={() => changeSpeed(preset)}
          >
            <Text
              style={[
                styles.presetText,
                Math.abs(rate - preset) < 0.01 && styles.presetTextActive,
              ]}
            >
              {preset}x
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  speedLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1DB954',
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  presetBtnActive: {
    backgroundColor: '#1DB954',
    borderColor: '#1DB954',
  },
  presetText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#000',
  },
});

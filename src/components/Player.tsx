import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function Player({ uri }: { uri: string }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Cargar automáticamente al recibir una nueva uri
  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Limpiar sonido previo
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setLoaded(false);
      setIsPlaying(false);
      setPositionMs(0);
      setDurationMs(0);
      setRate(1);

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: 1, shouldCorrectPitch: true },
        (status) => {
          if (cancelled) return;
          if (status.isLoaded) {
            setPositionMs(status.positionMillis);
            setDurationMs(status.durationMillis ?? 0);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        }
      );

      if (cancelled) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      setLoaded(true);
      setIsPlaying(true);
    }

    load();

    return () => {
      cancelled = true;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [uri]);

  async function togglePlay() {
    const sound = soundRef.current;
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  }

  async function changeSpeed(newRate: number) {
    const sound = soundRef.current;
    if (!sound) return;

    const clamped = Math.round(newRate * 100) / 100;
    setRate(clamped);
    await sound.setRateAsync(clamped, true);
  }

  async function seekTo(ms: number) {
    const sound = soundRef.current;
    if (!sound) return;
    await sound.setPositionAsync(ms);
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  if (!loaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando audio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Play/Pause */}
      <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
        <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶️'}</Text>
      </TouchableOpacity>

      {/* Progreso */}
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
    borderColor: '#333',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    gap: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 15,
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
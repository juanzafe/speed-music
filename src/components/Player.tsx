import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

const SPEED_PRESETS = [0.5, 0.75, 0.8, 0.85, 0.9, 0.95, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.5, 2];

interface Props {
  uri: string;
  autoPlay?: boolean;
  onAutoPlayToggle?: () => void;
  onTrackEnd?: () => void;
}

export default function Player({ uri, autoPlay, onAutoPlayToggle, onTrackEnd }: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const onTrackEndRef = useRef(onTrackEnd);
  const autoPlayRef = useRef(autoPlay);

  useEffect(() => { onTrackEndRef.current = onTrackEnd; }, [onTrackEnd]);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

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
              if (autoPlayRef.current && onTrackEndRef.current) {
                onTrackEndRef.current();
              }
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
      {/* Play/Pause + Autoplay */}
      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.playBtn} onPress={togglePlay}>
          <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        {onAutoPlayToggle && (
          <TouchableOpacity
            style={[styles.autoPlayBtn, autoPlay && styles.autoPlayBtnActive]}
            onPress={onAutoPlayToggle}
          >
            <Text style={[styles.autoPlayIcon, autoPlay && styles.autoPlayIconActive]}>⏭</Text>
            <Text style={[styles.autoPlayLabel, autoPlay && styles.autoPlayLabelActive]}>Auto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progreso */}
      <Text style={styles.time}>
        {formatTime(positionMs)} / {formatTime(durationMs)}
      </Text>

      <Slider
        style={{ width: '100%' }}
        minimumValue={0}
        maximumValue={durationMs || 1}
        value={positionMs}
        minimumTrackTintColor="#8B9DC3"
        maximumTrackTintColor="rgba(255,255,255,0.12)"
        thumbTintColor="#B8C8E0"
        onSlidingComplete={seekTo}
      />

      {/* Velocidad - Slider */}
      <Text style={styles.speedLabel}>Velocidad · {rate.toFixed(2)}x</Text>

      <Slider
        style={{ width: '100%' }}
        minimumValue={0.5}
        maximumValue={2}
        step={0.05}
        value={rate}
        minimumTrackTintColor="#8B9DC3"
        maximumTrackTintColor="rgba(255,255,255,0.12)"
        thumbTintColor="#B8C8E0"
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
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(139,157,195,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: {
    fontSize: 22,
    color: '#B8C8E0',
  },
  autoPlayBtn: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  autoPlayBtnActive: {
    backgroundColor: 'rgba(139,157,195,0.18)',
    borderColor: 'rgba(139,157,195,0.35)',
  },
  autoPlayIcon: {
    fontSize: 18,
    color: '#666',
  },
  autoPlayIconActive: {
    color: '#B8C8E0',
  },
  autoPlayLabel: {
    fontSize: 9,
    color: '#666',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  autoPlayLabelActive: {
    color: '#B8C8E0',
  },
  time: {
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    letterSpacing: 0.5,
  },
  speedLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '400',
    color: '#B0B0B0',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  presetBtnActive: {
    backgroundColor: 'rgba(139,157,195,0.25)',
    borderColor: 'rgba(139,157,195,0.4)',
  },
  presetText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#C8D6EC',
  },
});
import { Audio } from 'expo-av';
import { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function Player({ uri }: { uri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<any>(null);

  // Cargar sonido
  async function loadSound() {
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );

    setSound(sound);
    setIsPlaying(true);
  }

  // Callback progreso
  function onPlaybackStatusUpdate(status: any) {
    setStatus(status);
  }

  // Play / Pause
  async function togglePlay() {
    if (!sound) return;

    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
    }
  }

  // Cambiar velocidad
  async function changeSpeed(newRate: number) {
    if (!sound) return;

    setRate(newRate);
    await sound.setRateAsync(newRate, true);
  }

  // Limpiar sonido al desmontar
  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  // Formatear tiempo
  function formatTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  return (
    <View style={styles.container}>
      {/* Botón cargar */}
      {!sound && (
        <Button title="Cargar y reproducir" onPress={loadSound} />
      )}

      {/* Controles */}
      {sound && (
        <>
          <Button
            title={isPlaying ? "Pause" : "Play"}
            onPress={togglePlay}
          />

          {/* Progreso */}
          <Text style={styles.time}>
            {formatTime(status?.positionMillis || 0)} /{" "}
            {formatTime(status?.durationMillis || 0)}
          </Text>

          {/* Slider progreso */}
          <Slider
            style={{ width: '100%' }}
            minimumValue={0}
            maximumValue={status?.durationMillis || 1}
            value={status?.positionMillis || 0}
            onSlidingComplete={async (value) => {
              if (sound) {
                await sound.setPositionAsync(value);
              }
            }}
          />

          {/* Velocidad */}
          <Text style={styles.speed}>Velocidad: {rate.toFixed(2)}x</Text>

          <Slider
            style={{ width: '100%' }}
            minimumValue={0.5}
            maximumValue={2}
            step={0.1}
            value={rate}
            onValueChange={changeSpeed}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    padding: 20,
    borderWidth: 1,
    borderRadius: 10,
    gap: 15,
  },
  time: {
    textAlign: 'center',
    fontSize: 16,
  },
  speed: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
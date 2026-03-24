import { Audio } from 'expo-av';
import { useState } from 'react';
import { View, Button, Text } from 'react-native';

export default function Player({ uri }: { uri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [rate, setRate] = useState(1);

  async function playSound() {
    const { sound } = await Audio.Sound.createAsync({ uri });
    setSound(sound);
    await sound.playAsync();
  }

  async function changeSpeed(newRate: number) {
    if (!sound) return;
    setRate(newRate);
    await sound.setRateAsync(newRate, true);
  }

  return (
    <View>
      <Button title="Play" onPress={playSound} />
      <Text>Velocidad: {rate}x</Text>

      <Button title="0.5x" onPress={() => changeSpeed(0.5)} />
      <Button title="1x" onPress={() => changeSpeed(1)} />
      <Button title="1.5x" onPress={() => changeSpeed(1.5)} />
      <Button title="2x" onPress={() => changeSpeed(2)} />
    </View>
  );
}
import { FlatList, TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { Track } from '../types';

interface Props {
  tracks: Track[];
  onSelect: (track: Track) => void;
  keyPrefix?: string;
}

export default function TrackList({ tracks, onSelect, keyPrefix = '' }: Props) {
  return (
    <FlatList
      data={tracks}
      keyExtractor={(item, idx) => `${keyPrefix}${item.id}-${idx}`}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
        >
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.thumbnail} />
          )}
          <View style={styles.text}>
            <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.artist} numberOfLines={1}>{item.artist}</Text>
          </View>
        </TouchableOpacity>
      )}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  text: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
    color: '#aaa',
    fontSize: 13,
  },
});

import { FlatList, TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { Track } from '../types';

interface Props {
  tracks: Track[];
  onSelect: (track: Track) => void;
  keyPrefix?: string;
  onFolderPress?: (track: Track) => void;
}

export default function TrackList({ tracks, onSelect, keyPrefix = '', onFolderPress }: Props) {
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
          {onFolderPress && (
            <TouchableOpacity
              style={styles.folderBtn}
              onPress={() => onFolderPress(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.folderBtnText}>📁</Text>
            </TouchableOpacity>
          )}
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 14,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  text: {
    flex: 1,
  },
  title: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
  },
  artist: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  folderBtn: {
    padding: 6,
  },
  folderBtnText: {
    fontSize: 18,
  },
});

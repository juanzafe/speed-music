import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  query: string;
  onChangeQuery: (text: string) => void;
  onSearch: () => void;
}

export default function SearchBar({ query, onChangeQuery, onSearch }: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        placeholder="Buscar canción o pegar link de Spotify..."
        placeholderTextColor="#888"
        value={query}
        onChangeText={onChangeQuery}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={onSearch}>
        <Text style={styles.btnText}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
  },
  btn: {
    backgroundColor: '#1DB954',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 20,
  },
});

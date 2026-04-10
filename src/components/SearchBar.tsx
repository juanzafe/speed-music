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
        placeholderTextColor="#666"
        value={query}
        onChangeText={onChangeQuery}
        onSubmitEditing={onSearch}
        returnKeyType="search"
        style={styles.input}
      />
      <TouchableOpacity style={styles.btn} onPress={onSearch}>
        <Text style={styles.btnText}>Buscar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#E8E8E8',
    padding: 14,
    borderRadius: 6,
    fontSize: 14,
  },
  btn: {
    backgroundColor: 'rgba(139,157,195,0.2)',
    borderRadius: 6,
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,157,195,0.3)',
  },
  btnText: {
    fontSize: 13,
    color: '#B8C8E0',
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

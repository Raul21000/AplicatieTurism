import { Link } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>This is a modal</ThemedText>
      <Link href="/" dismissTo asChild>
        <TouchableOpacity style={styles.linkButton}>
          <ThemedText type="link" style={styles.linkText}>Go to home screen</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 30,
  },
  linkButton: {
    marginTop: 15,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  linkText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

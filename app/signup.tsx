import { signUpWithAccount } from '@/lib/auth-helpers';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Eroare', 'Te rog completează toate câmpurile');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Eroare', 'Te rog introdu un email valid (format: name@domain.com)');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Eroare', 'Parola trebuie să aibă cel puțin 6 caractere');
      return;
    }

    try {
      setLoading(true);
      const { session, error } = await signUpWithAccount(email, password, username || undefined);

      if (error) {
        Alert.alert('Eroare la înregistrare', error.message);
        setLoading(false);
      } else if (session) {
        // User is logged in immediately after signup
        console.log('Signup successful, session stored:', session);
        Alert.alert('Succes', 'Contul a fost creat cu succes!');
        router.replace('/(tabs)' as any);
      }
    } catch (err: any) {
      Alert.alert('Eroare', err.message || 'A apărut o eroare neașteptată');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Înregistrare</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nume utilizator (opțional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Introdu numele tău"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Introdu email-ul tău"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Parolă</Text>
          <TextInput
            style={styles.input}
            placeholder="Introdu parola (min. 6 caractere)"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, styles.signUpButton, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Înregistrare</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ai deja cont?</Text>
          <TouchableOpacity onPress={() => router.push('/login' as any)}>
            <Text style={styles.linkText}>Autentifică-te</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b0b0b0',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#1a1a1a',
    color: '#FFFFFF',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  signUpButton: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    color: '#b0b0b0',
  },
  linkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});


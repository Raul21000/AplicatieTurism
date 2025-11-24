import { signInWithAccount } from '@/lib/auth-helpers';
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Prevent auto-navigation - user must login manually
  React.useEffect(() => {
    // This screen should always be accessible for login
    // Navigation is handled by _layout.tsx based on session
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Eroare', 'Te rog completează toate câmpurile');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Eroare', 'Te rog introdu un email valid');
      return;
    }

    try {
      setLoading(true);
      const { session, error } = await signInWithAccount(email, password);

      if (error) {
        Alert.alert('Eroare la autentificare', error.message);
        setLoading(false);
        return; // Don't navigate on error
      }
      
      if (!session) {
        Alert.alert('Eroare', 'Autentificare eșuată. Te rog încearcă din nou.');
        setLoading(false);
        return; // Don't navigate if no session
      }

      // Only navigate if we have a valid session
      console.log('Login successful, navigating to tabs');
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      console.error('Login error:', err);
      Alert.alert('Eroare', err.message || 'A apărut o eroare neașteptată');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Autentificare</Text>

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
            placeholder="Introdu parola"
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
          style={[styles.button, styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Autentificare</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nu ai cont?</Text>
          <TouchableOpacity onPress={() => router.push('/signup' as any)}>
            <Text style={styles.linkText}>Înregistrează-te</Text>
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
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButton: {
    backgroundColor: '#007AFF',
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


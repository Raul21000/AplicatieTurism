import 'react-native-get-random-values';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSession, verifySession } from '@/lib/auth-helpers';
import { initDatabase } from '@/lib/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialize database and verify session against database
    const checkSession = async () => {
      try {
        await initDatabase();
        const storedSession = await getSession();
        // Verify session exists in database
        const verifiedSession = await verifySession(storedSession);
        setSession(verifiedSession);
      } catch (error) {
        console.error('Error initializing app:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0] as string;
    const inAuthGroup = currentSegment === 'login' || currentSegment === 'signup';
    const inTabsGroup = currentSegment === '(tabs)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/login' as any);
    } else if (session && inAuthGroup) {
      // Redirect to tabs if authenticated and on auth screen
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Force dark theme for modern look
  const modernDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0a0a0a',
      card: '#1a1a1a',
      text: '#FFFFFF',
      border: '#2a2a2a',
      primary: '#007AFF',
    },
  };

  return (
    <ThemeProvider value={modernDarkTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal', 
            title: 'Modal',
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#FFFFFF',
          }} 
        />
        <Stack.Screen 
          name="details" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: '#1a1a1a' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF' },
            title: 'Detalii',
          }} 
        />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

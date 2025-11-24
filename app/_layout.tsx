import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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

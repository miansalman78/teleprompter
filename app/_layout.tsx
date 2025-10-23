import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ScriptProvider } from '../contexts/ScriptContext';
import { VolumeProvider } from '../contexts/VolumeContext';
// Import polyfills for AWS SDK compatibility
import '../utils/polyfills';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <VolumeProvider>
      <ScriptProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="screens/videoShoot"
            options={{
              headerShown: false,
              title: 'Video Shoot',
              headerTitleAlign: 'center',
            }}
          />
           <Stack.Screen
            name="screens/PreviewVideoShoot"
            options={{
              headerShown: false
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ScriptProvider>
    </VolumeProvider>
  );
}
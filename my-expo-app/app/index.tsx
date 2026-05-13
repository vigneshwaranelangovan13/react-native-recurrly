// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('hasOnboarded').then((v) => setHasOnboarded(v === 'true'));
  }, []);

  if (!isLoaded || hasOnboarded === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff9e3',
        }}>
        <ActivityIndicator size="large" color="#081126" />
      </View>
    );
  }

  if (!hasOnboarded) return <Redirect href="/onboarding" />;
  if (isSignedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/sign-in" />;
}

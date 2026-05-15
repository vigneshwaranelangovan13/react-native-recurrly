// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [hasAttemptedSignIn, setHasAttemptedSignIn] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync('hasOnboarded'),
      SecureStore.getItemAsync('hasAttemptedSignIn'),
    ]).then(([onboarded, attempted]) => {
      setHasOnboarded(onboarded === 'true');
      setHasAttemptedSignIn(attempted === 'true');
    });
  }, []);

  if (!isLoaded || hasOnboarded === null || hasAttemptedSignIn === null) {
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
  // First-time users go to sign-up, returning users go to sign-in
  if (!hasAttemptedSignIn) return <Redirect href="/(auth)/sign-up" />;
  return <Redirect href="/(auth)/sign-in" />;
}

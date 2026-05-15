// app/_layout.tsx
import '@/global.css';
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { useCurrencyStore } from '@/lib/currencyStore';
import { useSubscriptionStore } from '@/lib/subscriptionStore';

SplashScreen.preventAutoHideAsync();

// 🔍 Network logger — see every request Clerk makes
const originalFetch = global.fetch;
global.fetch = async (url: any, options: any) => {
  console.log('🌐 FETCH:', url);
  try {
    const res = await originalFetch(url, options);
    console.log('✅ RESPONSE:', url, res.status);
    return res;
  } catch (err) {
    console.log('❌ FAILED:', url, err);
    throw err;
  }
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

console.log('Clerk key loaded:', publishableKey?.substring(0, 20));

if (!publishableKey) {
  throw new Error('Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file');
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  });

  // 🧹 Clear any cached Clerk session (rules out case #7)
  useEffect(() => {
    SecureStore.deleteItemAsync('__clerk_client_jwt')
      .then(() => console.log('🧹 Cleared Clerk cache'))
      .catch((e) => console.log('🧹 Cache clear error:', e));
  }, []);

  useEffect(() => {
    useCurrencyStore.getState().loadCurrency();
    useSubscriptionStore.getState().loadSubscriptions();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {fontsLoaded || fontError ? <Stack screenOptions={{ headerShown: false }} /> : null}
    </ClerkProvider>
  );
}

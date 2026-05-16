// app/(auth)/sign-in.tsx
import '@/global.css';
import { useSignIn } from '@clerk/expo';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { colors } from '@/constants/theme';

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    console.log('[SignIn] 🔵 handleSignIn started');
    console.log('[SignIn] 🔵 Email:', email);

    if (!signIn) {
      console.log('[SignIn] ❌ signIn object is undefined');
      return;
    }

    console.log('[SignIn] 🔵 Setting hasAttemptedSignIn flag');
    await SecureStore.setItemAsync('hasAttemptedSignIn', 'true');

    console.log('[SignIn] 🔵 Calling signIn.password()...');
    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    console.log('[SignIn] 🔵 signIn.password() completed');
    console.log('[SignIn] 🔵 signIn.status:', signIn.status);

    if (error) {
      console.log('[SignIn] ❌ Error object:', JSON.stringify(error, null, 2));
      console.log('[SignIn] ❌ Error code:', error.code);

      if (error.code === 'form_identifier_not_found') {
        console.log('[SignIn] 🔁 Redirecting to sign-up (account not found)');
        router.replace({
          pathname: '/(auth)/sign-up',
          params: { email: email.trim() },
        });
        return;
      }
      return;
    }

    console.log('[SignIn] ✅ No error from signIn.password()');

    if (signIn.status === 'complete') {
      console.log('[SignIn] ✅ Status is COMPLETE - calling finalize()');
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/');
          console.log('[SignIn] 🔵 Finalize navigate URL:', url);
          router.replace(url as any);
        },
      });
      console.log('[SignIn] ✅ Successfully signed in and navigating to app');
    } else {
      console.log('[SignIn] ⚠️ Unexpected status:', signIn.status);
      console.log('[SignIn] ⚠️ Full signIn object:', JSON.stringify(signIn, null, 2));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled">

          <Text style={{ fontSize: 32, fontFamily: 'sans-extrabold', color: colors.primary, marginBottom: 8 }}>
            Welcome back
          </Text>
          <Text style={{ fontSize: 16, fontFamily: 'sans-medium', color: colors.mutedForeground, marginBottom: 40 }}>
            Sign in to your Recurrly account
          </Text>

          <Text className="auth-label">Email</Text>
          <TextInput
            className="auth-input"
            placeholder="you@example.com"
            placeholderTextColor="rgba(0,0,0,0.35)"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {errors?.fields?.identifier && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 4 }}>
              {errors.fields.identifier.message}
            </Text>
          )}

          <Text className="auth-label" style={{ marginTop: 16 }}>Password</Text>
          <TextInput
            className="auth-input"
            placeholder="Your password"
            placeholderTextColor="rgba(0,0,0,0.35)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {errors?.fields?.password && (
            <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 4 }}>
              {errors.fields.password.message}
            </Text>
          )}

          <Pressable
            className="auth-button"
            style={{ marginTop: 32, opacity: fetchStatus === 'fetching' ? 0.7 : 1 }}
            onPress={handleSignIn}
            disabled={!email || !password || fetchStatus === 'fetching' || !signIn}>
            {fetchStatus === 'fetching'
              ? <ActivityIndicator color="#fff" />
              : <Text className="auth-button-text">Sign In</Text>}
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ fontFamily: 'sans-medium', color: colors.mutedForeground }}>
              Don&apos;t have an account?{' '}
            </Text>
            <Link href="/(auth)/sign-up">
              <Text style={{ fontFamily: 'sans-bold', color: colors.accent }}>Sign Up</Text>
            </Link>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
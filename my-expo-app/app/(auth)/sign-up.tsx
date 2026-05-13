// app/(auth)/sign-in.tsx
import '@/global.css';
import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';

export default function SignIn() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!signIn) return; // ✅ guard against undefined

    const { error } = await signIn.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      console.error('[SignIn] error:', JSON.stringify(error));
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/');
          router.replace(url as any);
        },
      });
    } else {
      console.error('[SignIn] incomplete status:', signIn.status);
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
                Don't have an account?{' '}
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
// app/(auth)/sign-up.tsx
import '@/global.css';
import { useSignUp } from '@clerk/expo';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { colors } from '@/constants/theme';

export default function SignUp() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'signup' | 'verify'>('signup');

  const handleSignUp = async () => {
    if (!signUp) return;

    // Mark that user has interacted with auth
    await SecureStore.setItemAsync('hasAttemptedSignIn', 'true');

    const { error } = await signUp.password({
      emailAddress: email.trim(),
      password,
    });

    if (error) {
      console.error('[SignUp] error:', JSON.stringify(error));

      // If account already exists, redirect to sign-in with email pre-filled
      if (error.code === 'form_identifier_exists') {
        router.replace({
          pathname: '/(auth)/sign-in',
          params: { email: email.trim() },
        });
        return;
      }
      return;
    }

    // Send verification email
    await signUp.verifications.sendEmailCode();
    setStep('verify');
  };

  const handleVerifyCode = async () => {
    if (!signUp) return;

    const { error } = await signUp.verifications.verifyEmailCode({ code });

    if (error) {
      console.error('[Verify] error:', JSON.stringify(error));
      return;
    }

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl('/');
          router.replace(url as any);
        },
      });
    } else {
      console.error('[SignUp] incomplete status:', signUp.status);
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
          {step === 'signup' ? (
            <>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: 'sans-extrabold',
                  color: colors.primary,
                  marginBottom: 8,
                }}>
                Create account
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'sans-medium',
                  color: colors.mutedForeground,
                  marginBottom: 40,
                }}>
                Start tracking your subscriptions
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
              {errors?.fields?.emailAddress && (
                <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 4 }}>
                  {errors.fields.emailAddress.message}
                </Text>
              )}

              <Text className="auth-label" style={{ marginTop: 16 }}>
                Password
              </Text>
              <TextInput
                className="auth-input"
                placeholder="Create a password"
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
                onPress={handleSignUp}
                disabled={!email || !password || fetchStatus === 'fetching' || !signUp}>
                {fetchStatus === 'fetching' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="auth-button-text">Sign Up</Text>
                )}
              </Pressable>

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                <Text style={{ fontFamily: 'sans-medium', color: colors.mutedForeground }}>
                  Already have an account?{' '}
                </Text>
                <Link href="/(auth)/sign-in">
                  <Text style={{ fontFamily: 'sans-bold', color: colors.accent }}>Sign In</Text>
                </Link>
              </View>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: 'sans-extrabold',
                  color: colors.primary,
                  marginBottom: 8,
                }}>
                Verify your email
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: 'sans-medium',
                  color: colors.mutedForeground,
                  marginBottom: 40,
                }}>
                We sent a verification code to {email}
              </Text>

              <Text className="auth-label">Verification Code</Text>
              <TextInput
                className="auth-input"
                placeholder="Enter 6-digit code"
                placeholderTextColor="rgba(0,0,0,0.35)"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              {errors?.fields?.code && (
                <Text style={{ color: colors.destructive, fontSize: 13, marginTop: 4 }}>
                  {errors.fields.code.message}
                </Text>
              )}

              <Pressable
                className="auth-button"
                style={{ marginTop: 32, opacity: fetchStatus === 'fetching' ? 0.7 : 1 }}
                onPress={handleVerifyCode}
                disabled={!code || fetchStatus === 'fetching'}>
                {fetchStatus === 'fetching' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="auth-button-text">Verify</Text>
                )}
              </Pressable>

              <Pressable
                style={{ marginTop: 20, alignItems: 'center' }}
                onPress={() => signUp?.verifications.sendEmailCode()}>
                <Text style={{ fontFamily: 'sans-medium', color: colors.accent }}>
                  Didn&apos;t get a code? Resend
                </Text>
              </Pressable>

              <Pressable
                style={{ marginTop: 12, alignItems: 'center' }}
                onPress={() => {
                  setStep('signup');
                  setCode('');
                }}>
                <Text style={{ fontFamily: 'sans-medium', color: colors.mutedForeground }}>
                  ← Back
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

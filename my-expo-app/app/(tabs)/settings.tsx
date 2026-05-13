// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Pressable, TextInput, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

const ONBOARDED_KEY = 'hasOnboarded';

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleSendFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message before sending.');
      return;
    }
    const recipient = 'elavignesh@gmail.com';
    const subject = encodeURIComponent('Recurrly App Feedback');
    const body = encodeURIComponent(
        `Name: ${user?.fullName ?? 'N/A'}\nEmail: ${user?.primaryEmailAddress?.emailAddress ?? 'N/A'}\n\nMessage:\n${message.trim()}`
    );
    const mailUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
    try {
      const supported = await Linking.canOpenURL(mailUrl);
      if (supported) {
        await Linking.openURL(mailUrl);
        setMessage('');
      } else {
        Alert.alert('Mail Not Available', `Please email us directly at ${recipient}`);
      }
    } catch {
      Alert.alert('Error', `Could not open mail app. Please email ${recipient}`);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: async () => {
              try {
                await signOut();
                router.replace('/(auth)/sign-in'); // ✅ goes to sign in after logout
              } catch (err) {
                console.error('[SignOut] error:', err);
                Alert.alert('Error', 'Could not sign out. Please try again.');
              }
            },
          },
        ]
    );
  };

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Initial circle instead of avatar image */}
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {user?.firstName?.charAt(0)?.toUpperCase() ??
                    user?.primaryEmailAddress?.emailAddress?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.fullName || user?.firstName || 'User'}</Text>
              <Text style={styles.userEmail}>
                {user?.primaryEmailAddress?.emailAddress || ''}
              </Text>
            </View>
          </View>

          {/* Feedback Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedback</Text>
            <View style={styles.feedbackForm}>

              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    editable={false}
                    placeholderTextColor="rgba(0,0,0,0.4)"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Message</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Share your thoughts or report an issue..."
                    placeholderTextColor="rgba(0,0,0,0.4)"
                    multiline
                    numberOfLines={4}
                />
              </View>
              <Pressable
                  style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendFeedback}
                  disabled={!message.trim()}>
                <Text style={styles.sendButtonText}>Send Feedback</Text>
              </Pressable>
            </View>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>

          <Text style={styles.version}>Recurrly v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontFamily: 'sans-bold', color: colors.primary },
  scrollContent: { padding: 20, paddingBottom: 100 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'sans-bold',
    color: '#fff',
  },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
  userEmail: {
    fontSize: 14,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: colors.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  feedbackForm: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontFamily: 'sans-semibold',
    color: colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'sans-medium',
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  sendButton: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { fontSize: 16, fontFamily: 'sans-bold', color: '#fff' },
  signOutButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { fontSize: 16, fontFamily: 'sans-bold', color: colors.destructive },
  version: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 20,
  },
});
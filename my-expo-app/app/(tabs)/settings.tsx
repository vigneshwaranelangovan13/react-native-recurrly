// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser, useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import images from '@/constants/images';

// ✅ Hardcoded — never import this from '../onboarding'
// Cross-screen imports break expo-router's tab navigator silently
const ONBOARDED_KEY = 'hasOnboarded';

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleEditProfile = () => {
    Linking.openURL('https://accounts.clerk.com/user');
  };

  const handlePlaceholderTap = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} feature is coming soon!`);
  };

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

  const handleSignOut = async () => {
    await SecureStore.deleteItemAsync(ONBOARDED_KEY);
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image source={images.avatar} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress || ''}</Text>
            <Pressable onPress={handleEditProfile}>
              <Text style={styles.editLabel}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <Pressable style={styles.row} onPress={() => handlePlaceholderTap('Notifications')}>
            <Text style={styles.rowText}>Notifications</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => handlePlaceholderTap('Currency')}>
            <Text style={styles.rowText}>Currency</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
          <Pressable style={styles.row} onPress={() => handlePlaceholderTap('Theme')}>
            <Text style={styles.rowText}>Theme</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.feedbackForm}>
            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={user?.fullName || ''}
                editable={false}
                placeholderTextColor="rgba(0,0,0,0.4)"
              />
            </View>
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
                placeholder="Enter your message..."
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
  userEmail: {
    fontSize: 14,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  editLabel: { fontSize: 14, fontFamily: 'sans-semibold', color: colors.accent },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: colors.primary,
    marginBottom: 12,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowText: { fontSize: 16, fontFamily: 'sans-medium', color: colors.primary },
  chevron: { fontSize: 20, color: colors.mutedForeground },
  feedbackForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: 'sans-semibold', color: colors.primary, marginBottom: 8 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'sans-medium',
    color: colors.primary,
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
  sendButtonText: { fontSize: 16, fontFamily: 'sans-bold', color: '#FFFFFF' },
  signOutButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
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

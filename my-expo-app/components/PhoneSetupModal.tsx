import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/lib/userStore';
import { colors } from '@/constants/theme';

interface PhoneSetupModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PhoneSetupModal({ visible, onClose }: PhoneSetupModalProps) {
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { updatePhone } = useUserStore();

  const handleSave = async () => {
    if (!phone.trim()) return;
    setIsSaving(true);
    await updatePhone(phone.trim());
    setIsSaving(false);
    setPhone('');
    onClose();
  };

  const handleSkip = () => {
    setPhone('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleSkip}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kav}
        >
          <View style={styles.container}>
            <Text style={styles.title}>One last thing</Text>
            <Text style={styles.subtitle}>
              Add your phone number so group members can contact you after connecting.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="rgba(8,17,38,0.35)"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                autoFocus
              />
            </View>

            <Pressable
              style={[styles.saveBtn, (!phone.trim() || isSaving) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!phone.trim() || isSaving}
            >
              <Text style={styles.saveBtnText}>
                {isSaving ? 'Saving…' : 'Save & Continue'}
              </Text>
            </Pressable>

            <Pressable onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  title: {
    fontFamily: 'sans-extrabold',
    fontSize: 28,
    color: colors.foreground,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'sans-regular',
    fontSize: 15,
    color: colors.mutedForeground,
    lineHeight: 22,
    marginBottom: 40,
  },
  field: { marginBottom: 28 },
  label: {
    fontFamily: 'sans-semibold',
    fontSize: 12,
    color: colors.foreground,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.muted,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'sans-regular',
    fontSize: 16,
    color: colors.foreground,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: {
    fontFamily: 'sans-bold',
    fontSize: 16,
    color: '#fff',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: 'sans-medium',
    fontSize: 14,
    color: colors.mutedForeground,
  },
});

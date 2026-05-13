import {
  Modal, View, Text, TextInput, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { colors } from '@/constants/theme';
import { useCurrencyStore } from '@/lib/currencyStore';
import dayjs from 'dayjs';

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
  appUserId?: string;
  userRegion?: string;
}

type Frequency = 'Monthly' | 'Yearly';

type Category =
    | 'Entertainment'
    | 'AI Tools'
    | 'Developer Tools'
    | 'Design'
    | 'Productivity'
    | 'Other';

const CATEGORIES: Category[] = [
  'Entertainment', 'AI Tools', 'Developer Tools',
  'Design', 'Productivity', 'Other',
];

const CATEGORY_COLORS: Record<Category, string> = {
  Entertainment: '#ff6b6b',
  'AI Tools': '#b8d4e3',
  'Developer Tools': '#e8def8',
  Design: '#f5c542',
  Productivity: '#95e1d3',
  Other: '#d4d4d4',
};

export default function CreateSubscriptionModal({
                                                  visible, onClose, onSubmit, appUserId, userRegion,
                                                }: CreateSubscriptionModalProps) {
  const { currencyCode } = useCurrencyStore();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  const [category, setCategory] = useState<Category>('Other');

  const isValidPrice = () => {
    const trimmed = price.trim();
    if (!trimmed) return false;
    if (!/^\s*[+-]?(\d+(\.\d+)?|\.\d+)\s*$/.test(trimmed)) return false;
    const num = Number(trimmed);
    return Number.isFinite(num) && num > 0;
  };

  const isValid = name.trim() !== '' && isValidPrice();

  const handleSubmit = () => {
    if (!isValid) return;
    const priceValue = Number(price.trim());
    const now = dayjs();
    const renewalDate = frequency === 'Monthly' ? now.add(1, 'month') : now.add(1, 'year');

    const newSubscription: Subscription = {
      id: `sub-${Date.now()}`,
      name: name.trim(),
      price: priceValue,
      currency: currencyCode,
      category,
      status: 'active',
      startDate: now.toISOString(),
      renewalDate: renewalDate.toISOString(),
      billing: frequency,
      color: CATEGORY_COLORS[category],
      // ✅ no icon
    };

    onSubmit(newSubscription);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setFrequency('Monthly');
    setCategory('Other');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}>
          <Pressable style={styles.overlay} onPress={handleClose}>
            <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>

              <View style={styles.header}>
                <Text style={styles.title}>New Subscription</Text>
                <Pressable style={styles.closeBtn} onPress={handleClose}>
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 32 }}>

                <View style={styles.field}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="e.g. Netflix, Spotify"
                      placeholderTextColor="rgba(0,0,0,0.4)"
                      value={name}
                      onChangeText={setName}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Price ({currencyCode})</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="0.00"
                      placeholderTextColor="rgba(0,0,0,0.4)"
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="decimal-pad"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Frequency</Text>
                  <View style={styles.pickerRow}>
                    {(['Monthly', 'Yearly'] as Frequency[]).map((f) => (
                        <Pressable
                            key={f}
                            style={[styles.pickerOption, frequency === f && styles.pickerOptionActive]}
                            onPress={() => setFrequency(f)}>
                          <Text style={[styles.pickerText, frequency === f && styles.pickerTextActive]}>
                            {f}
                          </Text>
                        </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryWrap}>
                    {CATEGORIES.map((cat) => (
                        <Pressable
                            key={cat}
                            style={[styles.chip, category === cat && styles.chipActive]}
                            onPress={() => setCategory(cat)}>
                          <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                            {cat}
                          </Text>
                        </Pressable>
                    ))}
                  </View>
                </View>

                <Pressable
                    style={[styles.addButton, !isValid && styles.addButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={!isValid}>
                  <Text style={styles.addButtonText}>Create Subscription</Text>
                </Pressable>

              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: 'center', justifyContent: 'center',
  },
  closeText: { fontSize: 14, fontFamily: 'sans-bold', color: colors.primary },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'sans-semibold', color: colors.primary },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'sans-medium',
    color: colors.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerRow: { flexDirection: 'row', gap: 12 },
  pickerOption: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
  },
  pickerOptionActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(234,122,83,0.08)',
  },
  pickerText: { fontSize: 14, fontFamily: 'sans-semibold', color: colors.mutedForeground },
  pickerTextActive: { color: colors.accent },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(234,122,83,0.08)',
  },
  chipText: { fontSize: 13, fontFamily: 'sans-semibold', color: colors.mutedForeground },
  chipTextActive: { color: colors.accent },
  addButton: {
    backgroundColor: colors.accent, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  addButtonDisabled: { opacity: 0.45 },
  addButtonText: { fontSize: 16, fontFamily: 'sans-bold', color: '#fff' },
});
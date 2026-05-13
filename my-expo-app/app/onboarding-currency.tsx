// app/onboarding-currency.tsx
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { COUNTRIES, useCurrencyStore } from '@/lib/currencyStore';
import { colors } from '@/constants/theme';
import { useState } from 'react';

const ONBOARDED_KEY = 'hasOnboarded';

export default function OnboardingCurrency() {
  const router = useRouter();
  const { setCurrency } = useCurrencyStore();
  const [selected, setSelected] = useState('USD');

  const handleContinue = async () => {
    const country = COUNTRIES.find((c) => c.code === selected);
    if (!country) return;
    await setCurrency(country.code, country.locale, country.country);
    await SecureStore.setItemAsync(ONBOARDED_KEY, 'true');
    router.replace('/(auth)/sign-in');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Currency</Text>
      <Text style={styles.subtitle}>Choose your local currency to track spending</Text>

      <FlatList
        data={COUNTRIES}
        keyExtractor={(item) => item.code}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected === item.code;
          return (
            <Pressable
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => setSelected(item.code)}>
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={styles.rowText}>
                <Text style={styles.country}>{item.country}</Text>
                <Text style={styles.currency}>{item.currency}</Text>
              </View>
              <Text style={styles.code}>{item.code}</Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 28,
    fontFamily: 'sans-extrabold',
    color: colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 20,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  rowSelected: { borderColor: colors.accent, backgroundColor: 'rgba(234,122,83,0.08)' },
  flag: { fontSize: 28, marginRight: 14 },
  rowText: { flex: 1 },
  country: { fontSize: 15, fontFamily: 'sans-semibold', color: colors.primary },
  currency: { fontSize: 13, fontFamily: 'sans-regular', color: colors.mutedForeground },
  code: { fontSize: 14, fontFamily: 'sans-bold', color: colors.mutedForeground },
  button: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontFamily: 'sans-bold', color: '#fff' },
});

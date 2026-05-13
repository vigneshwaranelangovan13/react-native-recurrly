// app/onboarding.tsx
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import images from '@/constants/images';

const { width, height } = Dimensions.get('window');

export const ONBOARDED_KEY = 'hasOnboarded';

export default function Onboarding() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Image source={images.splashPattern} style={styles.pattern} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.title}>Recurrly</Text>
        <Text style={styles.subtitle}>Track every subscription.{'\n'}Never overpay again.</Text>
        <Pressable style={styles.button} onPress={() => router.push('/onboarding-currency')}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  pattern: { ...StyleSheet.absoluteFillObject, width, height, opacity: 0.15 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 40, fontFamily: 'sans-extrabold', color: '#ffffff', marginBottom: 12 },
  subtitle: {
    fontSize: 18,
    fontFamily: 'sans-medium',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 48,
  },
  button: {
    backgroundColor: colors.accent,
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 32,
  },
  buttonText: { fontSize: 18, fontFamily: 'sans-bold', color: '#ffffff' },
});

import '@/global.css';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { icons } from '@/constants/icons';
import { colors } from '@/constants/theme';
import { formatCurrency } from '@/lib/utils';
import SubscriptionCard from '@/components/SubscriptionCard';
import { useSubscriptionStore } from '@/lib/subscriptionStore';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { subscriptions, cancelSubscription } = useSubscriptionStore();

  const handlePress = (item: Subscription) => {
    setExpandedId((current) => (current === item.id ? null : item.id));
  };

  const handleCancel = (id: string) => {
    cancelSubscription(id);
    setExpandedId(null);
  };

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const monthlyTotal = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        const monthly = s.billing === 'Yearly' ? s.price / 12 : s.price;
        return sum + monthly;
      }, 0);

  return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}>
            <Image source={icons.back} style={styles.headerIcon} resizeMode="contain" />
          </Pressable>
          <Text style={styles.headerTitle}>My Subscriptions</Text>
          {/* ✅ empty view to keep title centered */}
          <View style={{ width: 28 }} />
        </View>

        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{activeCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatCurrency(monthlyTotal)}</Text>
            <Text style={styles.summaryLabel}>Monthly</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{subscriptions.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>

        {/* List */}
        <FlatList
            data={subscriptions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <SubscriptionCard
                    {...item}
                    expanded={expandedId === item.id}
                    onPress={() => handlePress(item)}
                    onCancel={handleCancel}
                />
            )}
            extraData={expandedId}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No subscriptions yet.</Text>
                <Text style={styles.emptySubText}>
                  Go to Home and tap "+ Add" to add your first subscription.
                </Text>
              </View>
            }
        />

      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerIcon: { width: 28, height: 28 },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'sans-bold',
    color: colors.primary,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryValue: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'sans-medium',
    color: colors.mutedForeground,
    marginTop: 2,
  },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },
  listContent: { paddingHorizontal: 20, paddingBottom: 120 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: {
    textAlign: 'center',
    color: colors.primary,
    fontFamily: 'sans-bold',
    fontSize: 16,
  },
  emptySubText: {
    textAlign: 'center',
    color: colors.mutedForeground,
    fontFamily: 'sans-medium',
    fontSize: 14,
    paddingHorizontal: 40,
  },
});
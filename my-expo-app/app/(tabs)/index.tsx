// app/(tabs)/index.tsx
import '@/global.css';

import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOME_SUBSCRIPTIONS, computeBalance } from '@/constants/data';
import { formatCurrency } from '@/lib/utils';
import { colors } from '@/constants/theme';

import dayjs from 'dayjs';

import ListHeading from '@/components/ListHeading';
import SubscriptionCard from '@/components/SubscriptionCard';
import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import AddCreditCardModal, { CreditCard } from '@/components/AddCreditCardModal';
import CreditCardDueCard from '@/components/CreditCardDueCard';

import { useMemo, useState } from 'react';
import { useUser } from '@clerk/expo';
import { useUserStore } from '@/lib/userStore';

export default function App() {
  const { user } = useUser();
  const { appUser } = useUserStore();

  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCardModalVisible, setIsCardModalVisible] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);

  const displayName = useMemo(() => {
    if (user?.firstName?.trim()) return user.firstName.trim();
    if (user?.username?.trim()) return user.username.trim();
    const emailPrefix = user?.primaryEmailAddress?.emailAddress?.split('@')[0];
    if (emailPrefix) return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    return 'there';
  }, [user]);

  const { amount: balanceAmount, nextRenewalDate } = useMemo(
    () => computeBalance(subscriptions),
    [subscriptions]
  );

  const handleSubscriptionPress = (item: Subscription) => {
    setExpandedSubscriptionId((current) => (current === item.id ? null : item.id));
  };

  const handleRemoveSubscription = (id: string) => {
    setSubscriptions((current) => current.filter((s) => s.id !== id));
    setExpandedSubscriptionId(null);
  };

  const handleCreateSubscription = (newSubscription: Subscription) => {
    setSubscriptions((current) => [newSubscription, ...current]);
  };

  const handleAddCard = (card: CreditCard) => setCreditCards((c) => [card, ...c]);
  const handleRemoveCard = (id: string) => setCreditCards((c) => c.filter((x) => x.id !== id));

  return (
    // ✅ edges={['top']} — SafeAreaView only handles top notch, NOT bottom
    // This prevents it from painting over the tab bar area
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        ListHeaderComponent={() => (
          <>
            {/* Header — no "+" button */}
            <View className="home-header" style={{ paddingHorizontal: 20 }}>
              <Text className="home-user-name">Welcome, {displayName}</Text>
            </View>

            {/* Balance card */}
            <View style={{ paddingHorizontal: 20 }}>
              <View className="home-balance-card">
                <Text className="home-balance-label">Balance</Text>
                <View className="home-balance-row">
                  <Text className="home-balance-amount">{formatCurrency(balanceAmount)}</Text>
                  <Text className="home-balance-date">
                    {dayjs(nextRenewalDate).format('MM/DD')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Card Due Alerts */}
            <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}>
                <Text style={{ fontSize: 20, fontFamily: 'sans-bold', color: colors.primary }}>
                  Card Due Alerts
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}>
                  <Text
                    style={{ fontSize: 13, fontFamily: 'sans-semibold', color: colors.primary }}
                    onPress={() => setIsCardModalVisible(true)}>
                    + Add Card
                  </Text>
                </View>
              </View>

              {creditCards.length === 0 ? (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'sans-medium',
                    color: colors.mutedForeground,
                  }}>
                  No cards added yet. Tap "Add Card" to set billing reminders.
                </Text>
              ) : (
                <FlatList
                  data={creditCards}
                  renderItem={({ item }) => (
                    <CreditCardDueCard {...item} onRemove={handleRemoveCard} />
                  )}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              )}
            </View>

            {/* All Subscriptions with + Add button */}
            <View style={{ paddingHorizontal: 20 }}>
              <ListHeading
                title="All Subscriptions"
                actionLabel="+ Add"
                onAction={() => setIsModalVisible(true)}
              />
            </View>
          </>
        )}
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20 }}>
            <SubscriptionCard
              {...item}
              expanded={expandedSubscriptionId === item.id}
              onPress={() => handleSubscriptionPress(item)}
              onCancel={handleRemoveSubscription}
            />
          </View>
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
        // ✅ Explicit bottom padding — clears the floating tab bar (72px height + 20px margin + buffer)
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <CreateSubscriptionModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSubmit={handleCreateSubscription}
        appUserId={appUser?.id}
        userRegion={appUser?.region}
      />

      <AddCreditCardModal
        visible={isCardModalVisible}
        onClose={() => setIsCardModalVisible(false)}
        onAdd={handleAddCard}
      />
    </SafeAreaView>
  );
}

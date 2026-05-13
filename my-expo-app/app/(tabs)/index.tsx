import '@/global.css';
import { FlatList, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency } from '@/lib/utils';
import { colors } from '@/constants/theme';
import { computeBalance } from '@/constants/data';
import dayjs from 'dayjs';
import ListHeading from '@/components/ListHeading';
import SubscriptionCard from '@/components/SubscriptionCard';
import CreateSubscriptionModal from '@/components/CreateSubscriptionModal';
import AddCreditCardModal, { CreditCard } from '@/components/AddCreditCardModal';
import CreditCardDueCard from '@/components/CreditCardDueCard';
import UploadStatementModal from '@/components/UploadStatementModal'; // ✅ new
import { useMemo, useState } from 'react';
import { useUser } from '@clerk/expo';
import { useUserStore } from '@/lib/userStore';
import { useSubscriptionStore } from '@/lib/subscriptionStore';

export default function App() {
    const { user } = useUser();
    const { appUser } = useUserStore();
    const { subscriptions, addSubscription, removeSubscription } = useSubscriptionStore();

    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCardModalVisible, setIsCardModalVisible] = useState(false);
    const [isUploadModalVisible, setIsUploadModalVisible] = useState(false); // ✅ new
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
        removeSubscription(id);
        setExpandedSubscriptionId(null);
    };

    const handleCreateSubscription = (newSubscription: Subscription) => {
        addSubscription(newSubscription);
    };

    const handleAddCard = (card: CreditCard) => setCreditCards((c) => [card, ...c]);
    const handleRemoveCard = (id: string) => setCreditCards((c) => c.filter((x) => x.id !== id));

    return (
        <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                ListHeaderComponent={() => (
                    <>
                        {/* Header with upload button */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                        }}>
                            <Text className="home-user-name">Welcome, {displayName}</Text>

                            {/* ✅ Upload button */}
                            <Pressable
                                onPress={() => setIsUploadModalVisible(true)}
                                style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 6,
                                    backgroundColor: colors.card,
                                    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
                                    borderWidth: 1, borderColor: colors.border,
                                }}>
                                <Text style={{ fontSize: 16 }}>📎</Text>
                                <Text style={{ fontSize: 13, fontFamily: 'sans-semibold', color: colors.primary }}>
                                    Scan
                                </Text>
                            </Pressable>
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
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'space-between', marginBottom: 12,
                            }}>
                                <Text style={{ fontSize: 20, fontFamily: 'sans-bold', color: colors.primary }}>
                                    Card Due Alerts
                                </Text>
                                <View style={{
                                    borderWidth: 1, borderColor: colors.border,
                                    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                                }}>
                                    <Text
                                        style={{ fontSize: 13, fontFamily: 'sans-semibold', color: colors.primary }}
                                        onPress={() => setIsCardModalVisible(true)}>
                                        + Add Card
                                    </Text>
                                </View>
                            </View>

                            {creditCards.length === 0 ? (
                                <Text style={{ fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground }}>
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

                        {/* All Subscriptions */}
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
                ListEmptyComponent={
                    <Text style={{
                        textAlign: 'center', color: colors.mutedForeground,
                        fontFamily: 'sans-medium', fontSize: 14, marginTop: 40,
                    }}>
                        No subscriptions yet. Tap "+ Add" to get started.
                    </Text>
                }
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

            {/* ✅ Upload modal */}
            <UploadStatementModal
                visible={isUploadModalVisible}
                onClose={() => setIsUploadModalVisible(false)}
            />
        </SafeAreaView>
    );
}
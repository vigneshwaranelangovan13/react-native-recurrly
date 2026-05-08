import "@/global.css";

import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

import images from "@/constants/images";
import { HOME_BALANCE, HOME_SUBSCRIPTIONS } from "@/constants/data";
import { icons } from "@/constants/icons";
import { formatCurrency } from "@/lib/utils";

import dayjs from "dayjs";

import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import SubscriptionCard from "@/components/SubscriptionCard";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";

import { useMemo, useState } from "react";

// ❌ Subscription store removed for now
// import { useSubscriptionStore } from "@/lib/subscriptionStore";

// ❌ Clerk removed
// import { useUser } from "@clerk/expo";

// ❌ PostHog removed
// import { usePostHog } from "posthog-react-native";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    // ❌ Clerk user removed
    // const { user } = useUser();

    // ❌ PostHog analytics removed
    // const posthog = usePostHog();

    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
        string | null
    >(null);

    const [isModalVisible, setIsModalVisible] = useState(false);

    // ❌ Zustand subscription store removed for now
    // const { subscriptions, addSubscription } = useSubscriptionStore();

    // ✅ Temporary local state instead of subscription store
    const [subscriptions, setSubscriptions] =
        useState<Subscription[]>(HOME_SUBSCRIPTIONS);

    // Get upcoming subscriptions:
    // active subscriptions with renewal date within next 7 days
    const upcomingSubscriptions = useMemo(() => {
        const now = dayjs();
        const nextWeek = now.add(7, "days");

        return subscriptions
            .filter(
                (sub) =>
                    sub.status === "active" &&
                    dayjs(sub.renewalDate).isAfter(now) &&
                    dayjs(sub.renewalDate).isBefore(nextWeek)
            )
            .sort((a, b) => dayjs(a.renewalDate).diff(dayjs(b.renewalDate)));
    }, [subscriptions]);

    const handleSubscriptionPress = (item: Subscription) => {
        setExpandedSubscriptionId((currentId) =>
            currentId === item.id ? null : item.id
        );

        // ❌ PostHog tracking removed
        // posthog.capture("subscription_expanded", {
        //   subscription_name: item.name,
        //   subscription_id: item.id,
        // });
    };

    const handleCreateSubscription = (newSubscription: Subscription) => {
        // ❌ Zustand addSubscription removed for now
        // addSubscription(newSubscription);

        // ✅ Add new subscription using local React state
        setSubscriptions((currentSubscriptions) => [
            newSubscription,
            ...currentSubscriptions,
        ]);

        // ❌ PostHog tracking removed
        // posthog.capture("subscription_created", {
        //   subscription_name: newSubscription.name,
        //   subscription_price: newSubscription.price,
        //   subscription_frequency: newSubscription.frequency,
        //   subscription_category: newSubscription.category,
        // });
    };

    // Temporary static user name instead of Clerk user name
    const displayName = "Vignesh";

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <FlatList
                ListHeaderComponent={() => (
                    <>
                        {/* Header */}
                        <View className="home-header">
                            <View className="home-user">
                                {/* Static avatar instead of Clerk user image */}
                                <Image source={images.avatar} className="home-avatar" />

                                <Text className="home-user-name">{displayName}</Text>
                            </View>

                            <Pressable onPress={() => setIsModalVisible(true)}>
                                <Image source={icons.add} className="home-add-icon" />
                            </Pressable>
                        </View>

                        {/* Balance Card */}
                        <View className="home-balance-card">
                            <Text className="home-balance-label">Balance</Text>

                            <View className="home-balance-row">
                                <Text className="home-balance-amount">
                                    {formatCurrency(HOME_BALANCE.amount)}
                                </Text>

                                <Text className="home-balance-date">
                                    {dayjs(HOME_BALANCE.nextRenewalDate).format("MM/DD")}
                                </Text>
                            </View>
                        </View>

                        {/* Upcoming Subscriptions */}
                        <View className="mb-5">
                            <ListHeading title="Upcoming" />

                            <FlatList
                                data={upcomingSubscriptions}
                                renderItem={({ item }) => <UpcomingSubscriptionCard {...item} />}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                ListEmptyComponent={
                                    <Text className="home-empty-state">
                                        No upcoming renewals yet.
                                    </Text>
                                }
                            />
                        </View>

                        {/* All Subscriptions Heading */}
                        <ListHeading title="All Subscriptions" />
                    </>
                )}
                data={subscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedSubscriptionId === item.id}
                        onPress={() => handleSubscriptionPress(item)}
                    />
                )}
                extraData={expandedSubscriptionId}
                ItemSeparatorComponent={() => <View className="h-4" />}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <Text className="home-empty-state">No subscriptions yet.</Text>
                }
                contentContainerClassName="pb-30"
            />

            {/* Create Subscription Modal */}
            <CreateSubscriptionModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleCreateSubscription}
            />
        </SafeAreaView>
    );
}
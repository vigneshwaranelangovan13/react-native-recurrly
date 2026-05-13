import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recurrly_subscriptions';

interface SubscriptionStore {
    subscriptions: Subscription[];
    addSubscription: (subscription: Subscription) => void;
    cancelSubscription: (id: string) => void;
    removeSubscription: (id: string) => void;
    setSubscriptions: (subscriptions: Subscription[]) => void;
    loadSubscriptions: () => Promise<void>;
}

// ✅ helper — saves to AsyncStorage after every change
const saveToStorage = async (subscriptions: Subscription[]) => {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
        console.log('[SubscriptionStore] saved', subscriptions.length, 'subscriptions');
    } catch (err) {
        console.error('[SubscriptionStore] save error:', err);
    }
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
    subscriptions: [],

    // ✅ load from AsyncStorage on app start
    loadSubscriptions: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                console.log('[SubscriptionStore] loaded', parsed.length, 'subscriptions');
                set({ subscriptions: parsed });
            } else {
                console.log('[SubscriptionStore] no saved subscriptions found');
            }
        } catch (err) {
            console.error('[SubscriptionStore] load error:', err);
        }
    },

    addSubscription: (subscription) => {
        const updated = [subscription, ...get().subscriptions];
        set({ subscriptions: updated });
        saveToStorage(updated);
    },

    cancelSubscription: (id) => {
        const updated = get().subscriptions.map((sub) =>
            sub.id === id ? { ...sub, status: 'cancelled' as const } : sub
        );
        set({ subscriptions: updated });
        saveToStorage(updated);
    },

    removeSubscription: (id) => {
        const updated = get().subscriptions.filter((sub) => sub.id !== id);
        set({ subscriptions: updated });
        saveToStorage(updated);
    },

    setSubscriptions: (subscriptions) => {
        set({ subscriptions });
        saveToStorage(subscriptions);
    },
}));
import { create } from 'zustand';

interface SubscriptionStore {
    subscriptions: Subscription[];
    addSubscription: (subscription: Subscription) => void;
    cancelSubscription: (id: string) => void;
    removeSubscription: (id: string) => void;
    setSubscriptions: (subscriptions: Subscription[]) => void;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
    subscriptions: [], // ✅ start empty — no hardcoded data

    addSubscription: (subscription) =>
        set((state) => ({
            subscriptions: [subscription, ...state.subscriptions],
        })),

    cancelSubscription: (id) =>
        set((state) => ({
            subscriptions: state.subscriptions.map((sub) =>
                sub.id === id ? { ...sub, status: 'cancelled' as const } : sub
            ),
        })),

    removeSubscription: (id) =>
        set((state) => ({
            subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        })),

    setSubscriptions: (subscriptions) => set({ subscriptions }),
}));
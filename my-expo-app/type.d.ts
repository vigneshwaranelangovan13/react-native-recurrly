import { ImageSourcePropType } from 'react-native';

declare global {
  interface AppTab {
    name: string;
    title: string;
    icon: ImageSourcePropType;
  }

  interface Subscription {
    id: string;
    icon?: ImageSourcePropType | string; // ✅ optional
    name: string;
    price: number;
    currency: string;
    billing: string;
    category?: string;
    plan?: string;
    paymentMethod?: string;
    status: 'active' | 'paused' | 'cancelled';
    startDate: string;
    renewalDate?: string;
    color?: string;
  }

  interface UpcomingSubscription {
    id: string;
    icon: ImageSourcePropType;
    name: string;
    price: number;
    currency: string;
    daysLeft: number;
  }

  interface ListHeadingProps {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }

  interface TabIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
  }

  interface SubscriptionCardProps extends Subscription {
    expanded?: boolean;
    onPress?: () => void;
    onCancel?: (id: string) => void;
  }

  interface SupabaseGroup {
    id: string;
    unique_code: string;
    owner_id: string;
    subscription_name: string;
    emoji: string;
    max_members: number;
    current_members: number;
    region: string;
    description: string;
    card_color: string;
    status: 'open' | 'full' | 'closed';
    created_at: string;
    owner?: {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      region: string;
    };
  }

  interface SupabaseMember {
    id: string;
    group_id: string;
    user_id: string;
    status: 'pending' | 'approved' | 'rejected';
    requested_at: string;
    responded_at?: string;
    user?: {
      id: string;
      full_name: string;
      email: string;
      phone: string | null;
      region: string;
    };
  }
}

export {};
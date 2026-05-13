// lib/userStore.ts
import { create } from 'zustand';
import { supabase } from './supabase';

export interface AppUser {
  id: string;
  clerk_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  region: string;
}

interface UserStore {
  appUser: AppUser | null;
  isLoading: boolean;
  syncUser: (clerkUserId: string, fullName: string, email: string, region: string) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  appUser: null,
  isLoading: false,

  syncUser: async (clerkUserId, fullName, email, region) => {
    set({ isLoading: true });

    // ✅ Debug — confirm which Supabase project is being hit
    console.log('[syncUser] URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('[syncUser] clerkUserId:', clerkUserId);
    console.log('[syncUser] email:', email, '| region:', region);

    // ✅ maybeSingle() — returns null data without error when 0 rows
    const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

    if (selectError) {
      console.error('[syncUser] SELECT error message:', selectError?.message);
      console.error('[syncUser] SELECT error code:', selectError?.code);
      console.error('[syncUser] SELECT error hint:', selectError?.hint);
      console.error('[syncUser] SELECT error details:', selectError?.details);
      set({ isLoading: false });
      return;
    }

    if (existing) {
      console.log('[syncUser] existing user found:', existing.id);
      set({ appUser: existing, isLoading: false });
      return;
    }

    // No user found — insert new row
    console.log('[syncUser] no existing user — inserting new row');
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: clerkUserId,
          full_name: fullName,
          email,
          region,
        })
        .select()
        .single();

    if (insertError) {
      console.error('[syncUser] INSERT error message:', insertError?.message);
      console.error('[syncUser] INSERT error code:', insertError?.code);
      console.error('[syncUser] INSERT error hint:', insertError?.hint);
      console.error('[syncUser] INSERT error details:', insertError?.details);
      set({ isLoading: false });
      return;
    }

    console.log('[syncUser] new user created:', newUser?.id);
    set({ appUser: newUser, isLoading: false });
  },

  updatePhone: async (phone) => {
    const { appUser } = get();
    if (!appUser) return;

    const { error } = await supabase
        .from('users')
        .update({ phone })
        .eq('id', appUser.id);

    if (error) {
      console.error('[updatePhone] error message:', error?.message);
      console.error('[updatePhone] error code:', error?.code);
      return;
    }

    console.log('[updatePhone] phone updated successfully');
    set({ appUser: { ...appUser, phone } });
  },
}));
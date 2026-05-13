// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// ✅ Hardcoded temporarily to test connection
// Replace with env vars once confirmed working
export const supabase = createClient(
    'https://bpjlvaunludkfbxouduw.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamx2YXVubHVka2ZieG91ZHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDYwMDUsImV4cCI6MjA5MzkyMjAwNX0.VikLbF07ryaODBcW0F5bvXovD0epdiUMaD6FnbH756w',
    {
        auth: {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    }
);
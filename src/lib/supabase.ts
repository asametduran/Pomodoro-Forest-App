import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { authStorage } from './secure-storage';

/**
 * Supabase client for auth + cloud sync. Only the public URL and anon key are ever shipped to the
 * app; every table is protected by Row Level Security (see supabase/migrations).
 *
 * If the env vars are missing the app keeps working in local-only guest mode.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey && /^https:\/\//.test(url));

if (!isSupabaseConfigured && __DEV__) {
  console.warn('[supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing: cloud sync disabled.');
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        flowType: 'pkce',
        storage: authStorage,
        autoRefreshToken: true,
        persistSession: true,
        // Web receives ?code= redirects in the page URL; native gets them through deep links.
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

// Native: refresh tokens only while the app is in the foreground (Expo + Supabase guidance).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  fromProfileRow,
  fromSessionRow,
  mergeProfile,
  mergeSessions,
  sessionsToUpload,
  toProfileRow,
  toSessionRow,
  type ProfileFields,
  type ProfileRow,
  type SessionRow,
} from '@/lib/sync';
import { useAppStore, type AppState } from '@/store/app-store';

export type AuthStatus = 'disabled' | 'loading' | 'guest' | 'signedIn';

interface Result {
  ok: boolean;
  message: string;
}

interface AuthState {
  status: AuthStatus;
  user: User | null;
  syncing: boolean;
  syncError: string | null;
  /** True after a password-reset link was opened: the user must choose a new password. */
  recovering: boolean;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
  syncNow: () => Promise<void>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

function validate(email: string, password?: string): string | null {
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address.';
  if (password !== undefined && password.length < MIN_PASSWORD) {
    return `Use at least ${MIN_PASSWORD} characters for your password.`;
  }
  return null;
}

/** Auth errors are shown to the user; anything else gets a generic message (no internals leaked). */
function friendly(error: unknown): string {
  const message = typeof error === 'object' && error && 'message' in error ? String(error.message) : '';
  if (/invalid login credentials/i.test(message)) return 'That email and password do not match.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox.';
  if (/already registered|already exists/i.test(message)) return 'An account with this email already exists. Try signing in.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.';
  if (/password/i.test(message) && message.length < 160) return message;
  return 'Something went wrong. Please try again.';
}

/** Where auth emails (confirm sign-up, reset password) send the user back to. */
function redirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return Linking.createURL('/');
}

const profileOf = (s: AppState): ProfileFields => ({
  coins: s.coins,
  selectedSpecies: s.selectedSpecies,
  unlockedSpecies: s.unlockedSpecies,
  focusStreak: s.focusStreak,
  settings: s.settings,
});

/** Set while cloud data is being written into the local store, so it is not mistaken for user edits. */
let applyingRemote = false;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<void> | null = null;

async function runSync(userId: string): Promise<void> {
  if (!supabase) return;
  const app = useAppStore.getState();
  const firstSyncForUser = app.syncedUserId !== userId;

  const [profileRes, sessionsRes] = await Promise.all([
    supabase.from('pomodoro_profiles').select('*').eq('user_id', userId).maybeSingle<ProfileRow>(),
    supabase.from('pomodoro_sessions').select('*').eq('user_id', userId).order('ended_at', { ascending: true }).limit(5000),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (sessionsRes.error) throw sessionsRes.error;

  const remoteSessions = ((sessionsRes.data ?? []) as SessionRow[]).map(fromSessionRow);
  const upload = sessionsToUpload(app.sessions, new Set(remoteSessions.map((s) => s.id)));
  if (upload.length) {
    const { error } = await supabase.from('pomodoro_sessions').upsert(upload.map((s) => toSessionRow(s, userId)), { onConflict: 'id' });
    if (error) throw error;
  }

  const { profile, upload: uploadProfile } = mergeProfile({
    local: profileOf(app),
    remote: profileRes.data ? fromProfileRow(profileRes.data) : null,
    firstSyncForUser,
    localDirty: app.profileDirty,
  });
  if (uploadProfile) {
    const { error } = await supabase.from('pomodoro_profiles').upsert(toProfileRow(profile, userId), { onConflict: 'user_id' });
    if (error) throw error;
  }

  // Re-read in case the user changed something while the requests were in flight: those edits
  // stay local (and dirty) so the next sync uploads them instead of overwriting them.
  const latest = useAppStore.getState();
  const changedMeanwhile =
    latest.coins !== app.coins ||
    latest.selectedSpecies !== app.selectedSpecies ||
    latest.unlockedSpecies !== app.unlockedSpecies ||
    latest.focusStreak !== app.focusStreak ||
    latest.settings !== app.settings;
  applyingRemote = true;
  try {
    latest.applyCloud({
      sessions: mergeSessions(latest.sessions, remoteSessions),
      ...(changedMeanwhile ? {} : profile),
      syncedUserId: userId,
      profileDirty: changedMeanwhile,
      lastSyncAt: Date.now(),
    });
  } finally {
    applyingRemote = false;
  }
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: isSupabaseConfigured ? 'loading' : 'disabled',
  user: null,
  syncing: false,
  syncError: null,
  recovering: false,

  signUp: async (email, password) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not configured.' };
    const invalid = validate(email, password);
    if (invalid) return { ok: false, message: invalid };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) return { ok: false, message: friendly(error) };
    return data.session
      ? { ok: true, message: 'Welcome! Your forest is now backed up.' }
      : { ok: true, message: 'Check your inbox to confirm your email, then sign in.' };
  },

  signIn: async (email, password) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not configured.' };
    const invalid = validate(email, password.length ? password : 'x'.repeat(MIN_PASSWORD));
    if (invalid) return { ok: false, message: invalid };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { ok: false, message: friendly(error) };
    return { ok: true, message: 'Signed in. Syncing your forest…' };
  },

  signOut: async () => {
    if (!supabase) return;
    const user = get().user;
    // Push anything not yet uploaded, then clear this device's copy (it lives in the cloud now).
    if (user) await get().syncNow();
    await supabase.auth.signOut();
    applyingRemote = true;
    try {
      useAppStore.getState().resetAll();
    } finally {
      applyingRemote = false;
    }
    set({ user: null, status: 'guest', recovering: false });
  },

  sendPasswordReset: async (email) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not configured.' };
    const invalid = validate(email);
    if (invalid) return { ok: false, message: invalid };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() });
    // Same answer whether or not the account exists, so emails cannot be probed.
    if (error && /rate limit|too many/i.test(error.message)) return { ok: false, message: friendly(error) };
    return { ok: true, message: 'If that email has an account, a reset link is on its way.' };
  },

  updatePassword: async (password) => {
    if (!supabase) return { ok: false, message: 'Cloud sync is not configured.' };
    if (password.length < MIN_PASSWORD) return { ok: false, message: `Use at least ${MIN_PASSWORD} characters.` };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: friendly(error) };
    set({ recovering: false });
    return { ok: true, message: 'Password updated.' };
  },

  syncNow: async () => {
    const user = get().user;
    if (!supabase || !user) return;
    if (syncInFlight) return syncInFlight;
    set({ syncing: true, syncError: null });
    syncInFlight = runSync(user.id)
      .catch(() => set({ syncError: "Couldn't sync right now. We'll try again." }))
      .finally(() => {
        syncInFlight = null;
        set({ syncing: false });
      });
    return syncInFlight;
  },
}));

function scheduleSync(delayMs: number) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    useAuthStore.getState().syncNow();
  }, delayMs);
}

/** Mount once at the app root: tracks the auth session, handles auth deep links and keeps data in sync. */
export function useAuthBootstrap() {
  useEffect(() => {
    if (!supabase) return;
    const client = supabase;

    const { data: authSub } = client.auth.onAuthStateChange((event, session) => {
      useAuthStore.setState((s) => ({
        user: session?.user ?? null,
        status: session ? 'signedIn' : 'guest',
        recovering: event === 'PASSWORD_RECOVERY' ? true : event === 'SIGNED_OUT' ? false : s.recovering,
      }));
      // Never await Supabase calls inside this callback; defer the sync instead.
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) scheduleSync(300);
    });

    // Native: confirmation / reset emails open the app with ?code=… (PKCE). Web handles this itself.
    const handleUrl = (url: string | null) => {
      if (!url || Platform.OS === 'web') return;
      const code = Linking.parse(url).queryParams?.code;
      if (typeof code === 'string' && code.length > 0) {
        client.auth.exchangeCodeForSession(code).catch(() => undefined);
      }
    };
    Linking.getInitialURL().then(handleUrl).catch(() => undefined);
    const linkSub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    // Local edits: mark the profile dirty and push changes shortly after.
    const unsubscribe = useAppStore.subscribe((next, prev) => {
      if (applyingRemote) return;
      const profileChanged =
        next.coins !== prev.coins ||
        next.selectedSpecies !== prev.selectedSpecies ||
        next.unlockedSpecies !== prev.unlockedSpecies ||
        next.focusStreak !== prev.focusStreak ||
        next.settings !== prev.settings;
      if (profileChanged && !next.profileDirty) useAppStore.setState({ profileDirty: true });
      if ((profileChanged || next.sessions !== prev.sessions) && useAuthStore.getState().user) scheduleSync(2000);
    });

    return () => {
      authSub.subscription.unsubscribe();
      linkSub.remove();
      unsubscribe();
      if (syncTimer) clearTimeout(syncTimer);
    };
  }, []);
}

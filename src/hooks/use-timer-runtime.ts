import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { alertTimerEnd } from '@/lib/alerts';
import { useAppStore } from '@/store/app-store';

const KEEP_AWAKE_TAG = 'forest-timer';

/**
 * Mount once at the app root. Finishes timers when their end time passes (including after a
 * reload), withers trees when the user leaves in strict mode, and keeps the screen awake.
 */
export function useTimerRuntime() {
  const hasActive = useAppStore((s) => s.active !== null);

  // Finish timers from a stored end timestamp, so backgrounding/reloads stay accurate.
  useEffect(() => {
    const check = () => {
      const { active, settings, tickFinish } = useAppStore.getState();
      if (!active) return;
      if (tickFinish()) alertTimerEnd(settings, { kind: active.kind });
    };
    check();
    if (!hasActive) return;
    const id = setInterval(check, 500);
    return () => clearInterval(id);
  }, [hasActive]);

  // Leaving the app (native) or the tab (web) starts the withering grace period.
  useEffect(() => {
    const left = () => useAppStore.getState().markAway();
    const returned = () => {
      const before = useAppStore.getState();
      const wasFocus = before.active?.kind === 'focus';
      before.returnFromAway();
      const after = useAppStore.getState();
      if (wasFocus && !after.active && after.lastResult?.status === 'withered') {
        alertTimerEnd(after.settings, { kind: 'focus', withered: true });
      }
    };

    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return;
      const onVisibility = () => (document.hidden ? left() : returned());
      document.addEventListener('visibilitychange', onVisibility);
      return () => document.removeEventListener('visibilitychange', onVisibility);
    }

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') left();
      else if (state === 'active') returned();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!hasActive) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [hasActive]);
}

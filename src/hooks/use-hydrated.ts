import { useSyncExternalStore } from 'react';

import { useAppStore } from '@/store/app-store';

const subscribe = (onChange: () => void) => useAppStore.persist.onFinishHydration(onChange);
const getSnapshot = () => useAppStore.persist.hasHydrated();

/** True once the persisted store has been loaded from storage. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

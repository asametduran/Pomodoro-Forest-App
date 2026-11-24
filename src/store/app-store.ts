import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import * as engine from '@/lib/engine';
import type { AppData, Settings, TagId, TimerKind } from '@/lib/types';

/** No-op storage for environments without `window` (static web rendering). */
const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

interface Actions {
  startFocus: () => void;
  startBreak: (kind?: TimerKind) => void;
  endBreak: () => void;
  giveUp: () => void;
  /** Finish the active timer if its end time has passed. Returns true if it finished. */
  tickFinish: () => boolean;
  markAway: () => void;
  returnFromAway: () => void;
  dismissResult: () => void;
  selectTag: (tag: TagId) => void;
  selectSpecies: (id: string) => void;
  unlockSpecies: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  /** Apply data that came from the cloud (does not mark the profile dirty). */
  applyCloud: (patch: Partial<AppData>) => void;
}

export type AppState = AppData & Actions;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...engine.createInitialData(),
      startFocus: () => set(engine.startFocus(get(), Date.now())),
      startBreak: (kind) => set(engine.startBreak(get(), Date.now(), kind)),
      endBreak: () => set(engine.endBreak(get())),
      giveUp: () => set(engine.giveUp(get(), Date.now(), randomUUID())),
      tickFinish: () => {
        const before = get();
        const after = engine.finishActive(before, Date.now(), randomUUID());
        if (after === before) return false;
        set(after);
        return true;
      },
      markAway: () => set(engine.markAway(get(), Date.now())),
      returnFromAway: () => set(engine.returnFromAway(get(), Date.now(), randomUUID())),
      dismissResult: () => set(engine.dismissResult(get())),
      selectTag: (tag) => set(engine.selectTag(get(), tag)),
      selectSpecies: (id) => set(engine.selectSpecies(get(), id)),
      unlockSpecies: (id) => set(engine.unlockSpecies(get(), id)),
      updateSettings: (patch) => set(engine.updateSettings(get(), patch)),
      resetAll: () => set(engine.createInitialData()),
      applyCloud: (patch) => set(patch),
    }),
    {
      name: 'forest-pomodoro/v1',
      version: 1,
      storage: createJSONStorage(() => (typeof window === 'undefined' ? noopStorage : AsyncStorage)),
      partialize: (state): AppData => ({
        settings: state.settings,
        sessions: state.sessions,
        coins: state.coins,
        unlockedSpecies: state.unlockedSpecies,
        selectedSpecies: state.selectedSpecies,
        selectedTag: state.selectedTag,
        active: state.active,
        focusStreak: state.focusStreak,
        lastResult: state.lastResult,
        syncedUserId: state.syncedUserId,
        profileDirty: state.profileDirty,
        lastSyncAt: state.lastSyncAt,
      }),
      // Newer defaults survive older saved data.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<AppData>;
        return { ...current, ...saved, settings: { ...current.settings, ...saved.settings } };
      },
    },
  ),
);

export type TagId = 'study' | 'coding' | 'work' | 'reading';

export const TAGS: readonly { id: TagId; label: string }[] = [
  { id: 'study', label: 'Study' },
  { id: 'coding', label: 'Coding' },
  { id: 'work', label: 'Work' },
  { id: 'reading', label: 'Reading' },
];

export type SessionStatus = 'completed' | 'withered';
export type WitherReason = 'gave_up' | 'left_app';
export type TimerKind = 'focus' | 'shortBreak' | 'longBreak';

/** One finished focus session. Sync-ready: stable UUID + epoch-ms timestamps. */
export interface Session {
  id: string;
  startedAt: number;
  endedAt: number;
  plannedSeconds: number;
  actualSeconds: number;
  tag: TagId;
  speciesId: string;
  status: SessionStatus;
  reason?: WitherReason;
  coinsEarned: number;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** Take a long break after this many completed focus sessions. */
  longBreakEvery: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Leaving the app/tab for longer than `graceSeconds` withers the tree. */
  strictMode: boolean;
  graceSeconds: number;
}

export interface ActiveTimer {
  kind: TimerKind;
  startedAt: number;
  endAt: number;
  plannedSeconds: number;
  tag: TagId;
  speciesId: string;
  /** When the app/tab went to the background (focus + strict mode only). */
  awayAt: number | null;
}

export interface AppData {
  settings: Settings;
  sessions: Session[];
  coins: number;
  unlockedSpecies: string[];
  selectedSpecies: string;
  selectedTag: TagId;
  active: ActiveTimer | null;
  /** Completed focus sessions since the last long break. */
  focusStreak: number;
  /** Most recent finished session, shown as a result card until dismissed. */
  lastResult: Session | null;
  /** Supabase user this local data was last synced with (null = guest data never synced). */
  syncedUserId: string | null;
  /** Coins / species / settings changed locally since the last successful upload. */
  profileDirty: boolean;
  /** Epoch ms of the last successful cloud sync. */
  lastSyncAt: number | null;
}

import { coinsForSession } from './coins';
import { getSpecies, DEFAULT_SPECIES_ID, SPECIES } from './species';
import { nextBreakKind } from './timer';
import type {
  ActiveTimer,
  AppData,
  Session,
  Settings,
  TagId,
  TimerKind,
  WitherReason,
} from './types';

export const DEFAULT_SETTINGS: Settings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  soundEnabled: true,
  hapticsEnabled: true,
  strictMode: true,
  graceSeconds: 10,
};

export const SETTING_LIMITS = {
  focusMinutes: { min: 1, max: 180 },
  shortBreakMinutes: { min: 1, max: 60 },
  longBreakMinutes: { min: 1, max: 120 },
  longBreakEvery: { min: 2, max: 8 },
  graceSeconds: { min: 0, max: 60 },
} as const;

export function createInitialData(): AppData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    sessions: [],
    coins: 0,
    unlockedSpecies: [DEFAULT_SPECIES_ID],
    selectedSpecies: DEFAULT_SPECIES_ID,
    selectedTag: 'study',
    active: null,
    focusStreak: 0,
    lastResult: null,
    syncedUserId: null,
    profileDirty: false,
    lastSyncAt: null,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function updateSettings(data: AppData, patch: Partial<Settings>): AppData {
  const next: Settings = { ...data.settings, ...patch };
  for (const key of Object.keys(SETTING_LIMITS) as (keyof typeof SETTING_LIMITS)[]) {
    const { min, max } = SETTING_LIMITS[key];
    next[key] = clamp(next[key], min, max);
  }
  return { ...data, settings: next };
}

export function selectTag(data: AppData, tag: TagId): AppData {
  return { ...data, selectedTag: tag };
}

export function selectSpecies(data: AppData, speciesId: string): AppData {
  if (!data.unlockedSpecies.includes(speciesId)) return data;
  return { ...data, selectedSpecies: speciesId };
}

/** Spend coins to unlock a species. No-op if already unlocked, unknown, or unaffordable. */
export function unlockSpecies(data: AppData, speciesId: string): AppData {
  const species = SPECIES.find((s) => s.id === speciesId);
  if (!species || data.unlockedSpecies.includes(speciesId) || data.coins < species.cost) {
    return data;
  }
  return {
    ...data,
    coins: data.coins - species.cost,
    unlockedSpecies: [...data.unlockedSpecies, speciesId],
  };
}

export function startFocus(data: AppData, now: number): AppData {
  if (data.active) return data;
  const plannedSeconds = data.settings.focusMinutes * 60;
  const active: ActiveTimer = {
    kind: 'focus',
    startedAt: now,
    endAt: now + plannedSeconds * 1000,
    plannedSeconds,
    tag: data.selectedTag,
    speciesId: getSpecies(data.selectedSpecies).id,
    awayAt: null,
  };
  return { ...data, active, lastResult: null };
}

export function startBreak(data: AppData, now: number, kind?: TimerKind): AppData {
  if (data.active) return data;
  const breakKind: TimerKind =
    kind && kind !== 'focus'
      ? kind
      : nextBreakKind(data.focusStreak, data.settings.longBreakEvery);
  const minutes =
    breakKind === 'longBreak' ? data.settings.longBreakMinutes : data.settings.shortBreakMinutes;
  const plannedSeconds = minutes * 60;
  const active: ActiveTimer = {
    kind: breakKind,
    startedAt: now,
    endAt: now + plannedSeconds * 1000,
    plannedSeconds,
    tag: data.selectedTag,
    speciesId: data.selectedSpecies,
    awayAt: null,
  };
  return {
    ...data,
    active,
    lastResult: null,
    focusStreak: breakKind === 'longBreak' ? 0 : data.focusStreak,
  };
}

/** Stop a break early. */
export function endBreak(data: AppData): AppData {
  if (!data.active || data.active.kind === 'focus') return data;
  return { ...data, active: null };
}

/**
 * Finish the active timer if its end time has passed. Focus sessions become a completed
 * tree (and earn coins); breaks just end.
 */
export function finishActive(data: AppData, now: number, newId: string): AppData {
  const a = data.active;
  if (!a || now < a.endAt) return data;
  if (a.kind !== 'focus') return { ...data, active: null };

  const coinsEarned = coinsForSession(a.plannedSeconds);
  const session: Session = {
    id: newId,
    startedAt: a.startedAt,
    endedAt: a.endAt,
    plannedSeconds: a.plannedSeconds,
    actualSeconds: a.plannedSeconds,
    tag: a.tag,
    speciesId: a.speciesId,
    status: 'completed',
    coinsEarned,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...data,
    active: null,
    sessions: [...data.sessions, session],
    coins: data.coins + coinsEarned,
    focusStreak: data.focusStreak + 1,
    lastResult: session,
  };
}

/** Abandon the active focus session: the tree withers and is logged. `at` is when it died. */
export function giveUp(
  data: AppData,
  now: number,
  newId: string,
  reason: WitherReason = 'gave_up',
  at: number = now,
): AppData {
  const a = data.active;
  if (!a || a.kind !== 'focus') return data;

  const elapsed = Math.max(0, Math.min(at, a.endAt) - a.startedAt);
  const session: Session = {
    id: newId,
    startedAt: a.startedAt,
    endedAt: Math.min(at, a.endAt),
    plannedSeconds: a.plannedSeconds,
    actualSeconds: Math.min(a.plannedSeconds, Math.floor(elapsed / 1000)),
    tag: a.tag,
    speciesId: a.speciesId,
    status: 'withered',
    reason,
    coinsEarned: 0,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...data,
    active: null,
    sessions: [...data.sessions, session],
    lastResult: session,
  };
}

/** The app/tab went to the background. Only matters for focus sessions in strict mode. */
export function markAway(data: AppData, now: number): AppData {
  const a = data.active;
  if (!a || a.kind !== 'focus' || !data.settings.strictMode || a.awayAt !== null) return data;
  return { ...data, active: { ...a, awayAt: now } };
}

/** The app/tab is visible again: wither the tree if it was away longer than the grace period. */
export function returnFromAway(data: AppData, now: number, newId: string): AppData {
  const a = data.active;
  if (!a || a.kind !== 'focus' || a.awayAt === null) return data;
  const awayMs = now - a.awayAt;
  if (awayMs > data.settings.graceSeconds * 1000) {
    return giveUp(data, now, newId, 'left_app', a.awayAt);
  }
  return { ...data, active: { ...a, awayAt: null } };
}

export function dismissResult(data: AppData): AppData {
  return { ...data, lastResult: null };
}

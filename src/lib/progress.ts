import { dayKey } from './stats';
import type { Session } from './types';

/**
 * Consecutive days with at least one completed tree, ending today. If nothing is done yet today
 * the streak is still alive (counted up to yesterday) so it never shows 0 first thing in the morning.
 */
export function dayStreak(sessions: readonly Session[], now: number): number {
  const days = new Set(sessions.filter((s) => s.status === 'completed').map((s) => dayKey(s.endedAt)));
  const today = new Date(now);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(dayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface LevelInfo {
  level: number;
  title: string;
  /** 0..1 progress toward the next level. */
  fraction: number;
  minutesIntoLevel: number;
  minutesForLevel: number;
}

const TITLES = ['Seedling', 'Sprout', 'Sapling', 'Grove keeper', 'Woodland warden', 'Forest elder'] as const;

/** Level n begins at 25 * (n - 1)^2 focused minutes: 0, 25, 100, 225, 400, ... */
export function levelFor(totalFocusSeconds: number): LevelInfo {
  const minutes = Math.max(0, Math.floor(totalFocusSeconds / 60));
  const level = 1 + Math.floor(Math.sqrt(minutes / 25));
  const start = 25 * (level - 1) ** 2;
  const next = 25 * level ** 2;
  return {
    level,
    title: TITLES[Math.min(level, TITLES.length) - 1],
    fraction: (minutes - start) / (next - start),
    minutesIntoLevel: minutes - start,
    minutesForLevel: next - start,
  };
}

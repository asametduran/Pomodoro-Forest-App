import { clamp01 } from './growth';
import type { TimerKind } from './types';

export function remainingMs(endAt: number, now: number): number {
  return Math.max(0, endAt - now);
}

export function isFinished(endAt: number, now: number): boolean {
  return now >= endAt;
}

/** Fraction of the timer that has elapsed (0..1). */
export function progressOf(startedAt: number, endAt: number, now: number): number {
  const total = endAt - startedAt;
  if (total <= 0) return 1;
  return clamp01((now - startedAt) / total);
}

/** mm:ss, rounding the remaining time up so 0:00 only shows at the very end. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function nextBreakKind(focusStreak: number, longBreakEvery: number): TimerKind {
  return focusStreak >= Math.max(1, longBreakEvery) ? 'longBreak' : 'shortBreak';
}

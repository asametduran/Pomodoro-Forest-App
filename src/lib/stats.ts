import { TAGS, type Session, type TagId } from './types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Local calendar day, e.g. "2026-11-23". */
export function dayKey(timestamp: number): string {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export interface DayTotal {
  key: string;
  label: string;
  focusSeconds: number;
  completed: number;
  withered: number;
}

/** The last `days` calendar days (oldest first, ending today). Sessions count on the day they ended. */
export function dailyTotals(sessions: readonly Session[], days: number, now: number): DayTotal[] {
  const today = new Date(now);
  const totals: DayTotal[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    totals.push({
      key: dayKey(d.getTime()),
      label: WEEKDAYS[d.getDay()],
      focusSeconds: 0,
      completed: 0,
      withered: 0,
    });
  }
  const byKey = new Map(totals.map((t) => [t.key, t]));
  for (const s of sessions) {
    const bucket = byKey.get(dayKey(s.endedAt));
    if (!bucket) continue;
    if (s.status === 'completed') {
      bucket.focusSeconds += s.actualSeconds;
      bucket.completed += 1;
    } else {
      bucket.withered += 1;
    }
  }
  return totals;
}

export function toMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

export function focusSecondsToday(sessions: readonly Session[], now: number): number {
  return dailyTotals(sessions, 1, now)[0].focusSeconds;
}

/** Focus time over the last 7 days, including today. */
export function focusSecondsThisWeek(sessions: readonly Session[], now: number): number {
  return dailyTotals(sessions, 7, now).reduce((sum, d) => sum + d.focusSeconds, 0);
}

export interface Summary {
  completed: number;
  withered: number;
  totalFocusSeconds: number;
  bySeconds: Record<TagId, number>;
}

export function summarize(sessions: readonly Session[]): Summary {
  const bySeconds = Object.fromEntries(TAGS.map((t) => [t.id, 0])) as Record<TagId, number>;
  let completed = 0;
  let withered = 0;
  let totalFocusSeconds = 0;
  for (const s of sessions) {
    if (s.status === 'completed') {
      completed += 1;
      totalFocusSeconds += s.actualSeconds;
      bySeconds[s.tag] += s.actualSeconds;
    } else {
      withered += 1;
    }
  }
  return { completed, withered, totalFocusSeconds, bySeconds };
}

/** "45s", "25 min", "8m 20s", "1h 5m": exact durations for a single session. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  if (m < 60) return rest === 0 ? `${m} min` : `${m}m ${rest}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
}

/** "45m", "1h 25m", "0m". */
export function formatMinutes(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}m`;
}

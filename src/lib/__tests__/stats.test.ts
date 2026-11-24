import {
  dailyTotals,
  dayKey,
  focusSecondsThisWeek,
  focusSecondsToday,
  formatDuration,
  formatMinutes,
  summarize,
} from '../stats';
import type { Session } from '../types';

const NOW = new Date(2026, 10, 23, 15, 0, 0).getTime(); // 23 Nov 2026, local time
const DAY = 24 * 60 * 60 * 1000;

function session(overrides: Partial<Session>): Session {
  return {
    id: Math.random().toString(36),
    startedAt: NOW - 1500_000,
    endedAt: NOW,
    plannedSeconds: 1500,
    actualSeconds: 1500,
    tag: 'study',
    speciesId: 'oak',
    status: 'completed',
    coinsEarned: 25,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('dailyTotals', () => {
  it('returns the requested number of days ending today, oldest first', () => {
    const totals = dailyTotals([], 7, NOW);
    expect(totals).toHaveLength(7);
    expect(totals[6].key).toBe(dayKey(NOW));
    expect(totals[0].key).toBe(dayKey(NOW - 6 * DAY));
  });

  it('adds completed focus time and counts withered trees separately', () => {
    const sessions = [
      session({ endedAt: NOW }),
      session({ endedAt: NOW - 1000, actualSeconds: 600 }),
      session({ endedAt: NOW, status: 'withered', actualSeconds: 300 }),
      session({ endedAt: NOW - DAY }),
    ];
    const totals = dailyTotals(sessions, 7, NOW);
    expect(totals[6]).toMatchObject({ focusSeconds: 2100, completed: 2, withered: 1 });
    expect(totals[5]).toMatchObject({ focusSeconds: 1500, completed: 1, withered: 0 });
  });

  it('ignores sessions outside the window', () => {
    const old = session({ endedAt: NOW - 30 * DAY });
    expect(focusSecondsThisWeek([old], NOW)).toBe(0);
  });
});

describe('today / week', () => {
  it('sums today and the last 7 days', () => {
    const sessions = [
      session({ endedAt: NOW }),
      session({ endedAt: NOW - 3 * DAY }),
      session({ endedAt: NOW - 10 * DAY }),
    ];
    expect(focusSecondsToday(sessions, NOW)).toBe(1500);
    expect(focusSecondsThisWeek(sessions, NOW)).toBe(3000);
  });
});

describe('summarize', () => {
  it('totals by tag and counts outcomes', () => {
    const summary = summarize([
      session({ tag: 'study' }),
      session({ tag: 'coding', actualSeconds: 900 }),
      session({ tag: 'coding', status: 'withered', actualSeconds: 100 }),
    ]);
    expect(summary.completed).toBe(2);
    expect(summary.withered).toBe(1);
    expect(summary.totalFocusSeconds).toBe(2400);
    expect(summary.bySeconds).toEqual({ study: 1500, coding: 900, work: 0, reading: 0 });
  });
});

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [45, '45s'],
    [1500, '25 min'],
    [500, '8m 20s'],
    [3600, '1h'],
    [3900, '1h 5m'],
    [-5, '0s'],
  ])('formats %i seconds as %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatMinutes', () => {
  it.each([
    [0, '0m'],
    [45, '45m'],
    [60, '1h'],
    [85, '1h 25m'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected);
  });
});

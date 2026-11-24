import { dayStreak, levelFor } from '../progress';
import type { Session } from '../types';

const NOW = new Date(2026, 10, 23, 15, 0, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;

function session(daysAgo: number, status: Session['status'] = 'completed'): Session {
  const endedAt = NOW - daysAgo * DAY;
  return {
    id: `s-${daysAgo}-${status}`,
    startedAt: endedAt - 1_500_000,
    endedAt,
    plannedSeconds: 1500,
    actualSeconds: 1500,
    tag: 'study',
    speciesId: 'oak',
    status,
    coinsEarned: status === 'completed' ? 25 : 0,
    createdAt: endedAt,
    updatedAt: endedAt,
  };
}

describe('dayStreak', () => {
  it('is 0 with no sessions', () => {
    expect(dayStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    expect(dayStreak([session(0), session(1), session(2)], NOW)).toBe(3);
  });

  it('keeps the streak alive when today has no tree yet', () => {
    expect(dayStreak([session(1), session(2)], NOW)).toBe(2);
  });

  it('breaks on a missed day', () => {
    expect(dayStreak([session(0), session(2), session(3)], NOW)).toBe(1);
  });

  it('is 0 when the last tree was two or more days ago', () => {
    expect(dayStreak([session(2), session(3)], NOW)).toBe(0);
  });

  it('ignores withered sessions and counts a day once', () => {
    expect(dayStreak([session(0, 'withered'), session(1), session(1)], NOW)).toBe(1);
  });
});

describe('levelFor', () => {
  it.each([
    [0, 1, 0],
    [24 * 60, 1, 24 / 25],
    [25 * 60, 2, 0],
    [100 * 60, 3, 0],
    [225 * 60, 4, 0],
  ])('%i seconds is level %i with %d progress', (seconds, level, fraction) => {
    const info = levelFor(seconds);
    expect(info.level).toBe(level);
    expect(info.fraction).toBeCloseTo(fraction);
  });

  it('reports progress inside a level and a title', () => {
    const info = levelFor(62 * 60); // level 2 spans 25..100 minutes
    expect(info).toMatchObject({ level: 2, title: 'Sprout', minutesIntoLevel: 37, minutesForLevel: 75 });
  });

  it('keeps the last title for very high levels', () => {
    expect(levelFor(25 * 60 * 400).title).toBe('Forest elder');
  });
});

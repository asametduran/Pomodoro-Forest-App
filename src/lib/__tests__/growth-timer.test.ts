import { coinsForSession } from '../coins';
import { stageForProgress } from '../growth';
import { formatClock, nextBreakKind, progressOf, remainingMs } from '../timer';

describe('stageForProgress', () => {
  it.each([
    [0, 'seed'],
    [0.14, 'seed'],
    [0.15, 'sprout'],
    [0.39, 'sprout'],
    [0.4, 'sapling'],
    [0.74, 'sapling'],
    [0.75, 'tree'],
    [1, 'tree'],
    [5, 'tree'],
    [-1, 'seed'],
    [Number.NaN, 'seed'],
  ])('progress %p is a %s', (progress, stage) => {
    expect(stageForProgress(progress)).toBe(stage);
  });
});

describe('timer math', () => {
  it('computes remaining time and progress from timestamps', () => {
    expect(remainingMs(10_000, 4_000)).toBe(6_000);
    expect(remainingMs(10_000, 12_000)).toBe(0);
    expect(progressOf(0, 10_000, 2_500)).toBe(0.25);
    expect(progressOf(0, 10_000, 20_000)).toBe(1);
    expect(progressOf(5, 5, 5)).toBe(1);
  });

  it('formats the clock rounding up', () => {
    expect(formatClock(25 * 60_000)).toBe('25:00');
    expect(formatClock(59_001)).toBe('01:00');
    expect(formatClock(1)).toBe('00:01');
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(-5)).toBe('00:00');
  });

  it('picks a long break once the streak is reached', () => {
    expect(nextBreakKind(3, 4)).toBe('shortBreak');
    expect(nextBreakKind(4, 4)).toBe('longBreak');
  });
});

describe('coinsForSession', () => {
  it('pays one coin per full minute', () => {
    expect(coinsForSession(1500)).toBe(25);
    expect(coinsForSession(119)).toBe(1);
    expect(coinsForSession(0)).toBe(0);
  });
});

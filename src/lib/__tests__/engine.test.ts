import {
  createInitialData,
  endBreak,
  finishActive,
  giveUp,
  markAway,
  returnFromAway,
  selectSpecies,
  startBreak,
  startFocus,
  unlockSpecies,
  updateSettings,
} from '../engine';

const T0 = 1_700_000_000_000;
const MIN = 60_000;

describe('startFocus', () => {
  it('creates an active focus timer from settings and the selected tag/species', () => {
    const data = startFocus(createInitialData(), T0);
    expect(data.active).toMatchObject({
      kind: 'focus',
      startedAt: T0,
      endAt: T0 + 25 * MIN,
      plannedSeconds: 1500,
      tag: 'study',
      speciesId: 'oak',
      awayAt: null,
    });
  });

  it('ignores a second start while a timer is running', () => {
    const first = startFocus(createInitialData(), T0);
    expect(startFocus(first, T0 + 5000)).toBe(first);
  });
});

describe('finishActive', () => {
  it('does nothing before the end time', () => {
    const running = startFocus(createInitialData(), T0);
    expect(finishActive(running, T0 + 24 * MIN, 'id-1')).toBe(running);
  });

  it('logs a completed tree, earns coins and counts the streak', () => {
    const running = startFocus(createInitialData(), T0);
    const done = finishActive(running, T0 + 25 * MIN, 'id-1');
    expect(done.active).toBeNull();
    expect(done.coins).toBe(25);
    expect(done.focusStreak).toBe(1);
    expect(done.sessions).toHaveLength(1);
    expect(done.sessions[0]).toMatchObject({
      id: 'id-1',
      status: 'completed',
      actualSeconds: 1500,
      coinsEarned: 25,
      tag: 'study',
    });
    expect(done.lastResult?.id).toBe('id-1');
  });

  it('completes correctly even if the app was closed past the end time', () => {
    const running = startFocus(createInitialData(), T0);
    const done = finishActive(running, T0 + 90 * MIN, 'id-1');
    expect(done.sessions[0].endedAt).toBe(T0 + 25 * MIN);
  });

  it('ends a break without logging a session', () => {
    const onBreak = startBreak(createInitialData(), T0);
    const done = finishActive(onBreak, T0 + 5 * MIN, 'id-1');
    expect(done.active).toBeNull();
    expect(done.sessions).toHaveLength(0);
  });
});

describe('giveUp', () => {
  it('withers the tree, keeps elapsed time and earns no coins', () => {
    const running = startFocus(createInitialData(), T0);
    const dead = giveUp(running, T0 + 10 * MIN, 'id-1');
    expect(dead.active).toBeNull();
    expect(dead.coins).toBe(0);
    expect(dead.sessions[0]).toMatchObject({
      status: 'withered',
      reason: 'gave_up',
      actualSeconds: 600,
      plannedSeconds: 1500,
      coinsEarned: 0,
    });
  });

  it('does not touch the focus streak', () => {
    let data = startFocus(createInitialData(), T0);
    data = finishActive(data, T0 + 25 * MIN, 'a');
    data = startFocus(data, T0 + 26 * MIN);
    data = giveUp(data, T0 + 27 * MIN, 'b');
    expect(data.focusStreak).toBe(1);
  });

  it('does nothing during a break', () => {
    const onBreak = startBreak(createInitialData(), T0);
    expect(giveUp(onBreak, T0 + MIN, 'x')).toBe(onBreak);
  });
});

describe('leaving the app', () => {
  it('forgives a quick trip within the grace period', () => {
    let data = startFocus(createInitialData(), T0);
    data = markAway(data, T0 + MIN);
    data = returnFromAway(data, T0 + MIN + 5_000, 'id-1');
    expect(data.active?.awayAt).toBeNull();
    expect(data.sessions).toHaveLength(0);
  });

  it('withers the tree at the moment you left once the grace period is exceeded', () => {
    let data = startFocus(createInitialData(), T0);
    data = markAway(data, T0 + 5 * MIN);
    data = returnFromAway(data, T0 + 8 * MIN, 'id-1');
    expect(data.active).toBeNull();
    expect(data.sessions[0]).toMatchObject({
      status: 'withered',
      reason: 'left_app',
      actualSeconds: 300,
    });
  });

  it('is ignored when strict mode is off', () => {
    let data = updateSettings(createInitialData(), { strictMode: false });
    data = startFocus(data, T0);
    const away = markAway(data, T0 + MIN);
    expect(away.active?.awayAt).toBeNull();
    expect(returnFromAway(away, T0 + 20 * MIN, 'id-1').sessions).toHaveLength(0);
  });

  it('is ignored during breaks', () => {
    const onBreak = startBreak(createInitialData(), T0);
    expect(markAway(onBreak, T0 + MIN)).toBe(onBreak);
  });
});

describe('breaks', () => {
  it('uses a short break by default and a long break after enough focus sessions', () => {
    let data = createInitialData();
    for (let i = 0; i < 4; i++) {
      data = startFocus(data, T0 + i * 100 * MIN);
      data = finishActive(data, T0 + i * 100 * MIN + 25 * MIN, `s${i}`);
    }
    expect(data.focusStreak).toBe(4);
    const long = startBreak(data, T0 + 500 * MIN);
    expect(long.active).toMatchObject({ kind: 'longBreak', plannedSeconds: 15 * 60 });
    expect(long.focusStreak).toBe(0);
  });

  it('starts a short break after a single session', () => {
    let data = startFocus(createInitialData(), T0);
    data = finishActive(data, T0 + 25 * MIN, 's');
    expect(startBreak(data, T0 + 26 * MIN).active).toMatchObject({
      kind: 'shortBreak',
      plannedSeconds: 300,
    });
  });

  it('can be ended early', () => {
    const onBreak = startBreak(createInitialData(), T0);
    expect(endBreak(onBreak).active).toBeNull();
  });
});

describe('species and settings', () => {
  it('only unlocks a species when the coins cover the cost', () => {
    const poor = createInitialData();
    expect(unlockSpecies(poor, 'pine')).toBe(poor);

    const rich = { ...poor, coins: 100 };
    const bought = unlockSpecies(rich, 'pine');
    expect(bought.coins).toBe(70);
    expect(bought.unlockedSpecies).toEqual(['oak', 'pine']);
    expect(unlockSpecies(bought, 'pine')).toBe(bought);
  });

  it('only selects unlocked species', () => {
    const data = createInitialData();
    expect(selectSpecies(data, 'maple')).toBe(data);
  });

  it('plants the selected species and tag', () => {
    let data = { ...createInitialData(), coins: 200 };
    data = unlockSpecies(data, 'pine');
    data = selectSpecies(data, 'pine');
    data = { ...data, selectedTag: 'coding' };
    expect(startFocus(data, T0).active).toMatchObject({ speciesId: 'pine', tag: 'coding' });
  });

  it('clamps settings into their allowed ranges', () => {
    const data = updateSettings(createInitialData(), {
      focusMinutes: 0,
      shortBreakMinutes: 999,
      longBreakEvery: 1,
    });
    expect(data.settings.focusMinutes).toBe(1);
    expect(data.settings.shortBreakMinutes).toBe(60);
    expect(data.settings.longBreakEvery).toBe(2);
  });
});

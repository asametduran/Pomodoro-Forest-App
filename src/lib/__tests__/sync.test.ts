import { DEFAULT_SETTINGS } from '../engine';
import {
  fromProfileRow,
  fromSessionRow,
  isSyncableSession,
  mergeProfile,
  mergeSessions,
  sessionsToUpload,
  toProfileRow,
  toSessionRow,
  type ProfileFields,
} from '../sync';
import type { Session } from '../types';

const UID = '6f1c2b8e-2a4d-4c71-9a0e-1f7d3c5b9e21';
const T = Date.UTC(2026, 10, 23, 14, 30);

function session(id: string, overrides: Partial<Session> = {}): Session {
  return {
    id,
    startedAt: T,
    endedAt: T + 1500_000,
    plannedSeconds: 1500,
    actualSeconds: 1500,
    tag: 'study',
    speciesId: 'oak',
    status: 'completed',
    coinsEarned: 25,
    createdAt: T,
    updatedAt: T,
    ...overrides,
  };
}

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

const profile = (overrides: Partial<ProfileFields> = {}): ProfileFields => ({
  coins: 10,
  selectedSpecies: 'oak',
  unlockedSpecies: ['oak'],
  focusStreak: 1,
  settings: { ...DEFAULT_SETTINGS },
  ...overrides,
});

describe('session rows', () => {
  it('round-trips through the database shape', () => {
    const s = session(A, { status: 'withered', reason: 'left_app', actualSeconds: 600, coinsEarned: 0 });
    const row = toSessionRow(s, UID);
    expect(row).toMatchObject({ id: A, user_id: UID, planned_seconds: 1500, actual_seconds: 600, reason: 'left_app' });
    expect(row.started_at).toBe('2026-11-23T14:30:00.000Z');
    const back = fromSessionRow({ ...row, updated_at: row.ended_at });
    expect(back).toMatchObject({ id: A, startedAt: s.startedAt, endedAt: s.endedAt, status: 'withered', reason: 'left_app' });
  });

  it('only uploads well-formed sessions', () => {
    expect(isSyncableSession(session(A))).toBe(true);
    expect(isSyncableSession(session('seed-1'))).toBe(false);
    expect(isSyncableSession(session(A, { actualSeconds: 2000 }))).toBe(false);
    expect(isSyncableSession(session(A, { plannedSeconds: 30, actualSeconds: 30 }))).toBe(false);
    expect(isSyncableSession(session(A, { status: 'withered', coinsEarned: 5 }))).toBe(false);
    expect(isSyncableSession(session(A, { speciesId: 'palm' }))).toBe(false);
  });
});

describe('mergeSessions', () => {
  it('unions both logs by id, oldest first', () => {
    const local = [session(B, { endedAt: T + 2 }), session(A, { endedAt: T + 1 })];
    const remote = [session(A, { endedAt: T + 1 }), session(C, { endedAt: T + 3 })];
    expect(mergeSessions(local, remote).map((s) => s.id)).toEqual([A, B, C]);
  });

  it('keeps the newer copy of the same session', () => {
    const merged = mergeSessions([session(A, { updatedAt: T + 10, tag: 'coding' })], [session(A, { tag: 'study' })]);
    expect(merged).toHaveLength(1);
    expect(merged[0].tag).toBe('coding');
  });

  it('uploads only local sessions missing from the cloud', () => {
    const local = [session(A), session(B), session('seed-9')];
    expect(sessionsToUpload(local, new Set([A])).map((s) => s.id)).toEqual([B]);
  });
});

describe('mergeProfile', () => {
  it('uploads the local profile when the cloud has none', () => {
    const local = profile({ coins: 42 });
    expect(mergeProfile({ local, remote: null, firstSyncForUser: true, localDirty: false })).toEqual({ profile: local, upload: true });
  });

  it('adds guest coins and unions species on the first sign-in', () => {
    const result = mergeProfile({
      local: profile({ coins: 30, unlockedSpecies: ['oak', 'pine'], selectedSpecies: 'pine', focusStreak: 3 }),
      remote: profile({ coins: 100, unlockedSpecies: ['oak', 'maple'], selectedSpecies: 'maple', focusStreak: 1 }),
      firstSyncForUser: true,
      localDirty: false,
    });
    expect(result.upload).toBe(true);
    expect(result.profile.coins).toBe(130);
    expect(result.profile.unlockedSpecies.sort()).toEqual(['maple', 'oak', 'pine']);
    expect(result.profile.selectedSpecies).toBe('pine');
    expect(result.profile.focusStreak).toBe(3);
  });

  it('lets unsynced local changes win, otherwise takes the cloud copy', () => {
    const local = profile({ coins: 5 });
    const remote = profile({ coins: 80 });
    expect(mergeProfile({ local, remote, firstSyncForUser: false, localDirty: true })).toEqual({ profile: local, upload: true });
    expect(mergeProfile({ local, remote, firstSyncForUser: false, localDirty: false })).toEqual({ profile: remote, upload: false });
  });
});

describe('profile rows', () => {
  it('sanitises unknown species and fills missing settings', () => {
    const row = toProfileRow(profile({ unlockedSpecies: ['oak', 'palm'], selectedSpecies: 'palm' }), UID);
    expect(row.unlocked_species).toEqual(['oak']);
    expect(row.selected_species).toBe('oak');
    const back = fromProfileRow({ ...row, settings: { focusMinutes: 45 } });
    expect(back.settings.focusMinutes).toBe(45);
    expect(back.settings.shortBreakMinutes).toBe(DEFAULT_SETTINGS.shortBreakMinutes);
  });
});

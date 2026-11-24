/**
 * Pure mapping + merge rules between the local store and the Supabase `pomodoro_*` tables.
 * Network calls live in src/store/auth-store.ts; everything here is unit-tested.
 */
import { DEFAULT_SETTINGS } from './engine';
import { SPECIES } from './species';
import { TAGS, type Session, type Settings, type TagId } from './types';

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SPECIES_IDS = new Set(SPECIES.map((s) => s.id));
const TAG_IDS = new Set<string>(TAGS.map((t) => t.id));

export interface SessionRow {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  planned_seconds: number;
  actual_seconds: number;
  tag: string;
  species_id: string;
  status: 'completed' | 'withered';
  reason: 'gave_up' | 'left_app' | null;
  coins_earned: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileRow {
  user_id: string;
  coins: number;
  selected_species: string;
  unlocked_species: string[];
  focus_streak: number;
  settings: Partial<Settings>;
  updated_at?: string;
}

export interface ProfileFields {
  coins: number;
  selectedSpecies: string;
  unlockedSpecies: string[];
  focusStreak: number;
  settings: Settings;
}

/** Only well-formed sessions are uploaded (the database enforces the same rules). */
export function isSyncableSession(s: Session): boolean {
  return (
    UUID_RE.test(s.id) &&
    s.plannedSeconds >= 60 &&
    s.plannedSeconds <= 10800 &&
    s.actualSeconds >= 0 &&
    s.actualSeconds <= s.plannedSeconds &&
    s.endedAt >= s.startedAt &&
    SPECIES_IDS.has(s.speciesId) &&
    TAG_IDS.has(s.tag) &&
    (s.status === 'completed' || s.coinsEarned === 0)
  );
}

export function toSessionRow(s: Session, userId: string): SessionRow {
  return {
    id: s.id,
    user_id: userId,
    started_at: new Date(s.startedAt).toISOString(),
    ended_at: new Date(s.endedAt).toISOString(),
    planned_seconds: Math.round(s.plannedSeconds),
    actual_seconds: Math.round(s.actualSeconds),
    tag: s.tag,
    species_id: s.speciesId,
    status: s.status,
    reason: s.reason ?? null,
    coins_earned: Math.max(0, Math.round(s.coinsEarned)),
  };
}

export function fromSessionRow(r: SessionRow): Session {
  const endedAt = Date.parse(r.ended_at);
  return {
    id: r.id,
    startedAt: Date.parse(r.started_at),
    endedAt,
    plannedSeconds: r.planned_seconds,
    actualSeconds: r.actual_seconds,
    tag: (TAG_IDS.has(r.tag) ? r.tag : 'study') as TagId,
    speciesId: SPECIES_IDS.has(r.species_id) ? r.species_id : 'oak',
    status: r.status,
    reason: r.reason ?? undefined,
    coinsEarned: r.coins_earned,
    createdAt: r.created_at ? Date.parse(r.created_at) : endedAt,
    updatedAt: r.updated_at ? Date.parse(r.updated_at) : endedAt,
  };
}

/** Union of both logs by id (sessions are append-only), oldest first. */
export function mergeSessions(local: readonly Session[], remote: readonly Session[]): Session[] {
  const byId = new Map<string, Session>();
  for (const s of remote) byId.set(s.id, s);
  for (const s of local) {
    const existing = byId.get(s.id);
    if (!existing || s.updatedAt > existing.updatedAt) byId.set(s.id, s);
  }
  return [...byId.values()].sort((a, b) => a.endedAt - b.endedAt);
}

/** Sessions that exist locally but not yet in the cloud. */
export function sessionsToUpload(local: readonly Session[], remoteIds: ReadonlySet<string>): Session[] {
  return local.filter((s) => isSyncableSession(s) && !remoteIds.has(s.id));
}

export function toProfileRow(p: ProfileFields, userId: string): ProfileRow {
  return {
    user_id: userId,
    coins: Math.max(0, Math.round(p.coins)),
    selected_species: SPECIES_IDS.has(p.selectedSpecies) ? p.selectedSpecies : 'oak',
    unlocked_species: p.unlockedSpecies.filter((id) => SPECIES_IDS.has(id)),
    focus_streak: Math.max(0, Math.round(p.focusStreak)),
    settings: p.settings,
  };
}

export function fromProfileRow(r: ProfileRow): ProfileFields {
  const unlocked = (r.unlocked_species ?? []).filter((id) => SPECIES_IDS.has(id));
  return {
    coins: r.coins,
    selectedSpecies: SPECIES_IDS.has(r.selected_species) ? r.selected_species : 'oak',
    unlockedSpecies: unlocked.length ? unlocked : ['oak'],
    focusStreak: r.focus_streak,
    settings: { ...DEFAULT_SETTINGS, ...(r.settings ?? {}) },
  };
}

/**
 * Decide the profile after a sync.
 * - No cloud profile yet: upload the local one.
 * - First sync of guest data into an account: add the guest coins, union the species.
 * - Otherwise: local wins if it changed since the last upload (dirty), else the cloud wins.
 */
export function mergeProfile(args: {
  local: ProfileFields;
  remote: ProfileFields | null;
  firstSyncForUser: boolean;
  localDirty: boolean;
}): { profile: ProfileFields; upload: boolean } {
  const { local, remote, firstSyncForUser, localDirty } = args;
  if (!remote) return { profile: local, upload: true };
  if (firstSyncForUser) {
    const unlocked = [...new Set([...remote.unlockedSpecies, ...local.unlockedSpecies])];
    return {
      profile: {
        coins: remote.coins + local.coins,
        unlockedSpecies: unlocked,
        selectedSpecies: unlocked.includes(local.selectedSpecies) ? local.selectedSpecies : remote.selectedSpecies,
        focusStreak: Math.max(remote.focusStreak, local.focusStreak),
        settings: local.settings,
      },
      upload: true,
    };
  }
  return localDirty ? { profile: local, upload: true } : { profile: remote, upload: false };
}

export type GrowthStage = 'seed' | 'sprout' | 'sapling' | 'tree';

export const STAGE_STARTS: Record<GrowthStage, number> = {
  seed: 0,
  sprout: 0.15,
  sapling: 0.4,
  tree: 0.75,
};

export const STAGE_LABELS: Record<GrowthStage, string> = {
  seed: 'Seed',
  sprout: 'Sprout',
  sapling: 'Sapling',
  tree: 'Full tree',
};

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function stageForProgress(progress: number): GrowthStage {
  const p = clamp01(progress);
  if (p >= STAGE_STARTS.tree) return 'tree';
  if (p >= STAGE_STARTS.sapling) return 'sapling';
  if (p >= STAGE_STARTS.sprout) return 'sprout';
  return 'seed';
}

/** Progress (0..1) of `value` between `from` and `to`, clamped. */
export function span(value: number, from: number, to: number): number {
  return clamp01((value - from) / (to - from));
}

export function easeOut(t: number): number {
  const c = clamp01(t);
  return 1 - (1 - c) * (1 - c);
}

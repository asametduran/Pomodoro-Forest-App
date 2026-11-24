export type CanopyShape = 'round' | 'cone' | 'blossom' | 'maple';

export interface Species {
  id: string;
  name: string;
  description: string;
  /** Coins needed to unlock. 0 = available from the start. */
  cost: number;
  shape: CanopyShape;
  colors: {
    canopy: string;
    canopyLight: string;
    trunk: string;
    accent: string;
  };
}

export const SPECIES: readonly Species[] = [
  {
    id: 'oak',
    name: 'Sage Oak',
    description: 'A steady, rounded tree. Your first companion.',
    cost: 0,
    shape: 'round',
    colors: { canopy: '#6F9A73', canopyLight: '#8DB391', trunk: '#8A6A4B', accent: '#A7C7A0' },
  },
  {
    id: 'pine',
    name: 'Quiet Pine',
    description: 'Tall and layered, evergreen all year.',
    cost: 30,
    shape: 'cone',
    colors: { canopy: '#4C7A5E', canopyLight: '#6A9A7B', trunk: '#7A5C42', accent: '#8DB89A' },
  },
  {
    id: 'cherry',
    name: 'Blossom Cherry',
    description: 'Soft pink blossoms for a calm finish.',
    cost: 80,
    shape: 'blossom',
    colors: { canopy: '#E0A9B5', canopyLight: '#F0C6CF', trunk: '#7B5A4A', accent: '#FFE3E8' },
  },
  {
    id: 'maple',
    name: 'Ember Maple',
    description: 'Warm autumn leaves in clay and amber.',
    cost: 150,
    shape: 'maple',
    colors: { canopy: '#C77B4F', canopyLight: '#E0A06C', trunk: '#6E513C', accent: '#EBC48F' },
  },
];

export const DEFAULT_SPECIES_ID = SPECIES[0].id;

export function getSpecies(id: string): Species {
  return SPECIES.find((s) => s.id === id) ?? SPECIES[0];
}

export const WITHERED_COLORS = {
  canopy: '#A39578',
  canopyLight: '#B8AB8E',
  trunk: '#6B5A48',
  accent: '#8C7B63',
};

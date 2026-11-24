import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { clamp01, easeOut, span } from '@/lib/growth';
import { getSpecies, type CanopyShape } from '@/lib/species';

export interface TreeSvgProps {
  speciesId: string;
  /** 0..1: seed -> sprout -> sapling -> full tree. */
  progress: number;
  withered?: boolean;
  size?: number;
  /** Draw the dirt patch under the tree. */
  ground?: boolean;
  /**
   * "Camera" mode: crop the drawing to the tree so young trees fill their frame instead of
   * sitting in a sea of empty space. The frame zooms out smoothly as the tree grows.
   */
  fit?: boolean;
  /**
   * Smallest visible area (in the 200-unit drawing) when `fit` is on; larger = less zoom on seeds.
   * Keep it at 130+ so the dirt patch is never cropped.
   */
  minSide?: number;
}

const CX = 100; // horizontal centre of the 200-unit drawing
const GROUND_Y = 172;
/** Lowest drawn point (bottom of the dirt patch). */
const BOTTOM = 186;

interface Palette {
  dark: string;
  /** Body colour of the lower, shaded clumps. */
  shade: string;
  mid: string;
  light: string;
  highlight: string;
  trunk: string;
  trunkDark: string;
  trunkLight: string;
  fallen: string;
}

/** Colours sampled from the "Tree Growth Stages" mockup board. */
const PALETTES: Record<CanopyShape, Palette> = {
  round: {
    dark: '#557F38',
    shade: '#6B9844',
    mid: '#7FAF4E',
    light: '#9DC862',
    highlight: '#C2DE84',
    trunk: '#8A5A38',
    trunkDark: '#603D25',
    trunkLight: '#A8764D',
    fallen: '#C9874F',
  },
  cone: {
    dark: '#2E5838',
    shade: '#36643F',
    mid: '#3F7048',
    light: '#5B8A58',
    highlight: '#7BA86C',
    trunk: '#6F4A30',
    trunkDark: '#4F331F',
    trunkLight: '#8A5E3E',
    fallen: '#A88C5F',
  },
  blossom: {
    dark: '#D47896',
    shade: '#E58DA9',
    mid: '#EEA1B9',
    light: '#F6C1D1',
    highlight: '#FCE2EA',
    trunk: '#6E4A3A',
    trunkDark: '#4F3328',
    trunkLight: '#8C6250',
    fallen: '#F2A9BE',
  },
  maple: {
    dark: '#BF4E1F',
    shade: '#D4612B',
    mid: '#E3723A',
    light: '#F0984E',
    highlight: '#F8BE6F',
    trunk: '#72482D',
    trunkDark: '#52321E',
    trunkLight: '#90603E',
    fallen: '#E4733C',
  },
};

const WITHERED_WOOD = { trunk: '#8C6A4E', trunkDark: '#6B4F38', trunkLight: '#A8876A' };
const SPROUT = { leaf: '#7DB24F', leafLight: '#9CCB66', rib: '#5D8C3A', stem: '#6E8E3A' };

/** Canopy clumps in units of the canopy radius: [x, y, r]. Ordered back (top) to front (bottom). */
const CLUMPS: readonly [number, number, number][] = [
  [-0.55, -0.62, 0.34],
  [-0.12, -0.78, 0.36],
  [0.32, -0.74, 0.35],
  [0.72, -0.52, 0.32],
  [-0.98, -0.25, 0.33],
  [-0.6, -0.32, 0.4],
  [-0.15, -0.42, 0.42],
  [0.3, -0.4, 0.42],
  [0.78, -0.22, 0.38],
  [1.1, 0.0, 0.27],
  [-1.15, 0.08, 0.26],
  [-0.82, 0.12, 0.36],
  [-0.4, 0.12, 0.4],
  [0.05, 0.1, 0.42],
  [0.48, 0.12, 0.4],
  [0.9, 0.16, 0.33],
];

/** Little leaf bumps along the top edge of every clump (units of the clump radius). */
const SCALLOPS: readonly [number, number][] = [
  [-0.6, -0.6],
  [0.32, -0.74],
];

/** Blossom specks on the cherry canopy (units of R). */
const BLOSSOMS: readonly [number, number][] = [
  [-0.6, -0.6], [0.1, -0.78], [0.6, -0.55], [-0.95, -0.12], [-0.3, -0.25], [0.35, -0.2],
  [0.95, 0.05], [-0.6, 0.22], [0.05, 0.25], [0.55, 0.28], [-1.1, 0.2], [1.0, -0.2], [-0.15, -0.55],
];

/** Bare-tree limbs from the fork at (0,0), in units of R: [x1, y1, x2, y2, width]. */
const LIMBS: readonly [number, number, number, number, number][] = [
  [0, 0, -0.55, -0.55, 4.2],
  [-0.3, -0.3, -0.8, -0.42, 2.4],
  [-0.42, -0.42, -0.48, -0.95, 2.4],
  [-0.62, -0.38, -0.78, -0.7, 1.6],
  [0, 0, 0.06, -1.0, 3.8],
  [0.04, -0.55, -0.22, -0.88, 2],
  [0.05, -0.62, 0.3, -0.92, 1.8],
  [0, 0, 0.6, -0.58, 4],
  [0.34, -0.33, 0.86, -0.4, 2.4],
  [0.46, -0.45, 0.52, -0.96, 2.2],
  [0.7, -0.42, 0.9, -0.7, 1.5],
];

/** Falling leaves around a withered tree (relative to the trunk, units of R). */
const FALLEN: readonly [number, number, number][] = [
  [-0.95, -0.55, 25],
  [0.98, -0.25, -40],
  [-0.62, 0.55, 70],
  [0.78, 0.6, -15],
];

/** A pointed leaf pointing along +x from the origin, length `len`. */
function leafPath(len: number): string {
  const w = len * 0.34;
  return `M0 0 C ${len * 0.28} ${-w}, ${len * 0.72} ${-w}, ${len} 0 C ${len * 0.72} ${w}, ${len * 0.28} ${w}, 0 0 Z`;
}

function Leaf({
  x,
  y,
  angle,
  len,
  fill,
  rib,
}: {
  x: number;
  y: number;
  angle: number;
  len: number;
  fill: string;
  rib: string;
}) {
  if (len <= 0.5) return null;
  return (
    <G transform={`translate(${x} ${y}) rotate(${angle})`}>
      <Path d={leafPath(len)} fill={fill} />
      <Path d={`M${len * 0.06} 0 L${len * 0.86} 0`} stroke={rib} strokeWidth={Math.max(0.6, len * 0.05)} strokeLinecap="round" />
    </G>
  );
}

function Trunk({
  baseY,
  topY,
  baseW,
  colors,
  roots,
}: {
  baseY: number;
  topY: number;
  baseW: number;
  colors: { trunk: string; trunkDark: string; trunkLight: string };
  roots: number;
}) {
  const h = baseY - topY;
  if (h <= 0.5) return null;
  const hb = baseW / 2;
  const ht = Math.max(1, hb * 0.56);
  const flare = 6 * roots;
  const mid = baseY - h * 0.45;
  const outline =
    `M${CX - hb - flare} ${baseY + 1} ` +
    `C${CX - hb} ${baseY - 1} ${CX - hb * 0.78} ${baseY - 8} ${CX - ht * 1.15} ${mid} ` +
    `L${CX - ht} ${topY} L${CX + ht} ${topY} L${CX + ht * 1.15} ${mid} ` +
    `C${CX + hb * 0.78} ${baseY - 8} ${CX + hb} ${baseY - 1} ${CX + hb + flare} ${baseY + 1} Z`;
  const shade =
    `M${CX + ht * 0.2} ${topY} L${CX + ht} ${topY} L${CX + ht * 1.15} ${mid} ` +
    `C${CX + hb * 0.78} ${baseY - 8} ${CX + hb} ${baseY - 1} ${CX + hb + flare} ${baseY + 1} ` +
    `L${CX + hb * 0.2} ${baseY + 1} C${CX + hb * 0.3} ${baseY - 10} ${CX + ht * 0.4} ${mid} ${CX + ht * 0.2} ${topY} Z`;
  return (
    <G>
      <Path d={outline} fill={colors.trunk} />
      <Path d={shade} fill={colors.trunkDark} opacity={0.55} />
      {h > 24 && (
        <Path
          d={`M${CX - ht * 0.3} ${topY + h * 0.15} C${CX - ht * 0.5} ${topY + h * 0.45} ${CX - hb * 0.3} ${baseY - h * 0.3} ${CX - hb * 0.35} ${baseY - 4}`}
          stroke={colors.trunkLight}
          strokeWidth={Math.max(0.8, baseW * 0.09)}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      )}
    </G>
  );
}

function Canopy({ cx, cy, r, pal, blossom }: { cx: number; cy: number; r: number; pal: Palette; blossom: boolean }) {
  return (
    <G>
      {/* Dark silhouette gives every clump a shadowed underside */}
      {CLUMPS.map(([x, y, cr], i) => (
        <Circle key={`s${i}`} cx={cx + x * r} cy={cy + (y + 0.05) * r} r={cr * r * 1.07} fill={pal.dark} />
      ))}
      {CLUMPS.map(([x, y, cr], i) => {
        const px = cx + x * r;
        const py = cy + y * r;
        const rr = cr * r;
        const lower = y > -0.05;
        return (
          <G key={`c${i}`}>
            <Circle cx={px} cy={py + rr * 0.12} r={rr * 1.02} fill={pal.dark} />
            <Circle cx={px} cy={py} r={rr} fill={lower ? pal.shade : pal.mid} />
            <Circle
              cx={px - rr * (0.1 + (i % 3) * 0.05)}
              cy={py - rr * (0.18 + (i % 2) * 0.06)}
              r={rr * (lower ? 0.6 : 0.74)}
              fill={pal.light}
              opacity={lower ? 0.7 : 0.95}
            />
            {!lower &&
              SCALLOPS.map(([ax, ay], j) => (
                <Circle key={j} cx={px + ax * rr} cy={py + ay * rr} r={rr * 0.22} fill={pal.light} />
              ))}
            {y < -0.5 && (
              <Circle cx={px - rr * 0.24} cy={py - rr * 0.38} r={rr * 0.3} fill={pal.highlight} opacity={0.5} />
            )}
          </G>
        );
      })}
      {blossom &&
        BLOSSOMS.map(([x, y], i) => (
          <G key={`b${i}`}>
            <Circle cx={cx + x * r} cy={cy + y * r} r={r * 0.06} fill="#FFFFFF" opacity={0.92} />
            <Circle cx={cx + x * r} cy={cy + y * r} r={r * 0.025} fill={pal.dark} />
          </G>
        ))}
    </G>
  );
}

/** Tiered conifer, drawn with its base at `baseY` and scaled by `k`. */
function Pine({ baseY, k, pal }: { baseY: number; k: number; pal: Palette }) {
  const tiers = [0, 1, 2, 3, 4];
  return (
    <G transform={`translate(${CX} ${baseY}) scale(${k}) translate(${-CX} ${-baseY})`}>
      <Path d={`M${CX - 4} ${baseY + 1} L${CX - 3} ${baseY - 20} L${CX + 3} ${baseY - 20} L${CX + 4} ${baseY + 1} Z`} fill={pal.trunk} />
      {tiers.map((i) => {
        const tierBase = baseY - 14 - i * 24;
        const hw = 46 - i * 8;
        const tip = tierBase - 42;
        const teeth = 6;
        let edge = '';
        for (let t = 0; t <= teeth; t++) {
          const x = CX + hw - (2 * hw * t) / teeth;
          const y = t % 2 === 0 ? tierBase : tierBase - 6;
          edge += ` L${x} ${y}`;
        }
        const full = `M${CX} ${tip}${edge} Z`;
        const lit = `M${CX} ${tip} L${CX + hw} ${tierBase} L${CX + hw * 0.66} ${tierBase - 6} L${CX + hw * 0.33} ${tierBase} L${CX} ${tierBase - 6} Z`;
        return (
          <G key={i}>
            <Path d={full} fill={i % 2 === 0 ? pal.mid : pal.dark} />
            <Path d={lit} fill={pal.light} opacity={0.75} />
          </G>
        );
      })}
    </G>
  );
}

export function TreeSvg({
  speciesId,
  progress,
  withered = false,
  size = 200,
  ground = true,
  fit = false,
  minSide = 150,
}: TreeSvgProps) {
  const species = getSpecies(speciesId);
  const shape = species.shape;
  const pal = PALETTES[shape];
  const p = clamp01(progress);
  const isPine = shape === 'cone';

  // Shared growth curve
  const trunkH = (isPine ? 70 : 50) * easeOut(span(p, 0.1, 0.92));
  const topY = GROUND_Y - trunkH;
  const baseW = 3 + 23 * span(p, 0.3, 1);
  const seedA = 1 - span(p, 0.1, 0.2);
  const sproutScale = easeOut(span(p, 0.1, 0.3));
  const sproutA = withered ? 1 : 1 - span(p, 0.4, 0.55);
  const saplingA = span(p, 0.36, 0.46) * (1 - span(p, 0.68, 0.82));
  const saplingScale = 0.55 + 0.45 * span(p, 0.36, 0.7);
  const canopyA = span(p, 0.6, 0.72);
  const R = 46 * (0.5 + 0.5 * easeOut(span(p, 0.6, 1)));
  const canopyCy = topY - R * 0.78;
  const pineK = 0.3 + 0.7 * easeOut(span(p, 0.36, 1));
  const pineA = span(p, 0.36, 0.48);

  // Camera: the highest drawn point decides how much of the drawing is visible.
  let highest = GROUND_Y - 12;
  if (withered) highest = Math.min(highest, topY - (p >= 0.4 ? R * 1.05 : 14));
  else if (isPine && pineA > 0) highest = Math.min(highest, GROUND_Y - 150 * pineK);
  else if (canopyA > 0) highest = Math.min(highest, canopyCy - R * 1.18);
  else if (saplingA > 0) highest = Math.min(highest, topY - 30 * saplingScale);
  else if (trunkH > 0) highest = Math.min(highest, topY - 14);
  const side = fit ? Math.min(200, Math.max(minSide, BOTTOM - highest + 10)) : 200;
  const viewBox = fit ? `${CX - side / 2} ${BOTTOM - side} ${side} ${side}` : '0 0 200 200';

  const wood = withered ? WITHERED_WOOD : pal;
  // The dirt patch widens as the tree grows, so young sprouts can be framed tightly.
  const dirtK = 0.6 + 0.4 * span(p, 0.3, 1);
  const showBare = withered && p >= 0.4;
  const bareK = 0.6 + 0.4 * span(p, 0.4, 1);
  const bareR = 46 * bareK;

  return (
    <Svg width={size} height={size} viewBox={viewBox}>
      {ground && (
        <G>
          <Ellipse cx={CX} cy={GROUND_Y + 5} rx={50 * dirtK} ry={8.5} fill="#5E3E28" opacity={0.55} />
          <Ellipse cx={CX} cy={GROUND_Y + 3} rx={44 * dirtK} ry={6.5} fill="#7A5236" />
          <Ellipse cx={CX - 4 * dirtK} cy={GROUND_Y + 1.5} rx={30 * dirtK} ry={3.6} fill="#97694A" opacity={0.9} />
          <Circle cx={CX - 26 * dirtK} cy={GROUND_Y + 4} r={1.6} fill="#A98063" />
          <Circle cx={CX + 22 * dirtK} cy={GROUND_Y + 5} r={1.3} fill="#5A3B25" />
          <Circle cx={CX + 31 * dirtK} cy={GROUND_Y + 2.6} r={1.1} fill="#A98063" />
        </G>
      )}

      {/* Seed */}
      {seedA > 0 && (
        <G opacity={seedA} transform={`translate(${CX} ${GROUND_Y - 3}) rotate(-12)`}>
          <Path d="M-10 0 C-10 -6.5 0 -8.5 10 -3 C11 3 2 7.5 -6.5 5.5 C-9 4.6 -10 2.4 -10 0 Z" fill={withered ? '#7C6650' : '#8A5A33'} />
          <Path d="M-6 -3.2 C-2 -5.6 3 -5.4 6.5 -3.4" stroke={withered ? '#9C8670' : '#C08B5C'} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      )}

      {/* Pine body */}
      {isPine && !withered && pineA > 0 && (
        <G opacity={pineA}>
          <Pine baseY={GROUND_Y} k={pineK} pal={pal} />
        </G>
      )}

      {/* Stem / trunk (broadleaf trees and young pines) */}
      {!(isPine && pineA >= 1) && !showBare && trunkH > 0 && (
        <G opacity={isPine ? 1 - pineA : 1}>
          {p < 0.5 || withered ? (
            <Path
              d={
                withered
                  ? `M${CX} ${GROUND_Y} C${CX} ${GROUND_Y - trunkH * 0.6} ${CX + 4} ${topY + 6} ${CX + 9} ${topY + 10}`
                  : `M${CX} ${GROUND_Y} C${CX - 1.5} ${GROUND_Y - trunkH * 0.5} ${CX + 1.5} ${topY + trunkH * 0.3} ${CX} ${topY}`
              }
              stroke={withered ? '#8A7056' : SPROUT.stem}
              strokeWidth={Math.max(2.2, baseW * 0.55)}
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <Trunk baseY={GROUND_Y} topY={topY} baseW={baseW} colors={wood} roots={span(p, 0.6, 1)} />
          )}
        </G>
      )}

      {/* Sprout leaves */}
      {!showBare && sproutA > 0 && sproutScale > 0 && trunkH > 0 && (
        <G opacity={sproutA}>
          {withered ? (
            <>
              <Leaf x={CX + 9} y={topY + 10} angle={70} len={16 * sproutScale} fill="#A2876A" rib="#7C6650" />
              <Leaf x={CX + 6} y={topY + 8} angle={140} len={13 * sproutScale} fill="#94795E" rib="#7C6650" />
            </>
          ) : (
            <>
              <Leaf x={CX} y={topY + 1} angle={-150} len={26 * sproutScale} fill={SPROUT.leaf} rib={SPROUT.rib} />
              <Leaf x={CX} y={topY + 1} angle={-30} len={26 * sproutScale} fill={SPROUT.leafLight} rib={SPROUT.rib} />
            </>
          )}
        </G>
      )}

      {/* Sapling leaf cluster (broadleaf species) */}
      {!isPine && !withered && saplingA > 0 && (
        <G opacity={saplingA}>
          {(
            [
              [topY + 16, -165, 0.85],
              [topY + 16, -15, 0.85],
              [topY + 7, -138, 1],
              [topY + 7, -42, 1],
              [topY + 2, -90, 1.05],
            ] as const
          ).map(([y, angle, k], i) => (
            <Leaf
              key={i}
              x={CX}
              y={y}
              angle={angle}
              len={30 * saplingScale * k}
              fill={i % 2 === 0 ? pal.mid : pal.light}
              rib={pal.dark}
            />
          ))}
          {shape === 'blossom' &&
            [
              [-14, -18],
              [12, -22],
              [0, -32],
              [-20, -6],
              [18, -8],
            ].map(([dx, dy], i) => (
              <Circle key={i} cx={CX + dx * saplingScale} cy={topY + dy * saplingScale} r={2.6 * saplingScale} fill={pal.highlight} />
            ))}
        </G>
      )}

      {/* Branches + full canopy */}
      {!isPine && !withered && canopyA > 0 && (
        <G opacity={canopyA}>
          {(
            [
              [-2, -0.78, -0.42, 0.46],
              [2, 0.74, -0.46, 0.44],
              [-1, -0.32, -0.66, 0.3],
              [1, 0.3, -0.7, 0.3],
            ] as const
          ).map(([dx, ex, ey, wk], i) => (
            <Path
              key={i}
              d={`M${CX + dx} ${topY + 8} Q${CX + ex * R * 0.35} ${topY - R * 0.06} ${CX + ex * R} ${topY + ey * R}`}
              stroke={i < 2 ? pal.trunk : pal.trunkDark}
              strokeWidth={Math.max(1.6, baseW * wk)}
              strokeLinecap="round"
              fill="none"
            />
          ))}
          <Canopy cx={CX} cy={canopyCy} r={R} pal={pal} blossom={shape === 'blossom'} />
        </G>
      )}

      {/* Withered: bare branches and a few falling leaves */}
      {showBare && (
        <G>
          <Trunk baseY={GROUND_Y} topY={topY} baseW={baseW} colors={WITHERED_WOOD} roots={span(p, 0.6, 1)} />
          {LIMBS.map(([x1, y1, x2, y2, w], i) => (
            <Path
              key={i}
              d={`M${CX + x1 * bareR} ${topY + y1 * bareR} L${CX + x2 * bareR} ${topY + y2 * bareR}`}
              stroke={i % 3 === 0 ? WITHERED_WOOD.trunk : WITHERED_WOOD.trunkLight}
              strokeWidth={w * bareK}
              strokeLinecap="round"
            />
          ))}
          {FALLEN.map(([x, y, angle], i) => (
            <Leaf
              key={i}
              x={CX + x * bareR}
              y={topY + y * bareR}
              angle={angle}
              len={9}
              fill={pal.fallen}
              rib={pal.trunkDark}
            />
          ))}
        </G>
      )}
    </Svg>
  );
}

import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export type SceneMode = 'idle' | 'focus' | 'break' | 'complete';
export type SceneVariant = 'night' | 'day' | 'warm' | 'dusk' | 'glow';

/** Which painted backdrop to use for a timer state in the current colour scheme. */
export function sceneVariant(mode: SceneMode, dark: boolean): SceneVariant {
  if (mode === 'complete') return 'glow';
  if (mode === 'break') return dark ? 'dusk' : 'warm';
  return dark ? 'night' : 'day';
}

interface Palette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  orb: string | null;
  cloud: string;
  cloudShade: string;
  cloudOpacity: number;
  far: string;
  mid: string;
  pineDark: string;
  pineLight: string;
  bush: string;
  bushLight: string;
  hillTop: string;
  hillBottom: string;
  stars: boolean;
  mountains: boolean;
  leaves: boolean;
}

const PALETTES: Record<SceneVariant, Palette> = {
  night: {
    skyTop: '#1A2C35',
    skyMid: '#2E4249',
    skyBottom: '#4B5C58',
    orb: '#F8E7C9',
    cloud: '#3B4B53',
    cloudShade: '#33424A',
    cloudOpacity: 0.9,
    far: '#35484E',
    mid: '#2D3F41',
    pineDark: '#1F3529',
    pineLight: '#2C4A35',
    bush: '#2F4B32',
    bushLight: '#3D5E3C',
    hillTop: '#5A6E40',
    hillBottom: '#435535',
    stars: true,
    mountains: true,
    leaves: false,
  },
  day: {
    skyTop: '#B5D3E0',
    skyMid: '#D3E4E6',
    skyBottom: '#F4EEE1',
    orb: null,
    cloud: '#FFFFFF',
    cloudShade: '#E4EDEF',
    cloudOpacity: 0.96,
    far: '#C6D5A8',
    mid: '#AFC78C',
    pineDark: '#7EA463',
    pineLight: '#97BB76',
    bush: '#86AD69',
    bushLight: '#A2C47F',
    hillTop: '#AFC277',
    hillBottom: '#94AD60',
    stars: false,
    mountains: false,
    leaves: false,
  },
  warm: {
    skyTop: '#EFAE8E',
    skyMid: '#F3C1A2',
    skyBottom: '#F8DEC6',
    orb: null,
    cloud: '#FCEBDD',
    cloudShade: '#F6D9C6',
    cloudOpacity: 0.95,
    far: '#E2BEA2',
    mid: '#D3AA8B',
    pineDark: '#7E8C67',
    pineLight: '#98A47D',
    bush: '#8C9867',
    bushLight: '#A4AE7C',
    hillTop: '#959C62',
    hillBottom: '#7E8650',
    stars: false,
    mountains: true,
    leaves: true,
  },
  dusk: {
    skyTop: '#33293A',
    skyMid: '#5B4248',
    skyBottom: '#8A5E4C',
    orb: '#F4C48F',
    cloud: '#6B4D52',
    cloudShade: '#5A4147',
    cloudOpacity: 0.85,
    far: '#5C4744',
    mid: '#4A3A37',
    pineDark: '#2C382B',
    pineLight: '#3A4934',
    bush: '#3A4933',
    bushLight: '#4A5B3E',
    hillTop: '#58603A',
    hillBottom: '#454C2E',
    stars: false,
    mountains: true,
    leaves: true,
  },
  glow: {
    skyTop: '#252C23',
    skyMid: '#2E3628',
    skyBottom: '#38412F',
    orb: null,
    cloud: '#FFFFFF',
    cloudShade: '#FFFFFF',
    cloudOpacity: 0,
    far: '#2E3A2C',
    mid: '#2A3528',
    pineDark: '#22362A',
    pineLight: '#2F4A35',
    bush: '#2F4A33',
    bushLight: '#3B5A3C',
    hillTop: '#6E4C31',
    hillBottom: '#553925',
    stars: false,
    mountains: false,
    leaves: true,
  },
};

/** Fixed star positions as fractions of the sky (night only). */
const STARS: readonly [number, number, number][] = [
  [0.08, 0.1, 1.2], [0.2, 0.28, 0.9], [0.33, 0.06, 1.1], [0.47, 0.16, 0.8], [0.62, 0.05, 1],
  [0.72, 0.22, 0.9], [0.93, 0.32, 1.2], [0.14, 0.44, 0.8], [0.88, 0.48, 0.8], [0.55, 0.3, 0.7],
];

/** One conifer silhouette (3 jagged tiers) with its base at (x, y). */
function pinePath(x: number, y: number, h: number): string {
  const w = h * 0.42;
  const t = h / 3;
  let d = `M${x} ${y - h}`;
  for (let i = 0; i < 3; i++) {
    const top = y - h + i * t * 0.8;
    const base = top + t * 1.25;
    const hw = w * (0.45 + i * 0.28);
    d += ` L${x + hw} ${base} L${x + hw * 0.45} ${base - t * 0.18}`;
    if (i === 2) d += ` L${x + hw * 0.12} ${y} L${x - hw * 0.12} ${y}`;
    void top;
  }
  for (let i = 2; i >= 0; i--) {
    const top = y - h + i * t * 0.8;
    const base = top + t * 1.25;
    const hw = w * (0.45 + i * 0.28);
    if (i !== 2) d += ` L${x - hw * 0.45} ${base - t * 0.18 + t * 0.8 * 0}`;
    d += ` L${x - hw} ${base}`;
    if (i > 0) d += ` L${x - hw * 0.45} ${base - t * 0.18}`;
  }
  return `${d} Z`;
}

function Pines({ w, h, p, glow }: { w: number; h: number; p: Palette; glow?: boolean }) {
  const base = h * (glow ? 0.82 : 0.78);
  // [x fraction, height fraction, front?]
  const trees: readonly [number, number, boolean][] = [
    [0.03, 0.3, false], [0.12, 0.38, true], [0.21, 0.27, false], [0.27, 0.2, true],
    [0.74, 0.22, true], [0.82, 0.33, false], [0.9, 0.4, true], [0.98, 0.28, false],
  ];
  return (
    <G>
      {trees.map(([fx, fh, front], i) => (
        <Path key={i} d={pinePath(fx * w, base + (front ? h * 0.02 : 0), fh * h)} fill={front ? p.pineDark : p.pineLight} />
      ))}
    </G>
  );
}

function Bushes({ w, h, p, scale = 1 }: { w: number; h: number; p: Palette; scale?: number }) {
  const y = h * 0.8;
  const blobs: readonly [number, number, number][] = [
    [0.02, 0, 0.07], [0.1, 0.01, 0.06], [0.18, 0.02, 0.05], [0.84, 0.015, 0.055], [0.93, 0.0, 0.07], [1.0, 0.01, 0.06],
  ];
  return (
    <G>
      {blobs.map(([fx, fy, fr], i) => (
        <G key={i}>
          <Circle cx={fx * w} cy={y + fy * h} r={fr * w * scale} fill={p.bush} />
          <Circle
            cx={fx * w - fr * w * scale * 0.25}
            cy={y + fy * h - fr * w * scale * 0.3}
            r={fr * w * scale * 0.55}
            fill={p.bushLight}
            opacity={0.8}
          />
        </G>
      ))}
    </G>
  );
}

function Rays({ w, h }: { w: number; h: number }) {
  const cx = w / 2;
  const cy = h * 0.48;
  const reach = Math.max(w, h) * 1.2;
  const rays = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const da = 0.07;
    return `M${cx} ${cy} L${cx + Math.cos(a - da) * reach} ${cy + Math.sin(a - da) * reach} L${cx + Math.cos(a + da) * reach} ${cy + Math.sin(a + da) * reach} Z`;
  });
  return (
    <G>
      {rays.map((d, i) => (
        <Path key={i} d={d} fill="#F6EDC2" opacity={i % 2 ? 0.05 : 0.1} />
      ))}
    </G>
  );
}

/** A soft puffy cloud that drifts a little from side to side. */
function Cloud({
  x,
  y,
  width,
  p,
  delay,
}: {
  x: number;
  y: number;
  width: number;
  p: Palette;
  delay: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * 10 }] }));
  const h = width * 0.42;
  return (
    <Animated.View style={[styles.abs, { left: x, top: y }, style]}>
      <Svg width={width} height={h} viewBox="0 0 100 42">
        <G opacity={p.cloudOpacity}>
          <Circle cx={30} cy={26} r={13} fill={p.cloud} />
          <Circle cx={50} cy={18} r={17} fill={p.cloud} />
          <Circle cx={70} cy={25} r={13} fill={p.cloud} />
          <Rect x={18} y={26} width={66} height={13} rx={6.5} fill={p.cloud} />
          <Rect x={22} y={33} width={58} height={6} rx={3} fill={p.cloudShade} />
        </G>
      </Svg>
    </Animated.View>
  );
}

const LEAF_COLORS = ['#86B25C', '#E8894E', '#F2B76A', '#9CC46B', '#E77D52', '#F0A35E'];

/** Leaves tumbling through the scene (breaks and the finish celebration). */
function FallingLeaf({ i, w, h }: { i: number; w: number; h: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(i * 700, withRepeat(withTiming(1, { duration: 7000 + (i % 4) * 1300, easing: Easing.linear }), -1, false));
  }, [i, t]);
  const x0 = w * (0.08 + ((i * 0.29) % 0.86));
  const style = useAnimatedStyle(() => {
    const v = t.value;
    return {
      opacity: Math.sin(v * Math.PI) * 0.95,
      transform: [
        { translateX: x0 + Math.sin(v * Math.PI * 3 + i) * w * 0.05 },
        { translateY: h * 0.12 + v * h * 0.62 },
        { rotate: `${v * 540 + i * 40}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.leaf, { backgroundColor: LEAF_COLORS[i % LEAF_COLORS.length] }, style]} />;
}

interface SceneProps {
  width: number;
  height: number;
  variant: SceneVariant;
  /** Page colour the top corners fade into, so the art never looks boxed-in at the top. */
  blendColor: string;
  children?: ReactNode;
}

/** Painted backdrop for the growth stage: sky, sun/moon, clouds, mountains, pines and the hill. */
export function Scene({ width, height, variant, blendColor }: SceneProps) {
  const p = PALETTES[variant];
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const orb = Math.max(14, Math.min(w, h) * 0.07);
  // Top-only blend: corners melt into the page, the bottom edge stays crisp.
  const corner = Math.min(w, h) * 0.42;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id={`sky-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.skyTop} />
            <Stop offset="0.55" stopColor={p.skyMid} />
            <Stop offset="1" stopColor={p.skyBottom} />
          </LinearGradient>
          <LinearGradient id={`hill-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={p.hillTop} />
            <Stop offset="1" stopColor={p.hillBottom} />
          </LinearGradient>
          <RadialGradient id={`orb-${variant}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={p.orb ?? '#FFF'} stopOpacity={0.5} />
            <Stop offset="1" stopColor={p.orb ?? '#FFF'} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`burst-${variant}`} cx="50%" cy="48%" r="55%">
            <Stop offset="0" stopColor="#F4ECB8" stopOpacity={0.95} />
            <Stop offset="0.35" stopColor="#D8D18C" stopOpacity={0.45} />
            <Stop offset="1" stopColor="#2E3628" stopOpacity={0} />
          </RadialGradient>
          {/* Soft top-corner blend into the page background */}
          <RadialGradient id="cornerL" cx={0} cy={0} r={corner} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={blendColor} stopOpacity={1} />
            <Stop offset="0.3" stopColor={blendColor} stopOpacity={0.8} />
            <Stop offset="0.65" stopColor={blendColor} stopOpacity={0.3} />
            <Stop offset="1" stopColor={blendColor} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="cornerR" cx={w} cy={0} r={corner} gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={blendColor} stopOpacity={1} />
            <Stop offset="0.3" stopColor={blendColor} stopOpacity={0.8} />
            <Stop offset="0.65" stopColor={blendColor} stopOpacity={0.3} />
            <Stop offset="1" stopColor={blendColor} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={blendColor} stopOpacity={0.6} />
            <Stop offset="1" stopColor={blendColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x={0} y={0} width={w} height={h} fill={`url(#sky-${variant})`} />

        {variant === 'glow' && (
          <>
            <Rays w={w} h={h} />
            <Rect x={0} y={0} width={w} height={h} fill={`url(#burst-${variant})`} />
          </>
        )}

        {p.stars &&
          STARS.map(([fx, fy, r], i) => <Circle key={i} cx={fx * w} cy={fy * h} r={r} fill="#FFF6DC" opacity={0.7} />)}

        {p.mountains && (
          <>
            <Path
              d={`M0 ${h * 0.64} Q${w * 0.1} ${h * 0.55} ${w * 0.2} ${h * 0.58} Q${w * 0.32} ${h * 0.5} ${w * 0.44} ${h * 0.57} Q${w * 0.56} ${h * 0.5} ${w * 0.68} ${h * 0.56} Q${w * 0.82} ${h * 0.49} ${w} ${h * 0.58} L${w} ${h} L0 ${h} Z`}
              fill={p.far}
            />
            <Path
              d={`M0 ${h * 0.7} Q${w * 0.18} ${h * 0.62} ${w * 0.34} ${h * 0.68} Q${w * 0.5} ${h * 0.62} ${w * 0.66} ${h * 0.68} Q${w * 0.84} ${h * 0.62} ${w} ${h * 0.67} L${w} ${h} L0 ${h} Z`}
              fill={p.mid}
            />
          </>
        )}

        {variant === 'day' && (
          <>
            <Path
              d={`M0 ${h * 0.64} Q${w * 0.25} ${h * 0.56} ${w * 0.5} ${h * 0.63} T${w} ${h * 0.6} L${w} ${h} L0 ${h} Z`}
              fill={p.far}
            />
            <Path
              d={`M0 ${h * 0.73} Q${w * 0.3} ${h * 0.64} ${w * 0.62} ${h * 0.72} T${w} ${h * 0.68} L${w} ${h} L0 ${h} Z`}
              fill={p.mid}
            />
            {(
              [
                [0.15, 0.655, 0.032],
                [0.21, 0.665, 0.022],
                [0.8, 0.645, 0.028],
                [0.87, 0.652, 0.036],
              ] as const
            ).map(([fx, fy, fr], i) => (
              <G key={i}>
                <Circle cx={fx * w} cy={fy * h} r={fr * w} fill={p.pineDark} />
                <Circle cx={fx * w - fr * w * 0.3} cy={fy * h - fr * w * 0.3} r={fr * w * 0.5} fill={p.pineLight} />
              </G>
            ))}
          </>
        )}

        {variant !== 'day' && <Pines w={w} h={h} p={p} glow={variant === 'glow'} />}
        <Bushes w={w} h={h} p={p} scale={variant === 'day' ? 0.6 : 1} />

        <Path
          d={
            variant === 'glow'
              ? `M0 ${h * 0.9} Q${w * 0.5} ${h * 0.72} ${w} ${h * 0.9} L${w} ${h} L0 ${h} Z`
              : `M0 ${h * 0.86} Q${w * 0.22} ${h * 0.78} ${w * 0.5} ${h * 0.79} Q${w * 0.78} ${h * 0.8} ${w} ${h * 0.86} L${w} ${h} L0 ${h} Z`
          }
          fill={`url(#hill-${variant})`}
        />

        <Rect x={0} y={0} width={w} height={h * 0.22} fill="url(#topFade)" />
        <Rect x={0} y={0} width={corner} height={corner} fill="url(#cornerL)" />
        <Rect x={w - corner} y={0} width={corner} height={corner} fill="url(#cornerR)" />

        {/* Moon / sun sits above the corner blend so it stays bright */}
        {p.orb && (
          <>
            <Circle cx={w * 0.84} cy={h * 0.13} r={orb * 2.6} fill={`url(#orb-${variant})`} />
            <Circle cx={w * 0.84} cy={h * 0.13} r={orb} fill={p.orb} />
          </>
        )}
      </Svg>

      {p.cloudOpacity > 0 && (
        <>
          <Cloud x={-w * 0.06} y={h * (variant === 'day' ? 0.2 : 0.2)} width={w * 0.24} p={p} delay={0} />
          <Cloud x={w * 0.8} y={h * (variant === 'day' ? 0.18 : 0.38)} width={w * 0.22} p={p} delay={1500} />
          <Cloud x={-w * 0.04} y={h * 0.47} width={w * 0.2} p={p} delay={3000} />
          {variant === 'day' && <Cloud x={w * 0.83} y={h * 0.45} width={w * 0.2} p={p} delay={4500} />}
        </>
      )}

      {p.leaves && [0, 1, 2, 3, 4, 5, 6, 7].map((i) => <FallingLeaf key={i} i={i} w={w} h={h} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  leaf: { position: 'absolute', left: 0, top: 0, width: 9, height: 6, borderRadius: 6 },
});

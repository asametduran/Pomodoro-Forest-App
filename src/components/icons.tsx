import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Hand-drawn SVG icon set matching the design mockups. Monochrome icons take a single `color`;
 * the illustrated ones (flame, coin, trophy, calendar...) carry their own palette.
 */
export interface IconProps {
  size?: number;
  color: string;
  /** Secondary tone used for inner details. */
  accent?: string;
}

const stroke = (color: string, width = 2) => ({
  stroke: color,
  strokeWidth: width,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
});

export function LeafIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20.5 3.5C11 3.2 4.6 7.6 4.3 14.6c-.1 1.9.5 3.6 1.5 4.9 1-4.6 4.2-8.1 9.3-10.2-4 2.6-6.6 6.1-7.6 10.6 1.2.6 2.5.9 3.9.8 6.6-.6 9.6-7.6 9.1-17.2Z"
        fill={color}
      />
    </Svg>
  );
}

export function CodeIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M8 7 3 12l5 5M16 7l5 5-5 5M13.5 5l-3 14" {...stroke(color, 2.2)} />
    </Svg>
  );
}

export function BriefcaseIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" {...stroke(color, 2)} />
      <Rect x={3} y={7} width={18} height={13} rx={2.5} fill={color} />
      <Rect x={3} y={11.5} width={18} height={1.6} fill="#000" opacity={0.18} />
      <Rect x={10.5} y={10.5} width={3} height={3.6} rx={0.8} fill="#FFF" opacity={0.7} />
    </Svg>
  );
}

export function BookIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 6.5C10 5 7 4.5 3 4.8v13.5c4-.3 7 .2 9 1.7V6.5Z" fill={color} />
      <Path d="M12 6.5c2-1.5 5-2 9-1.7v13.5c-4-.3-7 .2-9 1.7V6.5Z" fill={color} opacity={0.78} />
    </Svg>
  );
}

/** Rounded deciduous tree (Forest tab, "trees grown"). */
export function TreeIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M11 13.5h2V21h-2z" fill={color} />
      <Path
        d="M12 2.5c2.3 0 4 1.5 4.3 3.4 1.9.4 3.2 1.9 3.2 3.8 0 1.4-.7 2.6-1.8 3.3.1.3.1.6.1.9 0 2-1.7 3.4-3.7 3.4-.8 0-1.5-.2-2.1-.6-.6.4-1.3.6-2.1.6-2 0-3.7-1.5-3.7-3.4 0-.3 0-.6.1-.9C5.2 12.3 4.5 11.1 4.5 9.7c0-1.9 1.4-3.4 3.2-3.8C8 4 9.7 2.5 12 2.5Z"
        fill={color}
      />
    </Svg>
  );
}

/** Bare, leafless tree (withered). */
export function BareTreeIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21v-8m0 0-4.5-4.5M12 13l4-4m-8.5-.5L5 6m2.5 2.5L7.3 4.5M16 9l3-2m-3 2 .5-4M12 13V6.5m0 0-1.8-2.2M12 6.5l1.6-2.5M9 21h6"
        {...stroke(color, 1.8)}
      />
    </Svg>
  );
}

export function ChartIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={11} width={4} height={9} rx={1.2} fill={color} />
      <Rect x={10} y={4} width={4} height={16} rx={1.2} fill={color} />
      <Rect x={16} y={8} width={4} height={12} rx={1.2} fill={color} />
    </Svg>
  );
}

export function SproutIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 21v-8.5" {...stroke(color, 2.2)} />
      <Path d="M12 12.8C11.7 8.4 8.6 5.6 3.6 5.8c-.2 4.6 3 7.6 8.4 7Z" fill={color} />
      <Path d="M12.2 11.6c.5-4 3.4-6.4 8.2-6 .1 4.2-2.9 6.8-8.2 6Z" fill={color} />
    </Svg>
  );
}

/** Gear generated from evenly spaced teeth so it stays perfectly symmetric. */
const GEAR_PATH = (() => {
  const teeth = 8;
  const outer = 10.4;
  const inner = 8;
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 4 === 0 || i % 4 === 1 ? outer : inner;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)},${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

export function GearIcon({ size = 20, color, accent = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={GEAR_PATH} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={1.2} />
      <Circle cx={12} cy={12} r={3.2} fill={accent} />
    </Svg>
  );
}

export function CheckIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m5 12.5 4.5 4.5L19 7.5" {...stroke(color, 2.8)} />
    </Svg>
  );
}

/** Filled circle with a check mark (badges). */
export function CheckCircleIcon({ size = 20, color, accent = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={color} />
      <Path d="m7.2 12.4 3.2 3.2 6.4-6.6" {...stroke(accent, 2.6)} />
    </Svg>
  );
}

export function AlertCircleIcon({ size = 20, color, accent = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={color} />
      <Path d="M12 6.8v6.4" {...stroke(accent, 2.8)} />
      <Circle cx={12} cy={17} r={1.6} fill={accent} />
    </Svg>
  );
}

export function ShareIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 15V3.5M7.5 8 12 3.5 16.5 8" {...stroke(color, 2.2)} />
      <Path d="M8 11H6.5A2.5 2.5 0 0 0 4 13.5v5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5v-5a2.5 2.5 0 0 0-2.5-2.5H16" {...stroke(color, 2.2)} />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color }: Omit<IconProps, 'accent'>) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6 6 18" {...stroke(color, 2.4)} />
    </Svg>
  );
}

export function ClockIcon({ size = 20, color, accent = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Path d="M12 7v5.2l3.4 2.2" {...stroke(accent, 2.2)} />
    </Svg>
  );
}

/* ---------- Illustrated (multi-colour) icons ---------- */

export function FlameIcon({ size = 20 }: { size?: number; color?: string; accent?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12.4 1.8c.9 3.5-.6 5.3-2.5 7.3-1.6 1.7-3.2 3.6-3.2 6.4a5.4 5.4 0 0 0 10.8 0c0-2.6-1.1-4.4-2.5-6-.3 1.5-1 2.4-2 2.9.6-4-.3-7.4-.6-10.6Z"
        fill="#F06A2E"
      />
      <Path
        d="M12 22c-2.3 0-4-1.6-4-3.8 0-1.9 1.3-3 2.4-4.3.3 1.3 1.1 1.9 1.8 2.6.6-1.5.6-3 .3-4.5 1.8 1.5 3.5 3.4 3.5 6.2 0 2.2-1.7 3.8-4 3.8Z"
        fill="#FFB33C"
      />
      <Path d="M12 22c-1.2 0-2.1-.9-2.1-2.1 0-1.2.8-1.9 1.6-2.7.2.7.6 1.1 1.1 1.5.5.4 1.4 1 1.4 1.9 0 .8-.9 1.4-2 1.4Z" fill="#FFE07A" />
    </Svg>
  );
}

export function CoinIcon({ size = 20 }: { size?: number; color?: string; accent?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <RadialGradient id="coin" cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FFE38A" />
          <Stop offset="1" stopColor="#E59A1E" />
        </RadialGradient>
      </Defs>
      <Circle cx={12} cy={12} r={10.5} fill="#C7801A" />
      <Circle cx={12} cy={11.6} r={10} fill="url(#coin)" />
      <Circle cx={12} cy={11.6} r={6.6} fill="none" stroke="#D98E1C" strokeWidth={1.4} opacity={0.75} />
      <Ellipse cx={9.4} cy={8.4} rx={2.2} ry={1.3} fill="#FFF6D2" opacity={0.7} />
    </Svg>
  );
}

export function TrophyIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill="#EDB548" />
      <Path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" {...stroke('#D49A2C', 1.8)} />
      <Rect x={10.8} y={13.5} width={2.4} height={3.5} fill="#D49A2C" />
      <Rect x={7.5} y={17} width={9} height={3} rx={1} fill="#C7882A" />
      <Path d="M9.5 5.5v3.2" {...stroke('#FFE7A6', 1.4)} />
    </Svg>
  );
}

export function TagIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6l8 8a1.6 1.6 0 0 1 0 2.2l-7.1 7.1a1.6 1.6 0 0 1-2.2 0l-7.8-8.2Z" fill="#7DAA6E" />
      <Circle cx={8.3} cy={8.3} r={1.8} fill="#E9F2DF" />
    </Svg>
  );
}

export function SeedIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 15.5C4.2 9.6 9.5 4.2 18.8 4.6c.8 8.6-4.4 14.5-11.3 14.2-1.3-.6-2.2-1.8-2.5-3.3Z" fill="#B57A4C" />
      <Path d="M6.8 17.2c2.3-4.6 5.8-8 10.3-10.4" {...stroke('#8A5530', 1.4)} />
      <Path d="M8.8 8.9c1.6-1.7 3.8-2.8 6.6-3.3" {...stroke('#E3B88E', 1.3)} />
    </Svg>
  );
}

export function CalendarIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3} y={4.5} width={18} height={16.5} rx={3} fill="#F4E3BE" />
      <Path d="M3 7.5a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3V10H3V7.5Z" fill="#8DB37E" />
      <Path d="M8 3v3.5M16 3v3.5" {...stroke('#5E7F53', 2)} />
      <G fill="#8DB37E">
        <Rect x={6} y={12.5} width={3} height={2.5} rx={0.6} />
        <Rect x={10.5} y={12.5} width={3} height={2.5} rx={0.6} />
        <Rect x={15} y={12.5} width={3} height={2.5} rx={0.6} />
        <Rect x={6} y={16.5} width={3} height={2.5} rx={0.6} />
        <Rect x={10.5} y={16.5} width={3} height={2.5} rx={0.6} />
      </G>
    </Svg>
  );
}

export function FlagIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Line x1={5} y1={3} x2={5} y2={21.5} {...stroke('#B9A27E', 2)} />
      <Path d="M5.6 4.5c3-1.4 5 .8 7.6.2 2-.4 3.4-1.2 5.6-.4v9c-2.2-.8-3.6 0-5.6.4-2.6.6-4.6-1.6-7.6-.2v-9Z" fill="#E8D9B8" />
    </Svg>
  );
}

/** Coloured clock used in the session detail rows. */
export function TimerIcon({ size = 20 }: { size?: number }) {
  return <ClockIcon size={size} color="#8DB37E" accent="#F4F1E3" />;
}

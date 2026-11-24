import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

import { TreeSvg } from '@/components/tree/tree-svg';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** Little backdrop behind each species, sampled from the mockup's round seed buttons. */
const BACKDROPS: Record<string, { light: [string, string, string]; dark: [string, string, string] }> = {
  oak: { light: ['#EEF1DE', '#E2E9CD', '#C9D9A6'], dark: ['#3C5A3A', '#5F7E4F', '#4B6A3C'] },
  pine: { light: ['#E3EEE0', '#D4E4CC', '#B6D09F'], dark: ['#A9C9DB', '#CFE0E3', '#7FA766'] },
  cherry: { light: ['#F4E4E6', '#EED5DA', '#D9C2B0'], dark: ['#D9C9CD', '#E9DDE0', '#B9A08F'] },
  maple: { light: ['#FBE4D2', '#F7D2B6', '#E8B48C'], dark: ['#F5CFAE', '#FAE0C9', '#D9A57A'] },
};

interface SpeciesBadgeProps {
  speciesId: string;
  size?: number;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Round "seed" button: the species' grown tree on its own little backdrop. */
export function SpeciesBadge({ speciesId, size = 64, selected = false, onPress, accessibilityLabel }: SpeciesBadgeProps) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const colors = (BACKDROPS[speciesId] ?? BACKDROPS.oak)[dark ? 'dark' : 'light'];
  const gid = `badge-${speciesId}-${dark ? 'd' : 'l'}`;

  const body = (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: selected ? '#F0DDA4' : theme.border,
          borderWidth: selected ? 3 : 1,
          boxShadow: selected ? '0px 0px 12px rgba(240,221,164,0.55)' : `0px 2px 6px ${theme.shadow}`,
        },
      ]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors[0]} />
            <Stop offset="1" stopColor={colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={size} height={size} fill={`url(#${gid})`} />
        <Ellipse cx={size / 2} cy={size * 1.02} rx={size * 0.62} ry={size * 0.26} fill={colors[2]} />
      </Svg>
      <View style={[styles.tree, { bottom: size * 0.04 }]}>
        <TreeSvg speciesId={speciesId} progress={1} size={size * 0.84} ground={false} fit minSide={150} />
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { overflow: 'hidden', alignItems: 'center' },
  tree: { position: 'absolute', alignSelf: 'center' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
});

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Celebration } from '@/components/celebration';
import { LivingTree } from '@/components/living-tree';
import { Scene, sceneVariant, type SceneMode, type SceneVariant } from '@/components/scene';
import { ThemedText } from '@/components/themed-text';
import { AppFonts, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

/** Text and chrome colours that read well on each painted backdrop. */
const ON_SCENE: Record<
  SceneVariant,
  { text: string; pillBg: string; pillBorder: string; pillText: string; track: string; fill: string }
> = {
  night: {
    text: '#F6ECDC',
    pillBg: 'rgba(16,26,30,0.45)',
    pillBorder: 'rgba(246,236,220,0.5)',
    pillText: '#F3E8D6',
    track: 'rgba(255,255,255,0.18)',
    fill: '#7DA877',
  },
  day: {
    text: '#1F271C',
    pillBg: 'rgba(255,255,255,0.42)',
    pillBorder: 'rgba(255,255,255,0.0)',
    pillText: '#2B3428',
    track: 'rgba(255,255,255,0.55)',
    fill: '#5F8657',
  },
  warm: {
    text: '#2A2019',
    pillBg: 'rgba(255,242,230,0.45)',
    pillBorder: 'rgba(255,255,255,0.45)',
    pillText: '#3A2A20',
    track: 'rgba(255,255,255,0.45)',
    fill: '#E0906B',
  },
  dusk: {
    text: '#F8E8D8',
    pillBg: 'rgba(30,20,24,0.4)',
    pillBorder: 'rgba(248,232,216,0.45)',
    pillText: '#F6E4D2',
    track: 'rgba(255,255,255,0.18)',
    fill: '#E79A72',
  },
  glow: {
    text: '#F6ECDC',
    pillBg: 'rgba(16,26,20,0.4)',
    pillBorder: 'rgba(246,236,220,0.45)',
    pillText: '#F3E8D6',
    track: 'rgba(255,255,255,0.18)',
    fill: '#7DA877',
  },
};

interface GrowthStageProps {
  speciesId: string;
  /** 0..1 growth of the tree. */
  progress: number;
  withered: boolean;
  mode: SceneMode;
  /** Status pill text ("READY TO GROW"), or null for none. */
  status: string | null;
  /** Tint the status pill as a warning (withered). */
  danger?: boolean;
  /** Timer text such as "24:31". Pass null to hide the clock entirely. */
  clock: string | null;
  /** 0..1 progress bar under the clock, or null for none. */
  fraction?: number | null;
  sway?: boolean;
  /** Changes to a positive number to play the "finished!" celebration. */
  celebrateKey?: number;
  /** Action floating over the bottom of the scene (e.g. "Give up"). */
  overlay?: ReactNode;
  /** Edge-to-edge art without card chrome; the bottom also fades into the page. */
  bare?: boolean;
  /** Tree box size as a fraction of the stage height. */
  treeScale?: number;
  /** Smallest framed area for the tree (smaller = young trees appear larger). */
  minSide?: number;
  /** Changing this remounts the tree (e.g. a new session starts from a seed instead of shrinking). */
  treeKey?: string | number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The hero of the app: a painted scene with the status, the timer, a progress bar and a living
 * tree. It measures itself, so it fills whatever space its parent gives it on any screen size.
 */
export function GrowthStage({
  speciesId,
  progress,
  withered,
  mode,
  status,
  danger,
  clock,
  fraction = null,
  sway = true,
  celebrateKey = 0,
  overlay,
  bare = false,
  treeScale = 0.5,
  treeKey,
  minSide = 168,
  style,
}: GrowthStageProps) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const variant = sceneVariant(mode, dark);
  const ink = ON_SCENE[variant];
  const [box, setBox] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
  };

  const clockSize = Math.round(Math.max(40, Math.min(84, box.w * 0.215, box.h * 0.25)));
  const treeSize = Math.round(Math.max(90, Math.min(box.w * 0.82, box.h * treeScale)));

  return (
    <View style={[styles.stage, bare ? styles.bare : styles.card, style]} onLayout={onLayout}>
      {box.w > 0 && <Scene width={box.w} height={box.h} variant={variant} blendColor={theme.background} />}

      {bare && box.w > 0 && (
        <Svg width={box.w} height={box.h * 0.2} style={styles.bottomFade} pointerEvents="none">
          <Defs>
            <LinearGradient id="stageBottom" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.background} stopOpacity={0} />
              <Stop offset="1" stopColor={theme.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={box.w} height={box.h * 0.2} fill="url(#stageBottom)" />
        </Svg>
      )}

      {box.w > 0 && (
        <View
          style={[styles.treeBox, { width: treeSize, height: treeSize, bottom: box.h * (overlay ? 0.1 : 0.025) }]}
          pointerEvents="box-none">
          <LivingTree
            key={treeKey}
            speciesId={speciesId}
            progress={progress}
            withered={withered}
            size={treeSize}
            fit
            minSide={minSide}
            sway={sway}
          />
          <Celebration triggerKey={celebrateKey} size={treeSize} />
        </View>
      )}

      {(status !== null || clock !== null) && (
        <View style={[styles.topBlock, { top: Math.max(12, box.h * 0.05) }]} pointerEvents="none">
          {status !== null && (
            <View style={[styles.statusPill, { backgroundColor: ink.pillBg, borderColor: ink.pillBorder }]}>
              <ThemedText style={[styles.statusText, { color: danger ? theme.danger : ink.pillText }]}>
                {status}
              </ThemedText>
            </View>
          )}
          {clock !== null && <Clock text={clock} size={clockSize} color={ink.text} />}
          {fraction !== null && clock !== null && (
            <View style={[styles.progressTrack, { width: box.w * 0.62, backgroundColor: ink.track }]}>
              <View style={[styles.progressFill, { width: `${Math.max(3, fraction * 100)}%`, backgroundColor: ink.fill }]} />
            </View>
          )}
        </View>
      )}

      {overlay && <View style={[styles.overlay, { bottom: Math.max(10, box.h * 0.04) }]}>{overlay}</View>}
    </View>
  );
}

/** Timer digits in fixed-width cells so the clock never jitters as numbers change. */
function Clock({ text, size, color }: { text: string; size: number; color: string }) {
  return (
    <View accessible accessibilityRole="timer" accessibilityLabel={text} style={styles.clock}>
      {text.split('').map((ch, i) => (
        <View key={i} style={{ width: ch === ':' ? size * 0.3 : size * 0.62, alignItems: 'center' }}>
          <ThemedText
            importantForAccessibility="no"
            style={{ fontFamily: AppFonts.displayBold, fontSize: size, lineHeight: size * 1.16, color }}>
            {ch}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

/** White pill button that floats over the scene ("Give up", "Skip break"). */
export function SceneButton({
  label,
  onPress,
  tone = 'normal',
}: {
  label: string;
  onPress: () => void;
  tone?: 'normal' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.sceneButton, pressed && styles.sceneButtonPressed]}>
      <ThemedText style={[styles.sceneButtonText, tone === 'danger' && styles.sceneButtonDanger]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minHeight: 220,
    overflow: 'hidden',
    alignItems: 'center',
  },
  card: { borderRadius: 22 },
  bare: { borderRadius: 0 },
  bottomFade: { position: 'absolute', left: 0, bottom: 0 },
  topBlock: { position: 'absolute', alignItems: 'center', gap: Spacing.one },
  clock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Spacing.one },
  statusPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
  },
  statusText: {
    fontFamily: AppFonts.bodyHeavy,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    fontSize: 14,
    lineHeight: 18,
  },
  progressTrack: { height: 8, borderRadius: Radius.pill, overflow: 'hidden', marginTop: Spacing.two },
  progressFill: { height: '100%', borderRadius: Radius.pill },
  treeBox: { position: 'absolute', alignSelf: 'center' },
  overlay: { position: 'absolute', alignSelf: 'center' },
  sceneButton: {
    minHeight: 42,
    paddingHorizontal: 30,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,250,243,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(40,30,20,0.18)',
  },
  sceneButtonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  sceneButtonText: { fontFamily: AppFonts.bodyHeavy, fontSize: 16, lineHeight: 22, color: '#2A2A22' },
  sceneButtonDanger: { color: '#C8552E' },
});

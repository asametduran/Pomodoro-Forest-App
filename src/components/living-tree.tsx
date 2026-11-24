import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { TreeSvg, type TreeSvgProps } from '@/components/tree/tree-svg';
import { useSmoothValue } from '@/hooks/use-smooth-value';
import { tap } from '@/lib/alerts';
import { stageForProgress, type GrowthStage } from '@/lib/growth';
import { getSpecies, WITHERED_COLORS } from '@/lib/species';
import { useAppStore } from '@/store/app-store';

const AMPLITUDE: Record<GrowthStage, number> = { seed: 0.4, sprout: 1.2, sapling: 1.8, tree: 2.4 };

/** Fixed directions for the leaves shaken loose by a tap, a growth pop or a wither. */
const BURST = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + (i % 3) * 0.35;
  return {
    dx: Math.cos(angle),
    dy: Math.sin(angle) - 0.35,
    spin: (i % 2 ? 1 : -1) * (140 + i * 18),
    scale: 0.75 + (i % 4) * 0.2,
  };
});

type Burst = (typeof BURST)[number];

function BurstLeaf({
  t,
  spec,
  reach,
  fall,
  color,
}: {
  t: SharedValue<number>;
  spec: Burst;
  reach: number;
  fall: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = t.value;
    const out = 1 - (1 - p) * (1 - p);
    return {
      opacity: p <= 0 || p >= 1 ? 0 : 1 - p * p,
      transform: [
        { translateX: spec.dx * reach * out },
        { translateY: spec.dy * reach * out + fall * p * p },
        { rotate: `${spec.spin * p}deg` },
        { scale: spec.scale * (1 - 0.35 * p) },
      ],
    };
  });
  return <Animated.View style={[styles.leaf, { backgroundColor: color }, style]} />;
}

type AmbientKind = 'fall' | 'rise';

/** A slow looping drifter: petals/leaves falling, or fireflies floating up. */
function AmbientParticle({
  index,
  size,
  kind,
  color,
}: {
  index: number;
  size: number;
  kind: AmbientKind;
  color: string;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = 0;
    p.value = withDelay(
      index * 1100,
      withRepeat(withTiming(1, { duration: 7000 + index * 1300, easing: Easing.linear }), -1, false),
    );
  }, [index, p]);

  const x0 = size * (0.18 + ((index * 0.37) % 0.64));
  const style = useAnimatedStyle(() => {
    const v = p.value;
    const drift = Math.sin(v * Math.PI * 4 + index) * size * 0.04;
    if (kind === 'fall') {
      return {
        opacity: Math.sin(v * Math.PI) * 0.9,
        transform: [{ translateX: x0 + drift }, { translateY: size * 0.18 + v * size * 0.62 }, { rotate: `${v * 420}deg` }],
      };
    }
    return {
      opacity: Math.sin(v * Math.PI) * 0.9,
      transform: [
        { translateX: x0 + drift },
        { translateY: size * 0.78 - v * size * 0.52 },
        { scale: 0.7 + 0.5 * Math.sin(v * Math.PI * 6) },
      ],
    };
  });

  return <Animated.View style={[kind === 'fall' ? styles.petal : styles.firefly, { backgroundColor: color }, style]} />;
}

interface LivingTreeProps extends TreeSvgProps {
  /** Gentle wind sway and breathing. */
  sway?: boolean;
  /** Drifting petals, leaves or fireflies around a grown tree. */
  ambient?: boolean;
  /** Tap the tree to nudge it and shake leaves loose. */
  interactive?: boolean;
  /** Ease growth between updates instead of stepping. */
  smooth?: boolean;
}

/**
 * The animated tree: it grows smoothly, sways and breathes, pops when it reaches a new stage,
 * drops leaves when it withers, and reacts when you tap it.
 */
export function LivingTree({
  sway = true,
  ambient = true,
  interactive = true,
  smooth = true,
  ...tree
}: LivingTreeProps) {
  const size = tree.size ?? 200;
  const species = getSpecies(tree.speciesId);
  const withered = !!tree.withered;
  const stage = stageForProgress(tree.progress);
  const shown = useSmoothValue(tree.progress, smooth);
  const haptics = useAppStore((s) => s.settings.hapticsEnabled);

  const swayAngle = useSharedValue(0);
  const nudge = useSharedValue(0);
  const squish = useSharedValue(1);
  const breath = useSharedValue(0);
  const pop = useSharedValue(1);
  const burst = useSharedValue(0);
  const flip = useRef(1);

  const fireBurst = () => {
    burst.set(0);
    burst.set(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }));
  };

  // Wind sway + breathing
  const amplitude = withered ? 0 : AMPLITUDE[stage];
  useEffect(() => {
    if (!sway || withered) {
      swayAngle.value = withTiming(0, { duration: 300 });
      breath.value = withTiming(0, { duration: 300 });
      return;
    }
    swayAngle.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(-amplitude, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [sway, withered, amplitude, swayAngle, breath]);

  // A little celebration every time the tree reaches a new growth stage
  const previousStage = useRef(stage);
  useEffect(() => {
    if (previousStage.current === stage) return;
    previousStage.current = stage;
    pop.set(withSequence(withTiming(1.12, { duration: 140 }), withSpring(1, { damping: 6 })));
    burst.set(0);
    burst.set(withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) }));
  }, [stage, pop, burst]);

  // Droop and drop leaves when the tree withers
  const previouslyWithered = useRef(withered);
  useEffect(() => {
    if (previouslyWithered.current === withered) return;
    previouslyWithered.current = withered;
    if (withered) {
      nudge.set(withSequence(withTiming(-9, { duration: 140 }), withSpring(0, { damping: 3 })));
      burst.set(0);
      burst.set(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }));
    }
  }, [withered, nudge, burst]);

  const onPress = () => {
    flip.current *= -1;
    nudge.set(
      withSequence(withTiming(7 * flip.current, { duration: 90 }), withSpring(0, { damping: 4, stiffness: 150 })),
    );
    squish.set(withSequence(withTiming(0.93, { duration: 90 }), withSpring(1, { damping: 5, stiffness: 160 })));
    fireBurst();
    tap(haptics);
  };

  const treeStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${swayAngle.value + nudge.value}deg` },
      { scaleX: (1 + (1 - squish.value) * 0.6) * pop.value * (1 - breath.value * 0.005) },
      { scaleY: squish.value * pop.value * (1 + breath.value * 0.012) },
    ],
    transformOrigin: '50% 90%',
  }));

  const colors = withered ? WITHERED_COLORS : species.colors;
  const burstColors = [colors.canopy, colors.canopyLight, colors.accent];
  const blossomy = species.shape === 'blossom' || species.shape === 'maple';
  const ambientKind: AmbientKind = withered || blossomy ? 'fall' : 'rise';
  const ambientColor = withered ? WITHERED_COLORS.canopy : blossomy ? colors.accent : '#F6E7A1';
  const ambientOn = ambient && (withered ? tree.progress >= 0.3 : stage === 'tree');

  const body = (
    <View style={{ width: size, height: size }}>
      <Animated.View style={treeStyle}>
        <TreeSvg {...tree} size={size} progress={shown} />
      </Animated.View>

      {ambientOn && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {[0, 1, 2, 3, 4].map((i) => (
            <AmbientParticle key={i} index={i} size={size} kind={ambientKind} color={ambientColor} />
          ))}
        </View>
      )}

      <View style={[styles.burstOrigin, { left: size / 2, top: size * 0.45 }]} pointerEvents="none">
        {BURST.map((spec, i) => (
          <BurstLeaf
            key={i}
            t={burst}
            spec={spec}
            reach={size * 0.34}
            fall={size * 0.32}
            color={burstColors[i % burstColors.length]}
          />
        ))}
      </View>
    </View>
  );

  if (!interactive) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Nudge the tree"
      accessibilityHint="Shakes the tree and knocks a few leaves loose"
      onPress={onPress}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  leaf: { position: 'absolute', width: 10, height: 6, borderRadius: 6, left: -5, top: -3 },
  burstOrigin: { position: 'absolute', width: 0, height: 0 },
  petal: { position: 'absolute', left: 0, top: 0, width: 9, height: 6, borderRadius: 6 },
  firefly: { position: 'absolute', left: 0, top: 0, width: 6, height: 6, borderRadius: 3 },
});

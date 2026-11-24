import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

const COLORS = ['#F4C95D', '#9CCB9F', '#F0A6B5', '#E6A06E', '#FFFFFF'];

const SPARKS = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const far = i % 2 ? 1 : 0.68;
  return {
    dx: Math.cos(angle) * far,
    dy: Math.sin(angle) * far - 0.1,
    size: 5 + (i % 3) * 2,
    color: COLORS[i % COLORS.length],
    delay: (i % 3) * 0.06,
  };
});

type Spark = (typeof SPARKS)[number];

function SparkDot({ t, spark, reach }: { t: SharedValue<number>; spark: Spark; reach: number }) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.value - spark.delay) / (1 - spark.delay)));
    const out = 1 - (1 - p) * (1 - p);
    return {
      opacity: p <= 0 || p >= 1 ? 0 : 1 - p * p,
      transform: [
        { translateX: spark.dx * reach * out },
        { translateY: spark.dy * reach * out + 14 * p * p },
        { scale: (1 + 0.6 * Math.sin(p * Math.PI)) * (1 - 0.3 * p) },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.spark,
        { width: spark.size, height: spark.size, borderRadius: spark.size / 2, backgroundColor: spark.color },
        style,
      ]}
    />
  );
}

function Ring({ t, reach, offset, color }: { t: SharedValue<number>; reach: number; offset: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.value - offset) / (1 - offset)));
    const out = 1 - (1 - p) * (1 - p);
    return {
      opacity: p <= 0 || p >= 1 ? 0 : (1 - p) * 0.6,
      transform: [{ scale: 0.25 + 1.35 * out }],
    };
  });
  return (
    <Animated.View
      style={[
        styles.ring,
        { width: reach * 2, height: reach * 2, borderRadius: reach, left: -reach, top: -reach, borderColor: color },
        style,
      ]}
    />
  );
}

/**
 * "You made it!" burst: expanding rings and a shower of sparkles around the tree.
 * Plays whenever `triggerKey` changes to a positive number.
 */
export function Celebration({ triggerKey, size }: { triggerKey: number; size: number }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (triggerKey <= 0) return;
    t.value = 0;
    t.value = withTiming(1, { duration: 2000, easing: Easing.linear });
  }, [triggerKey, t]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.origin, { left: size / 2, top: size * 0.42 }]}>
        <Ring t={t} reach={size * 0.34} offset={0} color="#F4C95D" />
        <Ring t={t} reach={size * 0.34} offset={0.16} color="#9CCB9F" />
        {SPARKS.map((spark, i) => (
          <SparkDot key={i} t={t} spark={spark} reach={size * 0.52} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { position: 'absolute', width: 0, height: 0 },
  spark: { position: 'absolute', left: -4, top: -4 },
  ring: { position: 'absolute', borderWidth: 3 },
});

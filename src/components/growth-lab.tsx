import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GrowthStage } from '@/components/growth-stage';
import type { SceneMode } from '@/components/scene';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, SectionLabel } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clamp01, STAGE_LABELS, stageForProgress } from '@/lib/growth';
import { SPECIES } from '@/lib/species';
import { formatClock } from '@/lib/timer';

const STAGES = [
  { label: 'Seed', value: 0.05 },
  { label: 'Sprout', value: 0.25 },
  { label: 'Sapling', value: 0.55 },
  { label: 'Full tree', value: 1 },
] as const;

const SCENES: readonly { id: SceneMode; label: string }[] = [
  { id: 'focus', label: 'Focus' },
  { id: 'break', label: 'Break' },
  { id: 'idle', label: 'Idle' },
];

/** A drag-anywhere slider built from a plain View, so it behaves the same on web and phones. */
function Scrubber({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const theme = useTheme();
  const [width, setWidth] = useState(1);
  const setFrom = (x: number) => onChange(clamp01(x / width));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Growth progress"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(clamp01(value + (e.nativeEvent.actionName === 'increment' ? 0.05 : -0.05)))}
      onLayout={(e) => setWidth(Math.max(1, e.nativeEvent.layout.width))}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) => setFrom(e.nativeEvent.locationX)}
      onResponderMove={(e) => setFrom(e.nativeEvent.locationX)}
      style={styles.scrubber}>
      <View pointerEvents="none" style={[styles.scrubTrack, { backgroundColor: theme.backgroundSelected }]} />
      <View
        pointerEvents="none"
        style={[styles.scrubFill, { width: `${value * 100}%`, backgroundColor: theme.primary }]}
      />
      <View
        pointerEvents="none"
        style={[styles.scrubThumb, { left: `${value * 100}%`, backgroundColor: theme.primaryStrong, borderColor: theme.card }]}
      />
    </View>
  );
}

function LabContent({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const stageHeight = Math.max(220, Math.min(320, Math.round(height * 0.4)));

  const [speciesId, setSpeciesId] = useState('oak');
  const [progress, setProgress] = useState(0.05);
  const [withered, setWithered] = useState(false);
  const [mode, setMode] = useState<SceneMode>('focus');
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const play = useRef({ startedAt: 0, from: 0, seconds: 10 });

  // Auto-play: grow from the current progress to a full tree, then celebrate.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const step = () => {
      const { startedAt, from, seconds } = play.current;
      const t = Math.min(1, (Date.now() - startedAt) / (seconds * 1000 * (1 - from)));
      setProgress(from + (1 - from) * t);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setPlaying(false);
        setCelebrateKey((k) => k + 1);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const startPlay = (seconds: number) => {
    play.current = { startedAt: Date.now(), from: withered || progress >= 1 ? 0 : progress, seconds };
    setWithered(false);
    setPlaying(true);
  };
  const jump = (value: number) => {
    setPlaying(false);
    setWithered(false);
    setProgress(value);
  };
  const finishNow = () => {
    setPlaying(false);
    setWithered(false);
    setProgress(1);
    setCelebrateKey((k) => k + 1);
  };

  const stage = stageForProgress(progress);
  const status = withered ? 'Withered' : progress >= 1 ? 'Fully grown' : STAGE_LABELS[stage];

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <ThemedText type="subtitle">Growth lab</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Preview every animation without waiting for a timer.
          </ThemedText>
        </View>
        <Button label="Done" variant="soft" onPress={onClose} />
      </View>

      {/* The stage stays pinned so the tree is always visible while you use the controls below. */}
      <View style={[styles.column, styles.pinned]}>
        <GrowthStage
          style={{ flexGrow: 0, flexShrink: 0, height: stageHeight }}
          speciesId={speciesId}
          progress={progress}
          withered={withered}
          mode={mode}
          status={`${status} · ${Math.round(progress * 100)}%`}
          danger={withered}
          clock={formatClock((1 - progress) * 25 * 60_000)}
          fraction={progress}
          celebrateKey={celebrateKey}
        />
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          Tap or nudge the tree to make it react.
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.four }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          <SectionLabel>Growth</SectionLabel>
          <Card>
            <Scrubber
              value={progress}
              onChange={(v) => {
                setPlaying(false);
                setWithered(false);
                setProgress(v);
              }}
            />
            <View style={styles.row}>
              {STAGES.map((s) => (
                <Chip
                  key={s.label}
                  fill
                  label={s.label}
                  selected={!withered && stageForProgress(progress) === stageForProgress(s.value)}
                  onPress={() => jump(s.value)}
                />
              ))}
            </View>
            <View style={styles.row}>
              <Button label="Play 10s" variant="soft" style={styles.flex} onPress={() => startPlay(10)} />
              <Button label="Play 30s" variant="soft" style={styles.flex} onPress={() => startPlay(30)} />
              {playing && <Button label="Stop" variant="ghost" onPress={() => setPlaying(false)} />}
            </View>
          </Card>

          <SectionLabel>Moments</SectionLabel>
          <Card>
            <Button large label="Finish now (celebrate)" onPress={finishNow} />
            <View style={styles.row}>
              <Button
                label={withered ? 'Revive tree' : 'Wither tree'}
                variant={withered ? 'soft' : 'danger'}
                style={styles.flex}
                onPress={() => {
                  setPlaying(false);
                  setWithered((w) => !w);
                  if (progress < 0.15) setProgress(0.5);
                }}
              />
              <Button label="Reset" variant="ghost" style={styles.flex} onPress={() => jump(0.05)} />
            </View>
          </Card>

          <SectionLabel>Species</SectionLabel>
          <View style={styles.row}>
            {SPECIES.map((s) => (
              <Chip key={s.id} fill label={s.name.split(' ')[1] ?? s.name} accessibilityLabel={s.name} selected={speciesId === s.id} onPress={() => setSpeciesId(s.id)} />
            ))}
          </View>

          <SectionLabel>Scene</SectionLabel>
          <View style={styles.row}>
            {SCENES.map((s) => (
              <Chip key={s.id} fill label={s.label} selected={mode === s.id} onPress={() => setMode(s.id)} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Full-screen preview of the growth animations. Nothing here touches your real forest or coins. */
export function GrowthLab({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <LabContent onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  scroll: { alignItems: 'center', paddingHorizontal: Spacing.three },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  pinned: { alignSelf: 'center', paddingHorizontal: Spacing.three, gap: Spacing.one },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  scrubber: { height: 40, justifyContent: 'center' },
  scrubTrack: { height: 8, borderRadius: Radius.pill },
  scrubFill: { position: 'absolute', height: 8, borderRadius: Radius.pill },
  scrubThumb: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    marginLeft: -13,
    borderWidth: 3,
  },
});

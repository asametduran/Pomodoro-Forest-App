import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GrowthStage, SceneButton } from '@/components/growth-stage';
import {
  AlertCircleIcon,
  BookIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  CodeIcon,
  CoinIcon,
  FlameIcon,
  LeafIcon,
} from '@/components/icons';
import type { SceneMode } from '@/components/scene';
import { ThemedText } from '@/components/themed-text';
import { SpeciesBadge } from '@/components/tree/species-badge';
import { Button, Chip, IconTile, TAB_BAR_SPACE } from '@/components/ui';
import { AppFonts, cardShadow, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { dayStreak, levelFor } from '@/lib/progress';
import { getSpecies, SPECIES } from '@/lib/species';
import { focusSecondsToday, summarize } from '@/lib/stats';
import { formatClock, nextBreakKind, progressOf, remainingMs } from '@/lib/timer';
import { TAGS, type Session, type TagId } from '@/lib/types';
import { useAppStore } from '@/store/app-store';

const PRESETS = [15, 25, 45, 60] as const;
/** Daily focus goal shown by the idle progress bar. */
const DAILY_GOAL_MINUTES = 100;

const TAG_ICONS: Record<TagId, (color: string) => ReactNode> = {
  study: (c) => <LeafIcon size={22} color={c} />,
  coding: (c) => <CodeIcon size={22} color={c} />,
  work: (c) => <BriefcaseIcon size={22} color={c} />,
  reading: (c) => <BookIcon size={22} color={c} />,
};

/** Fixed heights of the controls under the stage (tiles, chips, seeds, button + gaps). */
const CONTROLS_HEIGHT = 60 + 42 + 66 + 56 + 12 * 3;
const HEADER_HEIGHT = 54;

export default function FocusScreen() {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const active = useAppStore((s) => s.active);
  const settings = useAppStore((s) => s.settings);
  const sessions = useAppStore((s) => s.sessions);
  const selectedTag = useAppStore((s) => s.selectedTag);
  const selectedSpecies = useAppStore((s) => s.selectedSpecies);
  const unlocked = useAppStore((s) => s.unlockedSpecies);
  const coins = useAppStore((s) => s.coins);
  const focusStreak = useAppStore((s) => s.focusStreak);
  const lastResult = useAppStore((s) => s.lastResult);
  const { startFocus, startBreak, endBreak, giveUp, selectTag, selectSpecies, updateSettings, dismissResult } =
    useAppStore.getState();

  const now = useNow(true, active ? 250 : 30_000);
  // Remember which session the "give up?" prompt was opened for, so it never leaks into the next one.
  const [confirmFor, setConfirmFor] = useState<number | null>(null);
  const confirming = active !== null && confirmFor === active.startedAt;

  const streak = useMemo(() => dayStreak(sessions, now), [sessions, now]);
  const level = useMemo(() => levelFor(summarize(sessions).totalFocusSeconds), [sessions]);
  const todayMinutes = focusSecondsToday(sessions, now) / 60;

  const isFocus = active?.kind === 'focus';
  const isBreak = active !== null && !isFocus;
  const species = getSpecies(active?.speciesId ?? selectedSpecies);

  // Layout: the stage gets whatever height is left so everything fits without scrolling.
  const bottomPad = TAB_BAR_SPACE;
  const contentWidth = Math.min(width, 560) - Spacing.three * 2;
  const reserved = insets.top + Spacing.two + HEADER_HEIGHT + CONTROLS_HEIGHT + 12 * 2 + bottomPad;
  const stageHeight = Math.round(Math.max(230, Math.min(contentWidth * 0.96, height - reserved)));

  const headerPillBg = dark ? theme.card : theme.cardAlt;

  /* ---------- Finished: celebration screen ---------- */
  if (!active && lastResult) {
    return (
      <ResultScreen
        session={lastResult}
        upcomingBreak={nextBreakKind(focusStreak, settings.longBreakEvery) === 'longBreak' ? 'Take a long break' : 'Take a short break'}
        onContinue={dismissResult}
        onBreak={() => startBreak()}
        bottomPad={bottomPad}
        topInset={insets.top}
      />
    );
  }

  /* ---------- Idle / focusing / break ---------- */
  let status = 'Ready to grow';
  let clock = formatClock(settings.focusMinutes * 60_000);
  let fraction: number | null = Math.min(1, todayMinutes / DAILY_GOAL_MINUTES);
  // Idle shows a preview of the fully grown tree you are about to plant.
  let progress = 1;
  let mode: SceneMode = 'idle';
  if (active) {
    fraction = progressOf(active.startedAt, active.endAt, now);
    clock = formatClock(remainingMs(active.endAt, now));
    progress = isFocus ? fraction : 1;
    status = isFocus ? 'Growing…' : 'Take a break';
    mode = isFocus ? 'focus' : 'break';
  }

  const durationOptions: number[] = (PRESETS as readonly number[]).includes(settings.focusMinutes)
    ? [...PRESETS]
    : [...PRESETS, settings.focusMinutes].sort((a, b) => a - b);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.two, paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
      bounces={false}>
      <View style={styles.column}>
        {/* Header: level, streak, coins */}
        <View style={styles.header}>
          <View
            accessible
            accessibilityLabel={`Level ${level.level}, ${level.title}, ${Math.round(level.fraction * 100)} percent to the next level`}
            style={[styles.pill, styles.levelPill, { backgroundColor: headerPillBg, borderColor: theme.border, boxShadow: cardShadow(theme.shadow) }]}>
            <View style={[styles.levelBadge, { backgroundColor: theme.primary, borderColor: dark ? '#A9CCA2' : '#DCE7D2' }]}>
              <ThemedText style={styles.levelNumber}>{level.level}</ThemedText>
            </View>
            <View style={styles.levelText}>
              <ThemedText numberOfLines={1} style={styles.pillTitle}>
                {level.title}
              </ThemedText>
              <View style={[styles.xpTrack, { backgroundColor: theme.xpTrack }]}>
                <View style={[styles.xpFill, { width: `${Math.max(6, level.fraction * 100)}%`, backgroundColor: theme.xpFill }]} />
              </View>
            </View>
          </View>
          <View
            accessible
            accessibilityLabel={`${streak} day streak`}
            style={[styles.pill, { backgroundColor: headerPillBg, borderColor: theme.border, boxShadow: cardShadow(theme.shadow) }]}>
            <FlameIcon size={24} />
            <ThemedText style={styles.pillNumber}>{streak}</ThemedText>
          </View>
          <View
            accessible
            accessibilityLabel={`${coins} coins`}
            style={[styles.pill, { backgroundColor: headerPillBg, borderColor: theme.border, boxShadow: cardShadow(theme.shadow) }]}>
            <CoinIcon size={25} />
            <ThemedText style={styles.pillNumber}>{coins}</ThemedText>
          </View>
        </View>

        {/* Stage */}
        <GrowthStage
          style={{ flexGrow: 0, flexShrink: 0, height: isBreak ? Math.round(stageHeight * 1.2) : stageHeight }}
          speciesId={species.id}
          progress={progress}
          withered={false}
          mode={mode}
          status={status}
          clock={clock}
          fraction={fraction}
          sway
          treeKey={active ? active.startedAt : 'preview'}
          treeScale={isFocus ? 0.62 : 0.5}
          minSide={isFocus ? 112 : 168}
          overlay={
            isFocus ? (
              confirming ? (
                <View style={styles.overlayRow}>
                  <SceneButton label="Keep growing" onPress={() => setConfirmFor(null)} />
                  <SceneButton
                    label="Give up"
                    tone="danger"
                    onPress={() => {
                      setConfirmFor(null);
                      giveUp();
                    }}
                  />
                </View>
              ) : (
                <SceneButton label="Give up" onPress={() => setConfirmFor(active ? active.startedAt : null)} />
              )
            ) : isBreak ? (
              <SceneButton label="Skip break" onPress={endBreak} />
            ) : undefined
          }
        />

        {/* Controls (locked while a tree is growing; hidden during breaks) */}
        {!isBreak && (
          <View
            style={[styles.controls, isFocus && styles.locked]}
            pointerEvents={isFocus ? 'none' : 'auto'}
            accessibilityElementsHidden={isFocus}
            importantForAccessibility={isFocus ? 'no-hide-descendants' : 'auto'}>
            <View style={styles.row}>
              {TAGS.map((t) => (
                <IconTile
                  key={t.id}
                  label={t.label}
                  icon={TAG_ICONS[t.id]}
                  selected={selectedTag === t.id}
                  onPress={() => selectTag(t.id)}
                />
              ))}
            </View>
            <View style={styles.row}>
              {durationOptions.map((m) => (
                <Chip
                  key={m}
                  fill
                  label={`${m}m`}
                  accessibilityLabel={`${m} minutes`}
                  selected={settings.focusMinutes === m}
                  onPress={() => updateSettings({ focusMinutes: m })}
                />
              ))}
            </View>
            <View style={styles.speciesRow}>
              {SPECIES.map((s) => {
                const owned = unlocked.includes(s.id);
                return (
                  <View key={s.id} style={!owned && styles.lockedSeed}>
                    <SpeciesBadge
                      speciesId={s.id}
                      size={66}
                      selected={selectedSpecies === s.id}
                      accessibilityLabel={owned ? `Plant ${s.name}` : `${s.name}, locked. Opens the seed shop`}
                      onPress={() => (owned ? selectSpecies(s.id) : router.push('/seeds'))}
                    />
                  </View>
                );
              })}
            </View>
            <Button
              large
              label="Plant a tree"
              icon={<LeafIcon size={20} color={theme.primaryText} />}
              onPress={startFocus}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ResultScreen({
  session,
  upcomingBreak,
  onContinue,
  onBreak,
  bottomPad,
  topInset,
}: {
  session: Session;
  upcomingBreak: string;
  onContinue: () => void;
  onBreak: () => void;
  bottomPad: number;
  topInset: number;
}) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const withered = session.status === 'withered';
  const name = getSpecies(session.speciesId).name;
  const progress = withered ? session.actualSeconds / Math.max(1, session.plannedSeconds) : 1;
  const minutes = Math.max(1, Math.round(session.actualSeconds / 60));
  const cardBg = dark ? '#F3E6D3' : '#FFFBF5';

  return (
    <View style={[styles.flex, { backgroundColor: theme.background, paddingTop: topInset + Spacing.four, paddingBottom: bottomPad }]}>
      <View style={[styles.column, styles.resultColumn]}>
        <View style={[styles.resultCard, { backgroundColor: cardBg, boxShadow: cardShadow(theme.shadow, 'raised') }]}>
          <View style={[styles.resultBadge, { borderColor: cardBg }]}>
            {withered ? (
              <AlertCircleIcon size={44} color={theme.danger} />
            ) : (
              <CheckCircleIcon size={44} color="#6F956A" />
            )}
          </View>
          <ThemedText style={styles.resultTitle}>{withered ? `${name} withered` : `${name} fully grown!`}</ThemedText>
          {withered ? (
            <ThemedText style={styles.resultSub}>It lasted {minutes} min · no coins this time</ThemedText>
          ) : (
            <View style={styles.coinRow}>
              <CoinIcon size={24} />
              <ThemedText style={styles.resultCoins}>+{session.coinsEarned} coins</ThemedText>
            </View>
          )}
        </View>

        <GrowthStage
          bare
          speciesId={session.speciesId}
          progress={progress}
          withered={withered}
          mode={withered ? 'idle' : 'complete'}
          status={null}
          clock={null}
          treeScale={0.74}
          sway={!withered}
          celebrateKey={withered ? 0 : session.createdAt}
        />

        <View style={styles.resultActions}>
          <Button large label="Continue" onPress={onContinue} />
          {!withered && <Button label={upcomingBreak} variant="ghost" onPress={onBreak} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: Spacing.three },
  column: { flex: 1, width: '100%', maxWidth: 560, gap: 12 },
  header: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', height: HEADER_HEIGHT },
  pill: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  levelPill: { flex: 1, paddingLeft: 10 },
  levelBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: { fontFamily: AppFonts.bodyHeavy, fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  levelText: { flex: 1, gap: 5 },
  pillTitle: { fontFamily: AppFonts.bodyHeavy, fontSize: 16, lineHeight: 20 },
  pillNumber: { fontFamily: AppFonts.bodyHeavy, fontSize: 18, lineHeight: 22 },
  xpTrack: { height: 7, borderRadius: Radius.pill, overflow: 'hidden' },
  xpFill: { height: '100%', borderRadius: Radius.pill },
  controls: { gap: 12 },
  locked: { opacity: 0.55 },
  row: { flexDirection: 'row', gap: 10 },
  speciesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.two },
  lockedSeed: { opacity: 0.4 },
  overlayRow: { flexDirection: 'row', gap: Spacing.two },
  resultColumn: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  resultCard: {
    marginTop: 22,
    borderRadius: 18,
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: 4,
  },
  resultBadge: {
    position: 'absolute',
    top: -24,
    borderRadius: 26,
    borderWidth: 4,
  },
  resultTitle: { fontFamily: AppFonts.bodyHeavy, fontSize: 22, lineHeight: 28, color: '#26251F', textAlign: 'center' },
  resultSub: { fontFamily: AppFonts.bodyBold, fontSize: 16, lineHeight: 22, color: '#6E665A' },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  resultCoins: { fontFamily: AppFonts.bodyHeavy, fontSize: 20, lineHeight: 26, color: '#26251F' },
  resultActions: { gap: Spacing.one },
});

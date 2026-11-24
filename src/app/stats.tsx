import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { SessionDetail } from '@/components/session-detail';
import { ThemedText } from '@/components/themed-text';
import { TreeSvg } from '@/components/tree/tree-svg';
import { Card, Screen, SectionLabel } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import {
  dailyTotals,
  focusSecondsThisWeek,
  focusSecondsToday,
  formatDuration,
  formatMinutes,
  summarize,
  toMinutes,
} from '@/lib/stats';
import { getSpecies } from '@/lib/species';
import { TAGS, type Session } from '@/lib/types';
import { useAppStore } from '@/store/app-store';

const CHART_HEIGHT = 132;

export default function StatsScreen() {
  const theme = useTheme();
  const sessions = useAppStore((s) => s.sessions);
  const now = useNow(true, 30_000);
  const [selected, setSelected] = useState<Session | null>(null);
  const recent = useMemo(() => [...sessions].sort((a, b) => b.endedAt - a.endedAt).slice(0, 6), [sessions]);

  const week = useMemo(() => dailyTotals(sessions, 7, now), [sessions, now]);
  const today = focusSecondsToday(sessions, now);
  const weekTotal = focusSecondsThisWeek(sessions, now);
  const summary = useMemo(() => summarize(sessions), [sessions]);

  const maxSeconds = Math.max(60, ...week.map((d) => d.focusSeconds));
  const maxTag = Math.max(60, ...Object.values(summary.bySeconds));
  const finished = summary.completed + summary.withered;
  const successRate = finished === 0 ? null : Math.round((summary.completed / finished) * 100);

  return (
    <Screen title="Focus stats" subtitle="Time spent on trees that fully grew.">
      <View style={styles.row}>
        <Card style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            Today
          </ThemedText>
          <ThemedText type="subtitle">{formatMinutes(toMinutes(today))}</ThemedText>
        </Card>
        <Card style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            Last 7 days
          </ThemedText>
          <ThemedText type="subtitle">{formatMinutes(toMinutes(weekTotal))}</ThemedText>
        </Card>
      </View>

      <SectionLabel>Daily focus</SectionLabel>
      <Card>
        <View style={[styles.chart, { height: CHART_HEIGHT + 44 }]}>
          {week.map((d, i) => {
            const isToday = i === week.length - 1;
            const barHeight = d.focusSeconds === 0 ? 4 : Math.max(8, (d.focusSeconds / maxSeconds) * CHART_HEIGHT);
            return (
              <View
                key={d.key}
                accessible
                accessibilityLabel={`${d.label}: ${formatMinutes(toMinutes(d.focusSeconds))} focused, ${d.completed} trees`}
                style={styles.barColumn}>
                <ThemedText type="small" themeColor="textSecondary">
                  {d.focusSeconds > 0 ? formatMinutes(toMinutes(d.focusSeconds)) : ''}
                </ThemedText>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: d.focusSeconds === 0 ? theme.border : isToday ? theme.primaryStrong : theme.primary,
                      },
                    ]}
                  />
                </View>
                <ThemedText type="smallBold" themeColor={isToday ? 'text' : 'textSecondary'}>
                  {d.label}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </Card>

      <SectionLabel>All time</SectionLabel>
      <View style={styles.row}>
        <Card style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            Trees grown
          </ThemedText>
          <ThemedText type="subtitle">{summary.completed}</ThemedText>
        </Card>
        <Card style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            Withered
          </ThemedText>
          <ThemedText type="subtitle" style={{ color: theme.danger }}>
            {summary.withered}
          </ThemedText>
        </Card>
        <Card style={styles.flex}>
          <ThemedText type="small" themeColor="textSecondary">
            Success
          </ThemedText>
          <ThemedText type="subtitle">{successRate === null ? '–' : `${successRate}%`}</ThemedText>
        </Card>
      </View>

      <SectionLabel>Recent sessions</SectionLabel>
      {recent.length === 0 ? (
        <Card>
          <ThemedText themeColor="textSecondary">Your sessions will show up here. Tap one to see its details.</ThemedText>
        </Card>
      ) : (
        <Card style={styles.recentCard}>
          {recent.map((s, i) => (
            <RecentRow key={s.id} session={s} last={i === recent.length - 1} onPress={() => setSelected(s)} />
          ))}
        </Card>
      )}

      <SectionLabel>By tag</SectionLabel>
      <Card>
        {TAGS.map((t) => {
          const seconds = summary.bySeconds[t.id];
          return (
            <View key={t.id} style={styles.tagRow}>
              <ThemedText style={styles.tagLabel}>{t.label}</ThemedText>
              <View style={[styles.tagTrack, { backgroundColor: theme.backgroundElement }]}>
                <View
                  style={[
                    styles.tagFill,
                    { width: `${(seconds / maxTag) * 100}%`, backgroundColor: theme.accent },
                  ]}
                />
              </View>
              <ThemedText type="smallBold" style={styles.tagValue}>
                {formatMinutes(toMinutes(seconds))}
              </ThemedText>
            </View>
          );
        })}
      </Card>

      <SessionDetail session={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function RecentRow({ session, last, onPress }: { session: Session; last: boolean; onPress: () => void }) {
  const theme = useTheme();
  const withered = session.status === 'withered';
  const progress = withered ? session.actualSeconds / Math.max(1, session.plannedSeconds) : 1;
  const tag = TAGS.find((t) => t.id === session.tag)?.label ?? session.tag;
  const when = new Date(session.endedAt).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${getSpecies(session.speciesId).name}, ${tag}, ${withered ? 'withered' : 'grown'}, ${formatDuration(session.actualSeconds)}`}
      accessibilityHint="Opens the session details"
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentRow,
        !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
        pressed && styles.recentPressed,
      ]}>
      <View
        style={[
          styles.recentTree,
          { backgroundColor: withered ? theme.dangerSoft : theme.backgroundElement },
        ]}>
        <TreeSvg speciesId={session.speciesId} progress={progress} withered={withered} size={46} ground={false} fit minSide={150} />
      </View>
      <View style={styles.recentText}>
        <ThemedText type="smallBold">
          {tag} · {getSpecies(session.speciesId).name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {when}
        </ThemedText>
      </View>
      <View style={styles.recentEnd}>
        <ThemedText type="smallBold" style={{ color: withered ? theme.danger : theme.primaryStrong }}>
          {withered ? 'Withered' : 'Grown'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {formatDuration(session.actualSeconds)}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.chevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: Spacing.two },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.one },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: Spacing.one },
  barTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end', width: '70%' },
  bar: { width: '100%', borderRadius: Radius.small },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  tagLabel: { width: 76 },
  tagTrack: { flex: 1, height: 12, borderRadius: Radius.pill, overflow: 'hidden' },
  tagFill: { height: '100%', borderRadius: Radius.pill },
  tagValue: { width: 64, textAlign: 'right' },
  recentCard: { gap: 0, paddingVertical: Spacing.one },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two + 2 },
  recentPressed: { opacity: 0.7 },
  recentTree: { width: 52, height: 52, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  recentText: { flex: 1 },
  recentEnd: { alignItems: 'flex-end' },
  chevron: { fontSize: 22, lineHeight: 26 },
});

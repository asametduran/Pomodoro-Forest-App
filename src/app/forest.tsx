import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AlertCircleIcon, BareTreeIcon, CheckCircleIcon, ClockIcon, SproutIcon, TreeIcon } from '@/components/icons';
import { SessionDetail } from '@/components/session-detail';
import { ThemedText } from '@/components/themed-text';
import { TreeSvg } from '@/components/tree/tree-svg';
import { Card, Chip, Screen } from '@/components/ui';
import { AppFonts, cardShadow, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { getSpecies } from '@/lib/species';
import { dailyTotals, formatMinutes, summarize, toMinutes } from '@/lib/stats';
import { TAGS, type Session, type TagId } from '@/lib/types';
import { useAppStore } from '@/store/app-store';

const GAP = 10;
const BAR_AREA = 96;

export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ForestScreen() {
  const theme = useTheme();
  const sessions = useAppStore((s) => s.sessions);
  const [filter, setFilter] = useState<TagId | 'all'>('all');
  const [selected, setSelected] = useState<Session | null>(null);

  const visible = useMemo(
    () => sessions.filter((s) => filter === 'all' || s.tag === filter).sort((a, b) => b.endedAt - a.endedAt),
    [sessions, filter],
  );
  const summary = useMemo(() => summarize(visible), [visible]);

  // Size cells from the grid's own measured width (window width includes scrollbars on web).
  const [gridWidth, setGridWidth] = useState(0);
  const columns = gridWidth >= 480 ? 4 : 3;
  const cell = Math.floor((gridWidth - GAP * (columns - 1)) / columns);

  return (
    <Screen
      title="My Forest"
      subtitle="Grow your focus, one tree at a time"
      titleAccessory={<SproutIcon size={16} color={theme.primary} />}>
      <View style={styles.chips}>
        <Chip compact label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
        {TAGS.map((t) => (
          <Chip key={t.id} compact label={t.label} selected={filter === t.id} onPress={() => setFilter(t.id)} />
        ))}
      </View>

      <View style={styles.statsRow}>
        <StatCard icon={<TreeIcon size={22} color={theme.primary} />} value={String(summary.completed)} label="Trees grown" />
        <StatCard icon={<BareTreeIcon size={22} color="#9B7556" />} value={String(summary.withered)} label="Withered" />
        <StatCard
          icon={<ClockIcon size={20} color={theme.primary} accent={theme.card} />}
          value={formatMinutes(toMinutes(summary.totalFocusSeconds))}
          label="Focused"
        />
      </View>

      {visible.length === 0 ? (
        <Card style={styles.empty}>
          <TreeSvg speciesId="oak" progress={0.05} size={120} fit />
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {sessions.length === 0
              ? 'Your forest is empty. Finish a focus session to plant your first tree.'
              : 'No trees with this tag yet.'}
          </ThemedText>
        </Card>
      ) : (
        <View style={[styles.grid, { gap: GAP }]} onLayout={(e) => setGridWidth(Math.floor(e.nativeEvent.layout.width))}>
          {gridWidth > 0 &&
            visible.map((s) => <ForestCell key={s.id} session={s} size={cell} onPress={() => setSelected(s)} />)}
        </View>
      )}

      {sessions.length > 0 && <TreesChart sessions={visible} />}

      <SessionDetail session={selected} onClose={() => setSelected(null)} />
    </Screen>
  );
}

function StatCard({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border, boxShadow: cardShadow(theme.shadow) }]}>
      {icon}
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}

function ForestCell({ session, size, onPress }: { session: Session; size: number; onPress: () => void }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const withered = session.status === 'withered';
  const progress = withered ? session.actualSeconds / Math.max(1, session.plannedSeconds) : 1;
  const tag = TAGS.find((t) => t.id === session.tag)?.label ?? session.tag;
  const doneMin = Math.round(session.actualSeconds / 60);
  const planMin = Math.round(session.plannedSeconds / 60);

  const badge = withered
    ? { bg: dark ? '#5A3A30' : '#FBD8C3', fg: dark ? '#F4A988' : '#C8552E' }
    : { bg: dark ? '#3B4B37' : '#E3E9D2', fg: dark ? '#BEDBB2' : '#3F6B3A' };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${getSpecies(session.speciesId).name}, ${tag}, ${withered ? `withered after ${doneMin} of ${planMin} minutes` : 'fully grown'}, ${shortDate(session.endedAt)}`}
      accessibilityHint="Opens the session details"
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          width: size,
          backgroundColor: withered ? theme.witheredCard : theme.grownCard,
          borderColor: withered ? (dark ? '#6B4334' : '#F4C3A6') : theme.border,
          boxShadow: cardShadow(theme.shadow),
        },
        pressed && styles.pressed,
      ]}>
      <TreeSvg speciesId={session.speciesId} progress={progress} withered={withered} size={size * 0.74} fit minSide={132} />
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        {withered ? (
          <AlertCircleIcon size={15} color={badge.fg} />
        ) : (
          <CheckCircleIcon size={15} color={badge.fg} accent={badge.bg} />
        )}
        <ThemedText style={[styles.badgeText, { color: badge.fg }]}>{withered ? 'Withered' : 'Grown'}</ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" numberOfLines={1} style={styles.cellDate}>
        {withered ? `${doneMin} of ${planMin} min` : shortDate(session.endedAt)}
      </ThemedText>
    </Pressable>
  );
}

/** Stacked bars: how many trees grew (green) and withered (orange) on each of the last 14 days. */
function TreesChart({ sessions }: { sessions: Session[] }) {
  const theme = useTheme();
  const dark = useColorScheme() === 'dark';
  const now = useNow(true, 60_000);
  const days = useMemo(() => dailyTotals(sessions, 14, now), [sessions, now]);
  const max = Math.max(1, ...days.map((d) => d.completed + d.withered));
  const grownColor = dark ? '#7FA673' : '#8CB07C';
  const witheredColor = '#E98A5D';

  return (
    <View style={styles.chartBlock}>
      <ThemedText themeColor="textSecondary" style={styles.chartTitle}>
        Trees per day, last 14 days
      </ThemedText>
      <View style={[styles.chartFrame, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <View style={styles.chart}>
          {days.map((d, i) => {
            const isToday = i === days.length - 1;
            const grownH = (d.completed / max) * BAR_AREA;
            const witheredH = (d.withered / max) * BAR_AREA;
            return (
              <View
                key={d.key}
                accessible
                accessibilityLabel={`${d.label} ${Number(d.key.slice(8))}: ${d.completed} grown, ${d.withered} withered`}
                style={[styles.barColumn, i > 0 && { borderLeftColor: theme.border, borderLeftWidth: StyleSheet.hairlineWidth }]}>
                <View style={styles.barArea}>
                  {d.withered > 0 && (
                    <View style={[styles.bar, styles.barTop, { height: witheredH, backgroundColor: witheredColor }]} />
                  )}
                  {d.completed > 0 && (
                    <View
                      style={[styles.bar, d.withered === 0 && styles.barTop, { height: grownH, backgroundColor: grownColor }]}
                    />
                  )}
                </View>
                <ThemedText
                  style={[styles.dayLabel, { color: isToday ? theme.primaryStrong : theme.textSecondary }]}>
                  {Number(d.key.slice(8))}
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
      <View style={styles.legend}>
        <LegendDot color={grownColor} label="Grown" />
        <LegendDot color={witheredColor} label="Withered" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText themeColor="textSecondary" style={styles.legendText}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  statsRow: { flexDirection: 'row', gap: GAP },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    gap: 1,
  },
  statValue: { fontFamily: AppFonts.bodyHeavy, fontSize: 20, lineHeight: 25 },
  statLabel: { fontFamily: AppFonts.bodyBold, fontSize: 13, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -14,
    paddingLeft: 4,
    paddingRight: 9,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontFamily: AppFonts.bodyHeavy, fontSize: 14, lineHeight: 19 },
  cellDate: { fontFamily: AppFonts.bodyBold, fontSize: 13, lineHeight: 18, marginTop: 3 },
  empty: { alignItems: 'center' },
  center: { textAlign: 'center' },
  chartBlock: { gap: Spacing.two, marginTop: Spacing.one },
  chartTitle: { fontFamily: AppFonts.bodyBold, fontSize: 15, lineHeight: 20 },
  chartFrame: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two, overflow: 'hidden' },
  chart: { flexDirection: 'row', alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', gap: 4, paddingBottom: 4 },
  barArea: { height: BAR_AREA, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '78%' },
  barTop: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  dayLabel: { fontFamily: AppFonts.bodyBold, fontSize: 12, lineHeight: 15 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.four },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: AppFonts.bodyBold, fontSize: 14, lineHeight: 19 },
});

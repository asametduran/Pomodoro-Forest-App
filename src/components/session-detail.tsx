import { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { GrowthStage } from '@/components/growth-stage';
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  FlagIcon,
  SeedIcon,
  ShareIcon,
  TagIcon,
  TimerIcon,
  TrophyIcon,
} from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { AppFonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getSpecies } from '@/lib/species';
import { formatDuration } from '@/lib/stats';
import { TAGS, type Session } from '@/lib/types';

/** "Nov 23, 2025 · 14:30" */
export function formatWhen(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${date} · ${time}`;
}

function Row({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color?: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.rowIcon}>{icon}</View>
      <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.rowValue, { color: color ?? theme.text }]}>{value}</ThemedText>
    </View>
  );
}

/** Bottom sheet with everything about one session. Pass `session={null}` to hide it. */
export function SessionDetail({ session, onClose }: { session: Session | null; onClose: () => void }) {
  const theme = useTheme();
  if (!session) return null;

  const species = getSpecies(session.speciesId);
  const withered = session.status === 'withered';
  const grown = Math.min(1, session.actualSeconds / Math.max(1, session.plannedSeconds));
  const tag = TAGS.find((t) => t.id === session.tag)?.label ?? session.tag;
  const seedName = species.name.split(' ').slice(-1)[0];

  const share = () => {
    const message = withered
      ? `My ${species.name} withered after ${formatDuration(session.actualSeconds)} of focus. Next one will grow! 🌱`
      : `I grew a ${species.name} with ${formatDuration(session.actualSeconds)} of focus in Forest Pomodoro 🌳`;
    Share.share({ message }).catch(() => undefined);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close session details" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: theme.sheet, borderColor: theme.border }]}>
          <View style={[styles.handle, { backgroundColor: theme.textMuted }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View>
              <GrowthStage
                style={styles.stage}
                speciesId={session.speciesId}
                progress={withered ? grown : 1}
                withered={withered}
                mode="idle"
                status={null}
                clock={null}
                treeScale={0.8}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.close}>
                <CloseIcon size={18} color="#3A3A32" />
              </Pressable>
            </View>

            <View style={styles.titleRow}>
              <ThemedText style={styles.title}>{species.name}</ThemedText>
              <View style={[styles.statusPill, { backgroundColor: withered ? theme.danger : theme.primaryStrong }]}>
                <CheckIcon size={14} color="#FFFFFF" />
                <ThemedText style={styles.statusText}>{withered ? 'Withered' : 'Grown'}</ThemedText>
              </View>
            </View>

            <View>
              <Row
                icon={<TrophyIcon size={22} />}
                label="Result"
                value={
                  withered
                    ? session.reason === 'left_app'
                      ? 'Withered · left the app'
                      : 'Withered · gave up'
                    : `+${session.coinsEarned} coins`
                }
                color={withered ? theme.danger : theme.gold}
              />
              <Row icon={<TagIcon size={22} />} label="Tag" value={tag} />
              <Row icon={<SeedIcon size={22} />} label="Seed" value={seedName} />
              <Row icon={<CalendarIcon size={22} />} label="Started" value={formatWhen(session.startedAt)} />
              <Row icon={<FlagIcon size={22} />} label="Ended" value={formatWhen(session.endedAt)} />
              <Row icon={<TimerIcon size={22} />} label="Planned" value={formatDuration(session.plannedSeconds)} />
              <Row
                icon={<CheckIcon size={22} color={withered ? theme.danger : '#7DAA6E'} />}
                label="Focused"
                value={withered ? `${formatDuration(session.actualSeconds)} (${Math.round(grown * 100)}%)` : formatDuration(session.actualSeconds)}
              />
            </View>

            <Button label="Share" large icon={<ShareIcon size={20} color={theme.primaryText} />} onPress={share} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '94%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, opacity: 0.6 },
  content: { padding: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },
  stage: { flexGrow: 0, flexShrink: 0, height: 210 },
  close: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,250,243,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { fontFamily: AppFonts.bodyHeavy, fontSize: 24, lineHeight: 30 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: { fontFamily: AppFonts.bodyHeavy, fontSize: 14, lineHeight: 19, color: '#FFFFFF' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 26, alignItems: 'center' },
  rowLabel: { width: '30%', fontFamily: AppFonts.bodyBold, fontSize: 16, lineHeight: 22 },
  rowValue: { flex: 1, fontFamily: AppFonts.bodyBold, fontSize: 16, lineHeight: 22 },
});

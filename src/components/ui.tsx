import { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppFonts, cardShadow, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tap } from '@/lib/alerts';
import { useAppStore } from '@/store/app-store';

/** Space reserved under scrolling content for the floating web tab bar. */
export const TAB_BAR_SPACE = Platform.OS === 'web' ? 104 : Spacing.four;

export function Screen({
  children,
  title,
  subtitle,
  titleAccessory,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  /** Small element shown after the subtitle (e.g. a sprout icon). */
  titleAccessory?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.screenContent,
          { paddingTop: insets.top + Spacing.three, paddingBottom: TAB_BAR_SPACE + Spacing.three },
        ]}>
        <View style={styles.column}>
          {title && (
            <View style={styles.header}>
              <ThemedText type="subtitle">{title}</ThemedText>
              {subtitle && (
                <View style={styles.subtitleRow}>
                  <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                    {subtitle}
                  </ThemedText>
                  {titleAccessory}
                </View>
              )}
            </View>
          )}
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, boxShadow: cardShadow(theme.shadow) },
        style,
      ]}>
      {children}
    </View>
  );
}

export type ButtonVariant = 'primary' | 'soft' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
  large,
  icon,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Taller primary action (e.g. "Plant a tree"). */
  large?: boolean;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
}) {
  const theme = useTheme();
  const haptics = useAppStore((s) => s.settings.hapticsEnabled);
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.primaryButton, fg: theme.primaryText, border: theme.primaryButton },
    soft: { bg: theme.card, fg: theme.text, border: theme.border },
    danger: { bg: theme.dangerSoft, fg: theme.danger, border: theme.danger },
    ghost: { bg: 'transparent', fg: theme.textSecondary, border: 'transparent' },
  };
  const c = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tap(haptics, variant === 'primary' ? 'medium' : 'light');
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        large && styles.buttonLarge,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          boxShadow: variant === 'primary' || variant === 'soft' ? cardShadow(theme.shadow) : undefined,
        },
        pressed && styles.buttonPressed,
        disabled && styles.disabled,
        style,
      ]}>
      {icon}
      <ThemedText style={[styles.buttonText, { color: c.fg, fontSize: large ? 19 : 16 }]}>{label}</ThemedText>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  disabled,
  fill,
  compact,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  /** Stretch to share a row equally with sibling chips. */
  fill?: boolean;
  /** Shorter chip (filters). */
  compact?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const haptics = useAppStore((s) => s.settings.hapticsEnabled);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={() => {
        tap(haptics);
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        compact && styles.chipCompact,
        fill && styles.chipFill,
        {
          backgroundColor: selected ? theme.primaryStrong : theme.card,
          borderColor: selected ? theme.primaryStrong : theme.border,
          boxShadow: cardShadow(theme.shadow),
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        numberOfLines={1}
        style={[styles.chipText, compact && styles.chipTextCompact, { color: selected ? theme.primaryText : theme.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Square-ish tile with an icon above a label (tag picker). */
export function IconTile({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: (color: string) => ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const haptics = useAppStore((s) => s.settings.hapticsEnabled);
  const fg = selected ? theme.primaryText : theme.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => {
        tap(haptics);
        onPress();
      }}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: selected ? theme.primaryStrong : theme.card,
          borderColor: selected ? theme.primaryStrong : theme.border,
          boxShadow: cardShadow(theme.shadow),
        },
        pressed && styles.pressed,
      ]}>
      {icon(fg)}
      <ThemedText numberOfLines={1} style={[styles.tileText, { color: fg }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Stepper({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  const theme = useTheme();
  const bump = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));
  return (
    <View style={styles.row}>
      <ThemedText style={[styles.flex, styles.rowLabel]}>{label}</ThemedText>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          onPress={() => bump(-step)}
          disabled={value <= min}
          style={[styles.stepBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, value <= min && styles.disabled]}>
          <ThemedText style={styles.stepGlyph}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.stepValue}>
          {value}
          {unit ? ` ${unit}` : ''}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          onPress={() => bump(step)}
          disabled={value >= max}
          style={[styles.stepBtn, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, value >= max && styles.disabled]}>
          <ThemedText style={styles.stepGlyph}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <ThemedText style={styles.rowLabel}>{label}</ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary">
            {hint}
          </ThemedText>
        )}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.primary, false: theme.backgroundSelected }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.sectionLabel}>
      {children.toUpperCase()}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContent: { paddingHorizontal: Spacing.three, alignItems: 'center' },
  column: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  header: { gap: 2, marginBottom: Spacing.one },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  subtitle: { fontSize: 15, lineHeight: 21 },
  card: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  button: {
    minHeight: 50,
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLarge: { minHeight: 56 },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  buttonText: { fontFamily: AppFonts.bodyHeavy, lineHeight: 24 },
  chip: {
    minHeight: 42,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCompact: { minHeight: 34, paddingHorizontal: 12 },
  chipFill: { flex: 1, paddingHorizontal: Spacing.one },
  chipText: { fontFamily: AppFonts.bodyHeavy, fontSize: 16, lineHeight: 22 },
  chipTextCompact: { fontSize: 14, lineHeight: 19 },
  tile: {
    flex: 1,
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: Spacing.two,
  },
  tileText: { fontFamily: AppFonts.bodyBold, fontSize: 14, lineHeight: 18 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  rowLabel: { fontFamily: AppFonts.bodyBold },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepGlyph: { fontFamily: AppFonts.bodyHeavy, fontSize: 18, lineHeight: 22 },
  stepValue: { minWidth: 72, textAlign: 'center', fontFamily: AppFonts.bodyHeavy },
  sectionLabel: { fontFamily: AppFonts.bodyHeavy, fontSize: 13, letterSpacing: 1.1, marginTop: Spacing.two },
});

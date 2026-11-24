import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AccountSheet } from '@/components/account-sheet';
import { GrowthLab } from '@/components/growth-lab';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip, Screen, SectionLabel, Stepper, ToggleRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { SETTING_LIMITS } from '@/lib/engine';
import { alertTimerEnd } from '@/lib/alerts';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

const FOCUS_PRESETS = [15, 25, 45, 60] as const; // matches the Focus screen chips

export default function SettingsScreen() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const resetAll = useAppStore((s) => s.resetAll);
  const [confirmReset, setConfirmReset] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const authStatus = useAuthStore((s) => s.status);
  const userEmail = useAuthStore((s) => s.user?.email);
  const syncing = useAuthStore((s) => s.syncing);

  return (
    <Screen title="Settings" subtitle="Tune your timer to the way you work.">
      <SectionLabel>Account</SectionLabel>
      <Card>
        <ThemedText themeColor="textSecondary">
          {authStatus === 'signedIn'
            ? `Signed in as ${userEmail ?? 'you'}${syncing ? ' · syncing…' : ' · forest backed up'}`
            : authStatus === 'disabled'
              ? 'Your forest is saved on this device.'
              : 'Guest mode: your forest is saved on this device only. Sign in to back it up and sync across devices.'}
        </ThemedText>
        {authStatus !== 'disabled' && (
          <Button
            label={authStatus === 'signedIn' ? 'Manage account' : 'Sign in or create account'}
            variant={authStatus === 'signedIn' ? 'soft' : 'primary'}
            onPress={() => setAccountOpen(true)}
          />
        )}
      </Card>
      <AccountSheet visible={accountOpen} onClose={() => setAccountOpen(false)} />

      <SectionLabel>Timer</SectionLabel>
      <Card>
        <View style={styles.presets}>
          {FOCUS_PRESETS.map((m) => (
            <Chip
              fill
              key={m}
              label={`${m} min`}
              selected={settings.focusMinutes === m}
              onPress={() => update({ focusMinutes: m })}
            />
          ))}
        </View>
        <Stepper
          label="Focus"
          unit="min"
          value={settings.focusMinutes}
          {...SETTING_LIMITS.focusMinutes}
          onChange={(v) => update({ focusMinutes: v })}
        />
        <Stepper
          label="Short break"
          unit="min"
          value={settings.shortBreakMinutes}
          {...SETTING_LIMITS.shortBreakMinutes}
          onChange={(v) => update({ shortBreakMinutes: v })}
        />
        <Stepper
          label="Long break"
          unit="min"
          value={settings.longBreakMinutes}
          {...SETTING_LIMITS.longBreakMinutes}
          onChange={(v) => update({ longBreakMinutes: v })}
        />
        <Stepper
          label="Long break every"
          unit="sessions"
          value={settings.longBreakEvery}
          {...SETTING_LIMITS.longBreakEvery}
          onChange={(v) => update({ longBreakEvery: v })}
        />
      </Card>

      <SectionLabel>Alerts</SectionLabel>
      <Card>
        <ToggleRow
          label="Sound"
          hint="Play a soft chime when a timer ends."
          value={settings.soundEnabled}
          onChange={(v) => update({ soundEnabled: v })}
        />
        <ToggleRow
          label="Haptics"
          hint="Vibrate on phones. Not available on web."
          value={settings.hapticsEnabled}
          onChange={(v) => update({ hapticsEnabled: v })}
        />
        <Button
          label="Test alert"
          variant="soft"
          onPress={() => alertTimerEnd(settings, { kind: 'focus' })}
        />
      </Card>

      <SectionLabel>Focus rules</SectionLabel>
      <Card>
        <ToggleRow
          label="Wither when I leave"
          hint="Switching apps or browser tabs kills the tree after the grace period."
          value={settings.strictMode}
          onChange={(v) => update({ strictMode: v })}
        />
        {settings.strictMode && (
          <Stepper
            label="Grace period"
            unit="sec"
            step={5}
            value={settings.graceSeconds}
            {...SETTING_LIMITS.graceSeconds}
            onChange={(v) => update({ graceSeconds: v })}
          />
        )}
      </Card>

      <SectionLabel>Preview</SectionLabel>
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Watch a tree grow from seed to full tree, wither, or celebrate finishing, without waiting on a timer. Nothing
          here changes your forest or coins.
        </ThemedText>
        <Button label="Open growth lab" variant="soft" onPress={() => setLabOpen(true)} />
      </Card>
      <GrowthLab visible={labOpen} onClose={() => setLabOpen(false)} />

      <SectionLabel>Data</SectionLabel>
      <Card>
        <ThemedText type="small" themeColor="textSecondary">
          Everything is stored on this device. Resetting deletes your forest, coins and unlocked species.
        </ThemedText>
        {confirmReset ? (
          <View style={styles.presets}>
            <Button
              label="Yes, delete everything"
              variant="danger"
              onPress={() => {
                resetAll();
                setConfirmReset(false);
              }}
            />
            <Button label="Cancel" variant="ghost" onPress={() => setConfirmReset(false)} />
          </View>
        ) : (
          <Button label="Reset all data" variant="danger" onPress={() => setConfirmReset(true)} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});

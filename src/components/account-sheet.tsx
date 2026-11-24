import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CloseIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Chip } from '@/components/ui';
import { AppFonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

type Mode = 'signIn' | 'signUp' | 'reset';

function Field({
  label,
  value,
  onChangeText,
  secure,
  email,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  email?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={email ? 'email-address' : 'default'}
        autoComplete={email ? 'email' : secure ? 'password' : 'off'}
        textContentType={email ? 'emailAddress' : secure ? 'password' : 'none'}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
      />
    </View>
  );
}

/** Sign-in / sign-up / password reset forms, or the signed-in account summary. */
function AccountContent({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { status, user, syncing, syncError, recovering, signIn, signUp, signOut, sendPasswordReset, updatePassword, syncNow } =
    useAuthStore();
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (fn: () => Promise<{ ok: boolean; message: string }>) => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await fn();
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) setPassword('');
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (status === 'disabled') {
    body = (
      <ThemedText themeColor="textSecondary">
        Cloud sync is not configured for this build. Your forest is saved on this device.
      </ThemedText>
    );
  } else if (recovering) {
    body = (
      <>
        <ThemedText style={styles.heading}>Choose a new password</ThemedText>
        <Field label="New password" value={password} onChangeText={setPassword} secure />
        <Button large label="Update password" disabled={busy} onPress={() => run(() => updatePassword(password))} />
      </>
    );
  } else if (status === 'signedIn' && user) {
    body = (
      <>
        <ThemedText style={styles.heading}>Signed in</ThemedText>
        <ThemedText themeColor="textSecondary">{user.email}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.small}>
          {syncing
            ? 'Syncing…'
            : lastSyncAt
              ? `Last synced ${new Date(lastSyncAt).toLocaleString()}`
              : 'Not synced yet'}
        </ThemedText>
        {syncError && <ThemedText style={[styles.small, { color: theme.danger }]}>{syncError}</ThemedText>}
        <Button label="Sync now" variant="soft" disabled={syncing} onPress={() => syncNow()} />
        <Button
          label="Sign out"
          variant="danger"
          disabled={busy}
          onPress={async () => {
            setBusy(true);
            await signOut();
            setBusy(false);
          }}
        />
        <ThemedText themeColor="textSecondary" style={styles.small}>
          Signing out removes this device&apos;s copy. Your forest stays safe in the cloud.
        </ThemedText>
      </>
    );
  } else {
    body = (
      <>
        <View style={styles.modes}>
          <Chip compact fill label="Sign in" selected={mode === 'signIn'} onPress={() => setMode('signIn')} />
          <Chip compact fill label="Create account" selected={mode === 'signUp'} onPress={() => setMode('signUp')} />
        </View>
        <ThemedText themeColor="textSecondary">
          {mode === 'reset'
            ? 'We will email you a link to choose a new password.'
            : 'Back up your forest and keep it in sync across devices. Trees you grew as a guest are kept.'}
        </ThemedText>
        <Field label="Email" value={email} onChangeText={setEmail} email />
        {mode !== 'reset' && <Field label="Password" value={password} onChangeText={setPassword} secure />}
        {mode === 'signIn' && (
          <Button large label="Sign in" disabled={busy} onPress={() => run(() => signIn(email, password))} />
        )}
        {mode === 'signUp' && (
          <Button large label="Create account" disabled={busy} onPress={() => run(() => signUp(email, password))} />
        )}
        {mode === 'reset' && (
          <Button large label="Send reset link" disabled={busy} onPress={() => run(() => sendPasswordReset(email))} />
        )}
        <Button
          variant="ghost"
          label={mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}
          onPress={() => {
            setMessage(null);
            setMode(mode === 'reset' ? 'signIn' : 'reset');
          }}
        />
      </>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.flex}>
          Account
        </ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.close, { backgroundColor: theme.card }]}>
          <CloseIcon size={18} color={theme.text} />
        </Pressable>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          {body}
          {message && (
            <ThemedText accessibilityLiveRegion="polite" style={[styles.small, { color: message.ok ? theme.primaryStrong : theme.danger }]}>
              {message.text}
            </ThemedText>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

export function AccountSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <AccountContent onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

/** Opens the account sheet automatically when a password-reset link is opened. */
export function PasswordRecoveryPrompt() {
  const recovering = useAuthStore((s) => s.recovering);
  return <AccountSheet visible={recovering} onClose={() => useAuthStore.setState({ recovering: false })} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingBottom: Spacing.two },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scroll: { alignItems: 'center', padding: Spacing.three },
  card: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  heading: { fontFamily: AppFonts.bodyHeavy, fontSize: 18, lineHeight: 24 },
  modes: { flexDirection: 'row', gap: Spacing.two },
  field: { gap: 6 },
  fieldLabel: { fontFamily: AppFonts.bodyBold, fontSize: 14, lineHeight: 18 },
  input: {
    minHeight: 48,
    borderRadius: Radius.small + 4,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontFamily: AppFonts.bodyBold,
    fontSize: 16,
  },
  small: { fontSize: 14, lineHeight: 20 },
});

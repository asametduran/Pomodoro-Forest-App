import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import type { Settings, TimerKind } from './types';

let player: AudioPlayer | null = null;

function playChime() {
  try {
    player ??= createAudioPlayer(require('@/assets/sounds/chime.wav'));
    player.seekTo(0);
    player.play();
  } catch {
    // Sound is a nice-to-have; never let it break the timer.
  }
}

function buzz(type: Haptics.NotificationFeedbackType) {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(type).catch(() => undefined);
}

/** Light tap feedback for buttons. No-op on web or when haptics are off. */
export function tap(enabled: boolean, strength: 'light' | 'medium' = 'light') {
  if (!enabled || Platform.OS === 'web') return;
  const style =
    strength === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
  Haptics.impactAsync(style).catch(() => undefined);
}

/** Alert the user that a timer ended (success) or a tree withered (warning). */
export function alertTimerEnd(
  settings: Pick<Settings, 'soundEnabled' | 'hapticsEnabled'>,
  outcome: { kind: TimerKind; withered?: boolean },
) {
  if (settings.soundEnabled) playChime();
  if (settings.hapticsEnabled) {
    buzz(
      outcome.withered
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success,
    );
  }
}

import { Fraunces_400Regular, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Nunito_500Medium, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';

import { PasswordRecoveryPrompt } from '@/components/account-sheet';
import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { useHydrated } from '@/hooks/use-hydrated';
import { useTimerRuntime } from '@/hooks/use-timer-runtime';
import { useAuthBootstrap } from '@/store/auth-store';

function Runtime() {
  useTimerRuntime();
  useAuthBootstrap();
  return null;
}

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const hydrated = useHydrated();
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  // If a font fails to load we still show the app (with system fonts) rather than a blank screen.
  const ready = hydrated && (fontsLoaded || !!fontError);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primaryStrong,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {ready ? (
        <>
          <Runtime />
          <AppTabs />
          <PasswordRecoveryPrompt />
        </>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      )}
    </ThemeProvider>
  );
}

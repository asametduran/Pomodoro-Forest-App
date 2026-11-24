import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpeciesBadge } from '@/components/tree/species-badge';
import { Button, Card, Screen } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SPECIES } from '@/lib/species';
import { useAppStore } from '@/store/app-store';

/** Seed shop: spend coins earned from focus sessions on new species. */
export default function SeedsScreen() {
  const theme = useTheme();
  const coins = useAppStore((s) => s.coins);
  const unlocked = useAppStore((s) => s.unlockedSpecies);
  const selected = useAppStore((s) => s.selectedSpecies);
  const hasActive = useAppStore((s) => s.active?.kind === 'focus');
  const unlock = useAppStore((s) => s.unlockSpecies);
  const select = useAppStore((s) => s.selectSpecies);

  return (
    <Screen title="Seed shop" subtitle="Earn 1 coin per focused minute. Spend them on new species.">
      <Card style={styles.balance}>
        <ThemedText type="small" themeColor="textSecondary">
          Your coins
        </ThemedText>
        <ThemedText type="subtitle" style={{ color: theme.accent }}>
          {coins}
        </ThemedText>
      </Card>

      {SPECIES.map((species) => {
        const isUnlocked = unlocked.includes(species.id);
        const isSelected = selected === species.id;
        const affordable = coins >= species.cost;
        return (
          <Card key={species.id} style={styles.speciesCard}>
            <View style={[styles.preview, !isUnlocked && styles.lockedPreview]}>
              <SpeciesBadge speciesId={species.id} size={96} selected={isSelected} />
            </View>
            <View style={styles.info}>
              <ThemedText type="smallBold" style={styles.name}>
                {species.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {species.description}
              </ThemedText>
              {isUnlocked ? (
                <Button
                  label={isSelected ? 'Selected' : 'Plant this'}
                  variant={isSelected ? 'soft' : 'primary'}
                  disabled={isSelected || hasActive}
                  onPress={() => select(species.id)}
                />
              ) : (
                <Button
                  label={`Unlock · ${species.cost} coins`}
                  variant={affordable ? 'primary' : 'soft'}
                  disabled={!affordable}
                  onPress={() => unlock(species.id)}
                />
              )}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  balance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  speciesCard: { flexDirection: 'row', alignItems: 'center' },
  preview: { borderRadius: Radius.pill },
  lockedPreview: { opacity: 0.6 },
  info: { flex: 1, gap: Spacing.two },
  name: { fontSize: 17, lineHeight: 22 },
});

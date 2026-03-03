import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Avatar, BackHeader, Button, Card, StarIcon } from '../../components';
import { useAuth } from '../../contexts/AuthContext';
import type { ProProfileStackParamList } from '../../navigation/ProMainTabs';
import { useProProfile } from '../../services/queries/proProfile';
import { useMe } from '../../services/queries/user';
import { colors, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<ProProfileStackParamList, 'ProProfile'>;

function getInitials(fullName?: string | null) {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ProProfileScreen() {
  const nav = useNavigation<Nav>();
  const { signOut } = useAuth();
  const { data: profile } = useProProfile();
  const { data: user } = useMe();

  const fullName = user?.fullName ?? 'Professionnel';
  const initials = getInitials(fullName);
  const rating = (profile?.rating ?? 0).toFixed(1);
  const totalSessions = profile?.totalSessions ?? 0;
  const reliability = Math.round(profile?.reliability ?? 0);

  return (
    <View style={styles.container}>
      <BackHeader
        title="Profil"
        onBack={() => {
          if (nav.canGoBack()) {
            nav.goBack();
            return;
          }
          nav.getParent()?.navigate('ProHomeTab' as never);
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <Avatar initials={initials} size="xl" variant="user" />
          <Text style={styles.name}>{fullName}</Text>
          <View style={styles.ratingRow}>
            <StarIcon size={16} color={colors.navy} />
            <Text style={styles.ratingText}>{rating}</Text>
            <Text style={styles.sessionsText}>• {totalSessions} sessions</Text>
          </View>
        </Card>

        <Button
          variant="outline"
          label="Modifier le profil"
          onPress={() => nav.navigate('ProfileEdit')}
        />

        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatCol label="Rating" value={rating} />
            <StatCol label="Sessions" value={String(totalSessions)} />
            <StatCol label="Fiabilité" value={`${reliability}%`} />
          </View>
        </Card>

        <Button
          variant="outline"
          label="Contacter le support"
          onPress={() => Alert.alert('Support', 'Contactez-nous: support@babloo.app')}
        />

        <Button
          variant="clay"
          label="Se déconnecter"
          onPress={() => {
            signOut();
          }}
        />
      </ScrollView>
    </View>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCol}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  headerCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...textStyles.h2,
    color: colors.navy,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  sessionsText: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  statsCard: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 10,
    marginTop: 2,
  },
});

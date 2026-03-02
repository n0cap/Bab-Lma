import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Avatar, BackHeader, Card, Chip } from '../../components';
import { CheckIcon, ChevronRightIcon, SearchIcon, StarIcon, WarningIcon } from '../../components';
import type { HomeStackParamList } from '../../navigation/HomeStack';
import { useSimulateOrder } from '../../services/mutations/dev';
import { colors, radius, spacing, textStyles } from '../../theme';

type Route = RouteProp<HomeStackParamList, 'Search'>;

type AssignedPro = {
  id: string;
  name: string;
  initials: string;
  role: string;
  rating: number;
  sessions: number;
  reliability: number;
  skills: string[];
};

const SEARCH_STATUS = [
  'Vérification des disponibilités…',
  'Analyse des profils…',
  'Sélection des meilleures…',
];

const SKILL_LABELS: Record<string, string> = {
  menage: 'Ménage',
  cuisine: 'Cuisine',
  childcare: 'Garde d\'enfants',
};

export function SearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { orderId } = route.params;

  const [phase, setPhase] = useState<'searching' | 'results'>('searching');
  const [statusIndex, setStatusIndex] = useState(0);
  const [assignedPro, setAssignedPro] = useState<AssignedPro | null>(null);

  const simulateOrder = useSimulateOrder();
  const simulateRef = useRef(simulateOrder.mutate);
  simulateRef.current = simulateOrder.mutate;

  const progress = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    progress.setValue(0);
    setPhase('searching');
    setStatusIndex(0);
    setAssignedPro(null);

    const progressAnim = Animated.timing(progress, {
      toValue: 1,
      duration: 5000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    progressAnim.start();

    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.setValue(0);
    spinLoop.start();

    const statusInterval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % SEARCH_STATUS.length);
    }, 1500);

    simulateRef.current(orderId, {
      onSuccess: (order) => {
        if (!isMounted) return;

        const lead = order?.assignments?.find((a: any) => a.isLead) ?? order?.assignments?.[0];
        if (!lead?.professional?.user) return;

        const userName = (lead.professional.user.fullName as string) ?? 'Professionnelle assignée';
        const initials = userName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0]?.toUpperCase() ?? '')
          .join('') || 'PR';

        setAssignedPro({
          id: lead.professional.id,
          name: userName,
          initials,
          role: 'Professionnelle',
          rating: Number(lead.professional.rating ?? 0),
          sessions: Number(lead.professional.totalSessions ?? 0),
          reliability: Math.round(Number(lead.professional.reliability ?? 0)),
          skills: Array.isArray(lead.professional.skills)
            ? lead.professional.skills.map((skill: string) => SKILL_LABELS[skill] ?? skill)
            : [],
        });
      },
    });

    const finishTimeout = setTimeout(() => {
      if (!isMounted) return;
      setPhase('results');
      clearInterval(statusInterval);
      spinLoop.stop();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(statusInterval);
      clearTimeout(finishTimeout);
      progressAnim.stop();
      spinLoop.stop();
    };
  }, [orderId]);

  const spinInterpolate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const statusText = useMemo(() => SEARCH_STATUS[statusIndex], [statusIndex]);

  const navigateToOrder = () => {
    navigation
      .getParent()
      ?.navigate('OrdersTab', {
        screen: 'OrderDetail',
        params: { orderId },
      });
  };

  return (
    <View style={styles.container}>
      <BackHeader
        title="Recherche en cours"
        onBack={() => navigation.goBack()}
        right={
          <Chip
            label={phase === 'searching' ? 'Recherche…' : assignedPro ? '1 trouvée' : 'Aucune trouvée'}
            variant={phase === 'searching' ? 'warning' : assignedPro ? 'success' : 'default'}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {phase === 'searching' ? (
          <View style={styles.searchingWrap}>
            <View style={styles.spinnerWrap}>
              <Animated.View style={[styles.spinner, { transform: [{ rotate: spinInterpolate }] }]} />
              <SearchIcon size={28} color={colors.navy} />
            </View>

            <Text style={styles.searchTitle}>Nous cherchons votre équipe</Text>
            <Text style={styles.searchSubtitle}>
              Professionnelles disponibles dans votre quartier en ce moment…
            </Text>

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressInterpolate }]} />
            </View>

            <Text style={styles.statusText}>{statusText}</Text>
            {simulateOrder.isPending ? (
              <View style={styles.pendingRow}>
                <ActivityIndicator size="small" color={colors.navy} />
                <Text style={styles.pendingText}>Simulation de l&apos;assignation en cours…</Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View>
            <View style={styles.successHeader}>
              {assignedPro ? (
                <CheckIcon size={20} color={colors.success} />
              ) : (
                <WarningIcon size={20} color={colors.warning} />
              )}
              <Text style={styles.successTitle}>
                {assignedPro ? 'Professionnelle trouvée' : 'Aucune professionnelle trouvée'}
              </Text>
            </View>

            {assignedPro ? (
              <Pressable onPress={navigateToOrder}>
                <Card style={[styles.proCard, styles.proCardSelected]}>
                  <View style={styles.proTopRow}>
                    <Avatar initials={assignedPro.initials} size="lg" variant="a" />
                    <View style={styles.proMeta}>
                      <Text style={styles.proName}>{assignedPro.name}</Text>
                      <Text style={styles.proRole}>{assignedPro.role}</Text>
                      <View style={styles.ratingRow}>
                        <StarIcon size={13} color={colors.textMuted} />
                        <Text style={styles.ratingText}>
                          {assignedPro.rating.toFixed(1)} · {assignedPro.sessions} prestations
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.skillsRow}>
                    {assignedPro.skills.map((skill) => (
                      <Chip key={skill} label={skill} variant="navy" />
                    ))}
                    <Chip label={`Fiabilité ${assignedPro.reliability}%`} variant="default" />
                  </View>

                  <View style={styles.selectRow}>
                    <ChevronRightIcon size={14} color={colors.navy} />
                    <Text style={styles.selectText}>Voir la commande et commencer la négociation</Text>
                  </View>
                </Card>
              </Pressable>
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  La simulation a échoué. Revenez à l&apos;écran précédent puis réessayez.
                </Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  searchingWrap: {
    alignItems: 'center',
    paddingTop: 20,
  },
  spinnerWrap: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.border,
    borderTopColor: colors.clay,
    position: 'absolute',
  },
  searchTitle: {
    ...textStyles.h1,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 6,
  },
  searchSubtitle: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 280,
  },
  progressTrack: {
    width: '100%',
    maxWidth: 260,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
    backgroundColor: colors.clay,
  },
  statusText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  pendingRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pendingText: {
    fontSize: 12,
    color: colors.textSec,
    fontFamily: 'DMSans_400Regular',
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  successTitle: {
    ...textStyles.h2,
    color: colors.navy,
  },
  proCard: {
    padding: 16,
    marginBottom: spacing.sm,
  },
  proCardSelected: {
    borderWidth: 2,
    borderColor: colors.navy,
  },
  proTopRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  proMeta: {
    flex: 1,
    gap: 2,
  },
  proName: {
    ...textStyles.h3,
    color: colors.navy,
  },
  proRole: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.textSec,
  },
  ratingText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skillsRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  selectRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectText: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  emptyCard: {
    padding: 16,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSec,
  },
});

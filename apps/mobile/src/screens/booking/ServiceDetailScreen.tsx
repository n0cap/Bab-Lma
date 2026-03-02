import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { BookingStackParamList } from '../../navigation/BookingStack';
import { usePricingEstimate } from '../../services/mutations/orders';
import { BackHeader, Button, Card, Chip, Input, Stepper } from '../../components';
import { ChevronRightIcon, CleaningIcon, InfoIcon, StarOutlineIcon, WarningIcon } from '../../components';
import { colors, radius, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<BookingStackParamList>;
type Route = RouteProp<BookingStackParamList, 'ServiceDetail'>;

type CleanType = 'simple' | 'deep';
type TeamType = 'solo' | 'duo' | 'squad';

type LinearGradientProps = {
  colors: [string, string, string?];
  start: { x: number; y: number };
  end: { x: number; y: number };
  style: unknown;
  children: React.ReactNode;
};

const ExpoLinearGradient = (() => {
  try {
    return require('expo-linear-gradient').LinearGradient as React.ComponentType<LinearGradientProps>;
  } catch {
    return null;
  }
})();

export function ServiceDetailScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { serviceType } = route.params;
  const estimate = usePricingEstimate();

  const [surface, setSurface] = useState(80);
  const [cleanType, setCleanType] = useState<CleanType>('simple');
  const [teamType, setTeamType] = useState<TeamType>('duo');

  const [guests, setGuests] = useState(6);

  const [children, setChildren] = useState(2);
  const [hours, setHours] = useState(3);

  const [instructions, setInstructions] = useState('');
  const [dishes, setDishes] = useState('');
  const [notes, setNotes] = useState('');

  const params = useMemo(() => {
    switch (serviceType) {
      case 'menage':
        return { serviceType, surface, cleanType, teamType };
      case 'cuisine':
        return { serviceType, guests };
      case 'childcare':
        return { serviceType, children, hours };
      default:
        return null;
    }
  }, [serviceType, surface, cleanType, teamType, guests, children, hours]);

  useEffect(() => {
    if (params) estimate.mutate(params);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    if (!params || !estimate.data) return;
    const { serviceType: _st, ...detail } = params;
    nav.navigate('OrderConfirm', {
      serviceType,
      detail: { serviceType, ...detail },
      estimate: estimate.data,
    });
  };

  const helper = serviceType === 'menage'
    ? 'Paiement espèces à la porte · Offre 1er service'
    : 'Prix final confirmé via la négociation';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BackHeader
        title={serviceType === 'menage' ? 'Ménage · Maid' : serviceType === 'cuisine' ? 'Préparation culinaire' : 'Garde d\'enfants'}
        onBack={() => nav.goBack()}
        right={<Chip label="Étape 1/3" variant="navy" />}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {serviceType === 'menage' && (
          <>
            <View style={styles.stepRow}>
              <View style={[styles.stepLine, styles.stepLineActive]} />
              <View style={styles.stepLine} />
              <View style={styles.stepLine} />
            </View>

            <Text style={styles.tLabel}>TYPE DE PRESTATION</Text>
            <View style={styles.typeGrid}>
              <TypeCard
                title="Ménage simple"
                description="Surfaces, sol, salle de bain, cuisine."
                price="dès 80 MAD"
                icon={<CleaningIcon size={18} color={colors.navy} />}
                selected={cleanType === 'simple'}
                onPress={() => setCleanType('simple')}
              />
              <TypeCard
                title="Ménage profond"
                description="Machines professionnelles fournies par Babloo."
                price="dès 150 MAD"
                icon={<StarOutlineIcon size={18} color={colors.navy} />}
                selected={cleanType === 'deep'}
                onPress={() => setCleanType('deep')}
              />
            </View>

            <Text style={styles.tLabel}>SUPERFICIE DU LOGEMENT</Text>
            <Card style={styles.blockCard}>
              <View style={styles.surfaceHeader}>
                <View style={styles.surfaceValueRow}>
                  <Text style={styles.surfaceValue}>{surface}</Text>
                  <Text style={styles.surfaceUnit}>m²</Text>
                </View>
                <Chip label={surface >= 90 ? 'Duo recommandé' : 'Solo recommandé'} variant="navy" />
              </View>
              <Slider
                minimumValue={20}
                maximumValue={300}
                step={5}
                value={surface}
                onValueChange={(v) => setSurface(Math.round(v))}
                minimumTrackTintColor={colors.navy}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.navy}
                accessibilityLabel="Surface en mètres carrés"
              />
              <View style={styles.rangeRow}>
                <Text style={styles.rangeLabel}>Studio · 20m²</Text>
                <Text style={styles.rangeLabel}>Villa · 300m²</Text>
              </View>
            </Card>

            <Text style={styles.tLabel}>TAILLE DE L'ÉQUIPE</Text>
            <View style={styles.teamRow}>
              <TeamCard
                title="Solo"
                subtitle="1 personne"
                price="dès 80 MAD"
                selected={teamType === 'solo'}
                onPress={() => setTeamType('solo')}
              />
              <TeamCard
                title="Duo"
                subtitle="2 personnes"
                price="dès 150 MAD"
                selected={teamType === 'duo'}
                onPress={() => setTeamType('duo')}
              />
              <TeamCard
                title="Squad"
                subtitle="3+ personnes"
                price="dès 220 MAD"
                selected={teamType === 'squad'}
                onPress={() => setTeamType('squad')}
              />
            </View>

            <EstimateCard estimate={estimate.data} />

            <Input
              label="Instructions spécifiques"
              placeholder="Ex: Éviter la chambre du fond, animaux présents, accès digicode…"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
            />
          </>
        )}

        {serviceType === 'cuisine' && (
          <>
            <View style={styles.warningBox}>
              <WarningIcon size={16} color={colors.warning} />
              <Text style={styles.warningText}>Les courses ne sont pas incluses</Text>
            </View>

            <Input
              label="Plat(s) à préparer"
              placeholder="Ex: Tajine de poulet aux olives, salade marocaine, harira pour 6 personnes…"
              value={dishes}
              onChangeText={setDishes}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.tLabel}>POUR COMBIEN DE CONVIVES</Text>
            <Card style={styles.stepperCard}>
              <View>
                <Text style={styles.stepperHint}>Nombre de personnes</Text>
                <Stepper
                  value={guests}
                  onIncrement={() => setGuests((v) => Math.min(20, v + 1))}
                  onDecrement={() => setGuests((v) => Math.max(1, v - 1))}
                  min={1}
                  max={20}
                />
              </View>
              <View style={styles.stepperPriceWrap}>
                <Text style={styles.stepperHint}>Prix minimum</Text>
                <Text style={styles.stepperPrice}>{estimate.data?.floorPrice ?? 0} MAD</Text>
              </View>
            </Card>

            <EstimateCard estimate={estimate.data} compact />
          </>
        )}

        {serviceType === 'childcare' && (
          <>
            <Text style={styles.tLabel}>NOMBRE D'ENFANTS</Text>
            <Card style={styles.stepperCard}>
              <Stepper
                value={children}
                onIncrement={() => setChildren((v) => Math.min(6, v + 1))}
                onDecrement={() => setChildren((v) => Math.max(1, v - 1))}
                min={1}
                max={6}
              />
              <View style={styles.stepperPriceWrap}>
                <Text style={styles.stepperHint}>min. par enfant</Text>
                <Text style={styles.stepperPrice}>80 MAD</Text>
              </View>
            </Card>

            <Text style={styles.tLabel}>DURÉE DE GARDE (HEURES)</Text>
            <Card style={styles.stepperCard}>
              <Stepper
                value={hours}
                onIncrement={() => setHours((v) => Math.min(12, v + 1))}
                onDecrement={() => setHours((v) => Math.max(1, v - 1))}
                min={1}
                max={12}
              />
              <View style={styles.stepperPriceWrap}>
                <Text style={styles.stepperHint}>Total estimé</Text>
                <Text style={styles.stepperPrice}>{estimate.data?.floorPrice ?? 0} MAD</Text>
              </View>
            </Card>

            <Input
              label="Informations complémentaires"
              placeholder="Allergies, médicaments, habitudes…"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <EstimateCard estimate={estimate.data} compact />
          </>
        )}

        {estimate.isPending && <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.md }} />}
      </ScrollView>

      <View style={styles.ctaBar}>
        <Button
          variant="primary"
          label={serviceType === 'menage' ? 'Continuer vers la confirmation' : 'Confirmer la demande'}
          onPress={handleContinue}
          disabled={!estimate.data}
          icon={serviceType === 'menage' ? <ChevronRightIcon size={16} color={colors.white} /> : undefined}
        />
        <Text style={styles.ctaHelper}>{helper}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function TypeCard({
  title,
  description,
  price,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  icon: ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={{ flex: 1 }}>
      <Card style={[styles.typeCard, selected && styles.typeCardSelected]}>
      <View style={styles.typeIcon}>
        {icon}
      </View>
      <Text style={styles.typeTitle}>{title}</Text>
      <Text style={styles.typeDescription}>{description}</Text>
      <Text style={styles.typePrice}>{price}</Text>
      </Card>
    </Pressable>
  );
}

function TeamCard({
  title,
  subtitle,
  price,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  price: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={{ flex: 1 }}>
      <View style={[styles.teamCard, selected && styles.teamCardSelected]}>
      <Text style={styles.teamTitle}>{title}</Text>
      <Text style={styles.teamSub}>{subtitle}</Text>
      <Text style={styles.teamPrice}>{price}</Text>
      </View>
    </Pressable>
  );
}

function EstimateCard({
  estimate,
  compact = false,
}: {
  estimate?: { floorPrice: number; ceiling: number; durationMinutes: { min: number; max: number } };
  compact?: boolean;
}) {
  const content = (
    <View style={styles.estimateContent}>
      <View style={styles.estimateTop}>
        <View>
          <Text style={styles.estimateLabel}>{compact ? 'PLANCHER MINIMUM' : 'PLANCHER MINIMUM GARANTI'}</Text>
          <Text style={styles.estimatePrice}>{estimate?.floorPrice ?? 0} MAD</Text>
          <Text style={styles.estimateNote}>La pro peut proposer plus en négociation</Text>
        </View>
        <View style={styles.estimateDurationBox}>
          <Text style={styles.estimateDurationLabel}>Durée estimée</Text>
          <Text style={styles.estimateDurationValue}>
            {estimate ? `${estimate.durationMinutes.min}–${estimate.durationMinutes.max} min` : '—'}
          </Text>
        </View>
      </View>
      <View style={styles.estimateInfoBar}>
        <InfoIcon size={14} color="rgba(255,255,255,0.55)" />
        <Text style={styles.estimateInfoTextBody}>Paiement uniquement en espèces à la porte. Aucun prépaiement.</Text>
      </View>
    </View>
  );

  if (ExpoLinearGradient) {
    return (
      <ExpoLinearGradient
        colors={[colors.navy, colors.navyMid, colors.navyMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.estimateCard}
      >
        {content}
      </ExpoLinearGradient>
    );
  }

  return <View style={styles.estimateCard}>{content}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 5,
  },
  stepLine: {
    height: 3,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    flex: 1,
  },
  stepLineActive: {
    backgroundColor: colors.clay,
  },
  tLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: 10,
    marginTop: 2,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  typeCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 16,
  },
  typeCardSelected: {
    borderColor: colors.navy,
    backgroundColor: 'rgba(14,20,66,0.02)',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeTitle: {
    color: colors.navy,
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 3,
  },
  typeDescription: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: 'DMSans_500Medium',
  },
  typePrice: {
    color: colors.clay,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    marginTop: 10,
  },
  blockCard: {
    marginBottom: 2,
  },
  surfaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  surfaceValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  surfaceValue: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 38,
    lineHeight: 40,
  },
  surfaceUnit: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 5,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  rangeLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
  },
  teamRow: {
    flexDirection: 'row',
    gap: 10,
  },
  teamCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  teamCardSelected: {
    borderColor: colors.navy,
    backgroundColor: 'rgba(14,20,66,0.03)',
  },
  teamTitle: {
    color: colors.navy,
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  teamSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  teamPrice: {
    color: colors.clay,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    marginTop: 6,
  },
  warningBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(176,107,0,0.25)',
    backgroundColor: colors.warningBg,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
    flex: 1,
  },
  stepperCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperHint: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 4,
  },
  stepperPriceWrap: {
    alignItems: 'flex-end',
  },
  stepperPrice: {
    color: colors.clay,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
  },
  estimateCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  estimateContent: {
    padding: 20,
    gap: 12,
  },
  estimateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  estimateLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 5,
  },
  estimatePrice: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    lineHeight: 34,
  },
  estimateNote: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginTop: 2,
  },
  estimateDurationBox: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 96,
    alignItems: 'flex-end',
  },
  estimateDurationLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
  },
  estimateDurationValue: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    marginTop: 2,
  },
  estimateInfoBar: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  estimateInfoText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'DMSans_500Medium',
  },
  estimateInfoTextBody: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'DMSans_500Medium',
    flex: 1,
  },
  ctaBar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 28,
    gap: spacing.sm,
  },
  ctaHelper: {
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
});

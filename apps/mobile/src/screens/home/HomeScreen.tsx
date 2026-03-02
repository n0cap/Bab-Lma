import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/HomeStack';
import type { MainTabsParamList } from '../../navigation/MainTabs';
import { LocationModal } from '../../components/LocationModal';
import {
  ArrowRightIcon,
  BabysittingIcon,
  ChevronDownIcon,
  CleaningIcon,
  CookingIcon,
  ElectricalIcon,
  ITIcon,
  LocationPinIcon,
  PlumbingIcon,
} from '../../components';
import { colors, radius, shadows, spacing, textStyles } from '../../theme';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabsParamList>
>;

type ServiceTile = {
  key: 'menage' | 'cuisine' | 'childcare';
  title: string;
  sub: string;
};

const ACTIVE_SERVICES: ServiceTile[] = [
  { key: 'menage', title: 'Ménage', sub: 'Maison · Bureau' },
  { key: 'cuisine', title: 'Cuisine', sub: 'Chef à domicile' },
  { key: 'childcare', title: 'Baby-sitting', sub: 'Garde fiable' },
];

const COMING_SOON = ['Plomberie', 'Électricité', 'Assistance IT'] as const;

const ACTIVE_SERVICE_ICONS = {
  menage: CleaningIcon,
  cuisine: CookingIcon,
  childcare: BabysittingIcon,
} as const;

const DISABLED_SERVICE_ICONS = {
  Plomberie: PlumbingIcon,
  Électricité: ElectricalIcon,
  'Assistance IT': ITIcon,
} as const;

export function HomeScreen() {
  const nav = useNavigation<Nav>();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedZone, setSelectedZone] = useState('Agdal');
  const selectedCity = selectedZone === 'Salé Médina' || selectedZone === 'Tabriquet' ? 'Salé' : 'Rabat';

  return (
    <View style={styles.container}>
      <View style={styles.headerSurface}>
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => setLocationModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Adresse de service"
        >
          <LocationPinIcon size={16} color={colors.clay} />
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>ADRESSE DE SERVICE</Text>
            <Text style={styles.locationValue}>{`${selectedZone}, ${selectedCity}`}</Text>
          </View>
          <ChevronDownIcon size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable
          style={({ pressed }) => [styles.promoCard, pressed && styles.promoPressed]}
          onPress={() => nav.navigate('ServiceDetail', { serviceType: 'menage' })}
          accessibilityRole="button"
          accessibilityLabel="Réserver un service ménage"
        >
          <View style={styles.promoRingLarge} />
          <View style={styles.promoRingSmall} />
          <Text style={styles.promoLabel}>OFFRE DE BIENVENUE</Text>
          <Text style={styles.promoTitle}>Votre 1er service Maid est offert</Text>
          <Text style={styles.promoSub}>Sans engagement · Paiement espèces à la porte</Text>
          <View style={styles.promoCta}>
            <View style={styles.promoCtaContent}>
              <Text style={styles.promoCtaText}>Réserver maintenant</Text>
              <ArrowRightIcon size={14} color={colors.white} />
            </View>
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>De quoi avez-vous besoin?</Text>

        <View style={styles.grid}>
          {ACTIVE_SERVICES.map((service) => (
            <Pressable
              key={service.key}
              style={({ pressed }) => [styles.serviceCard, pressed && styles.serviceCardPressed]}
              onPress={() => nav.navigate('ServiceDetail', { serviceType: service.key })}
              accessibilityRole="button"
              accessibilityLabel={`${service.title} — ${service.sub}`}
            >
              <View style={styles.serviceDot} />
              <View style={styles.serviceIconBox}>
                {React.createElement(ACTIVE_SERVICE_ICONS[service.key], { size: 24, color: colors.navy })}
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceSub}>{service.sub}</Text>
            </Pressable>
          ))}
          {COMING_SOON.map((title) => (
            <View key={title} style={[styles.serviceCard, styles.serviceCardDisabled]}>
              <View style={[styles.serviceIconBox, styles.serviceIconBoxDisabled]}>
                {React.createElement(DISABLED_SERVICE_ICONS[title], { size: 24, color: colors.textMuted })}
              </View>
              <Text style={styles.serviceTitleDisabled}>{title}</Text>
              <Text style={styles.serviceSub}>Bientôt</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <LocationModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        selectedZone={selectedZone}
        onSelectZone={(zone) => {
          setSelectedZone(zone);
          setLocationModalVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerSurface: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  locationPill: {
    backgroundColor: colors.bg,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    fontSize: 9,
  },
  locationValue: {
    color: colors.navy,
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  promoCard: {
    borderRadius: radius.xl,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: colors.navy,
    ...shadows.md,
  },
  promoPressed: {
    transform: [{ scale: 0.98 }],
  },
  promoRingLarge: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 130,
    height: 130,
    borderRadius: radius.full,
    borderWidth: 24,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  promoRingSmall: {
    position: 'absolute',
    right: 26,
    bottom: -18,
    width: 78,
    height: 78,
    borderRadius: radius.full,
    borderWidth: 18,
    borderColor: 'rgba(240,131,90,0.18)',
  },
  promoLabel: {
    color: colors.clayLight,
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 6,
  },
  promoTitle: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
  },
  promoSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 16,
  },
  promoCta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.clay,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  promoCtaText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  promoCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    width: '31.4%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(14,20,66,0.06)',
    position: 'relative',
    ...shadows.sm,
  },
  serviceCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  serviceDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.success,
  },
  serviceIconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(14,20,66,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceIconBoxDisabled: {
    backgroundColor: colors.bg,
  },
  serviceTitle: {
    color: colors.navy,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    textAlign: 'center',
  },
  serviceTitleDisabled: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    textAlign: 'center',
  },
  serviceSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  serviceCardDisabled: {
    opacity: 0.38,
    shadowOpacity: 0,
    elevation: 0,
  },
});

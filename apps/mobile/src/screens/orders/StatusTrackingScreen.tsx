import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Avatar, BackHeader, Card, Chip } from '../../components';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { colors, radius, spacing, textStyles } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'StatusTracking'>;
type Nav = NativeStackNavigationProp<OrdersStackParamList>;

const MOCK_TIMELINE = [
  { label: 'Confirmée', time: '10:15' },
  { label: 'En route', time: '11:05' },
  { label: 'Arrivée', time: '11:30' },
];

export function StatusTrackingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [activeStep, setActiveStep] = useState(0);
  const pulse = useRef(new Animated.Value(1)).current;

  const order = route.params ?? {
    orderId: 'ORD-X7K2P',
    serviceType: 'Ménage · Duo',
    proName: 'Fatima Zahra',
    eta: '25 min',
    price: 320,
    address: 'Agdal, Rabat',
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => Math.min(prev + 1, MOCK_TIMELINE.length - 1));
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    pulse.setValue(1);
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 700, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

  const headerTitle = useMemo(() => `Commande ${order.orderId}`, [order.orderId]);

  return (
    <View style={styles.container}>
      <BackHeader
        title={headerTitle}
        onBack={() => navigation.goBack()}
        right={<Chip label="Confirmé" variant="success" />}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.sectionTitle}>Suivi en temps réel</Text>

          {MOCK_TIMELINE.map((step, index) => {
            const done = index < activeStep;
            const isActive = index === activeStep;
            const color = done ? colors.success : isActive ? colors.clay : colors.borderStrong;

            return (
              <View key={step.label} style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  {isActive ? (
                    <Animated.View style={[styles.dot, styles.dotActive, { opacity: pulse }]} />
                  ) : (
                    <View style={[styles.dot, { backgroundColor: color }]} />
                  )}
                  {index < MOCK_TIMELINE.length - 1 ? (
                    <View style={[styles.line, { backgroundColor: done ? colors.success : colors.border }]} />
                  ) : null}
                </View>

                <View style={styles.timelineText}>
                  <Text style={[styles.stepLabel, (done || isActive) && styles.stepLabelStrong]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepTime}>{done || isActive ? step.time : '--:--'}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Votre professionnelle</Text>
          <View style={styles.proRow}>
            <Avatar initials="FZ" size="lg" variant="a" />
            <View style={styles.proMeta}>
              <Text style={styles.proName}>{order.proName}</Text>
              <Text style={styles.proRole}>Coordinatrice · En route</Text>
            </View>
            <Chip label="En route" variant="warning" />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Détails de la commande</Text>
          <DetailRow label="Service" value={order.serviceType} />
          <DetailRow label="Prix" value={`${order.price} MAD`} />
          <DetailRow label="Adresse" value={order.address} />
          <DetailRow label="ETA" value={order.eta} />
        </Card>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing['2xl'],
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineColumn: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginTop: 4,
  },
  dotActive: {
    width: 10,
    height: 10,
    backgroundColor: colors.clay,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginTop: 4,
    marginBottom: 2,
  },
  timelineText: {
    flex: 1,
    paddingBottom: 14,
  },
  stepLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: colors.textMuted,
  },
  stepLabelStrong: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
  },
  stepTime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  proMeta: {
    flex: 1,
  },
  proName: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    color: colors.navy,
  },
  proRole: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    color: colors.textSec,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  detailLabel: {
    ...textStyles.body,
    color: colors.textSec,
  },
  detailValue: {
    ...textStyles.body,
    color: colors.navy,
    fontFamily: 'DMSans_600SemiBold',
    textAlign: 'right',
    flexShrink: 1,
  },
});

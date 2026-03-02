import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Button, Card } from '../../components';
import { CheckIcon, ClockIcon } from '../../components';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { colors, spacing, textStyles } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'OrderConfirmed'>;
type Nav = NativeStackNavigationProp<OrdersStackParamList>;

export function OrderConfirmedScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const order = route.params ?? {
    orderId: 'ORD-X7K2P',
    serviceType: 'Ménage · Duo',
    proName: 'Fatima Zahra',
    eta: '25 min',
    price: 320,
    address: 'Agdal, Rabat',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CheckIcon size={48} color={colors.success} />
        <Text style={styles.title}>Commande confirmée !</Text>
        <Text style={styles.subtitle}>Votre prestation est en route</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.summaryTitle}>Résumé de la commande</Text>
          <Row label="Service" value={order.serviceType} />
          <Row label="Professionnelle" value={order.proName} />
          <Row label="Arrivée estimée" value={order.eta} />
          <Row label="Prix" value={`${order.price} MAD`} />
          <Row label="Adresse" value={order.address} />
        </Card>
      </ScrollView>

      <View style={styles.ctaBar}>
        <Button
          variant="primary"
          label="Suivre ma commande"
          icon={<ClockIcon size={14} color={colors.white} />}
          onPress={() => navigation.navigate('StatusTracking', order)}
        />
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 52,
    paddingBottom: spacing.lg,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
    marginBottom: 4,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  summaryTitle: {
    ...textStyles.h3,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 5,
  },
  rowLabel: {
    ...textStyles.body,
    color: colors.textSec,
  },
  rowValue: {
    ...textStyles.body,
    color: colors.navy,
    fontFamily: 'DMSans_600SemiBold',
    textAlign: 'right',
    flexShrink: 1,
  },
  ctaBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Button } from './Button';
import { colors, radius, spacing } from '../theme';

interface NegotiationBarProps {
  floorPrice: number;
  onSendOffer: (amount: number) => void;
  onAcceptOffer?: () => void;
  pendingOfferFromOther?: { id: string; amount: number } | null;
  isSending: boolean;
  collapsed?: boolean;
}

const STEP = 5;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700;

export function NegotiationBar({
  floorPrice,
  onSendOffer,
  onAcceptOffer,
  pendingOfferFromOther,
  isSending,
  collapsed = false,
}: NegotiationBarProps) {
  const ceiling = useMemo(() => Math.round(floorPrice * 2.5), [floorPrice]);
  const [amount, setAmount] = useState(floorPrice);

  const snappedAmount = useMemo(() => {
    const stepped = Math.round(amount / STEP) * STEP;
    return Math.max(floorPrice, Math.min(ceiling, stepped));
  }, [amount, floorPrice, ceiling]);

  const presets = [
    { label: 'Plancher', value: floorPrice },
    { label: '+10%', value: Math.round(floorPrice * 1.1) },
    { label: '+20%', value: Math.round(floorPrice * 1.2) },
    { label: '+30%', value: Math.round(floorPrice * 1.3) },
  ];

  return (
    <View style={[styles.container, IS_SMALL_SCREEN && styles.containerSmall]}>
      {pendingOfferFromOther ? (
        <View style={styles.pendingBox}>
          <View>
            <Text style={styles.pendingLabel}>Offre reçue</Text>
            <Text style={styles.pendingAmount}>{pendingOfferFromOther.amount} MAD</Text>
          </View>
          <Button
            variant="xs"
            label="Accepter"
            onPress={onAcceptOffer ?? (() => undefined)}
            disabled={isSending}
          />
        </View>
      ) : null}

      <Text
        style={[styles.heroAmount, IS_SMALL_SCREEN && styles.heroAmountSmall]}
        accessibilityLabel={`Montant sélectionné : ${snappedAmount} MAD`}
      >
        {snappedAmount} MAD
      </Text>

      {!collapsed ? (
        <>
          <Slider
            style={[styles.slider, IS_SMALL_SCREEN && styles.sliderSmall]}
            minimumValue={floorPrice}
            maximumValue={ceiling}
            step={STEP}
            value={snappedAmount}
            onValueChange={setAmount}
            minimumTrackTintColor={colors.navy}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.navy}
            accessibilityLabel={`Prix de l'offre : ${snappedAmount} MAD`}
          />
          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>{floorPrice} MAD</Text>
            <Text style={styles.rangeText}>{ceiling} MAD</Text>
          </View>

          <View style={styles.presetRow}>
            {presets.map((preset) => (
              <Pressable
                key={preset.label}
                style={[
                  styles.presetBtn,
                  IS_SMALL_SCREEN && styles.presetBtnSmall,
                  preset.value === snappedAmount && styles.presetBtnActive,
                ]}
                onPress={() => setAmount(preset.value)}
                accessibilityRole="button"
                accessibilityLabel={`${preset.label} ${preset.value} MAD`}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    IS_SMALL_SCREEN && styles.presetLabelSmall,
                    preset.value === snappedAmount && styles.presetLabelActive,
                  ]}
                >
                  {preset.label}
                </Text>
                <Text
                  style={[
                    styles.presetValue,
                    IS_SMALL_SCREEN && styles.presetValueSmall,
                    preset.value === snappedAmount && styles.presetLabelActive,
                  ]}
                >
                  {preset.value} MAD
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}

      <Button
        variant="clay"
        label={`Proposer ${snappedAmount} MAD`}
        onPress={() => onSendOffer(snappedAmount)}
        disabled={isSending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  containerSmall: {
    paddingVertical: spacing.sm,
  },
  pendingBox: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.successBg,
    borderWidth: 1.5,
    borderColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingLabel: {
    color: colors.success,
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
  },
  pendingAmount: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
  },
  heroAmount: {
    textAlign: 'center',
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
  },
  heroAmountSmall: {
    fontSize: 24,
  },
  slider: {
    width: '100%',
    height: 32,
  },
  sliderSmall: {
    height: 28,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  rangeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetBtn: {
    flex: 1,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  presetBtnSmall: {
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  presetBtnActive: {
    borderColor: colors.navy,
    backgroundColor: 'rgba(14,20,66,0.07)',
  },
  presetLabel: {
    color: colors.navy,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },
  presetValue: {
    color: colors.textSec,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
  },
  presetLabelSmall: {
    fontSize: 10,
  },
  presetValueSmall: {
    fontSize: 10,
  },
  presetLabelActive: {
    color: colors.navy,
  },
});

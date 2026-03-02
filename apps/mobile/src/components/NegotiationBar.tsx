import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Button } from './Button';
import { InfoIcon } from './icons';
import { colors, radius, spacing, textStyles } from '../theme';

interface NegotiationBarProps {
  floorPrice: number;
  onSendOffer: (amount: number) => void;
  onAcceptOffer?: () => void;
  pendingOfferFromOther?: { id: string; amount: number } | null;
  isSending: boolean;
}

const STEP = 5;

export function NegotiationBar({
  floorPrice,
  onSendOffer,
  onAcceptOffer,
  pendingOfferFromOther,
  isSending,
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

  const deltaPct = Math.max(0, Math.round(((snappedAmount - floorPrice) / floorPrice) * 100));

  return (
    <View style={styles.container}>
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

      <View style={styles.topRow}>
        <View>
          <Text style={styles.tLabel}>PLANCHER MINIMUM</Text>
          <Text style={styles.floorText}>{floorPrice} MAD</Text>
        </View>
        <View style={styles.propositionBox}>
          <Text style={styles.tLabel}>VOTRE PROPOSITION</Text>
          {deltaPct > 0 ? <Text style={styles.delta}>+{deltaPct}%</Text> : <Text style={styles.deltaMuted}>Base</Text>}
        </View>
      </View>

      <Text style={styles.heroAmount} accessibilityLabel={`Montant sélectionné : ${snappedAmount} MAD`}>
        {snappedAmount} MAD
      </Text>

      <Slider
        style={styles.slider}
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
            style={[styles.presetBtn, preset.value === snappedAmount && styles.presetBtnActive]}
            onPress={() => setAmount(preset.value)}
            accessibilityRole="button"
            accessibilityLabel={`${preset.label} ${preset.value} MAD`}
          >
            <Text style={[styles.presetLabel, preset.value === snappedAmount && styles.presetLabelActive]}>{preset.label}</Text>
            <Text style={[styles.presetValue, preset.value === snappedAmount && styles.presetLabelActive]}>{preset.value} MAD</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.manualRow}>
        <Text style={styles.manualLabel}>Saisir un montant :</Text>
        <TextInput
          value={String(snappedAmount)}
          onChangeText={(text) => {
            const parsed = parseInt(text, 10);
            if (!Number.isNaN(parsed)) setAmount(parsed);
          }}
          keyboardType="number-pad"
          style={styles.manualInput}
          accessibilityLabel={`Saisir ${snappedAmount} MAD`}
        />
        <Text style={styles.manualUnit}>MAD</Text>
      </View>

      <View style={styles.infoBar}>
        <InfoIcon size={14} color={colors.textMuted} />
        <Text style={styles.infoText}>Le prix minimum garantit une rémunération juste.</Text>
      </View>

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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  tLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    fontSize: 9,
  },
  floorText: {
    color: colors.textMuted,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    marginTop: 2,
  },
  propositionBox: {
    alignItems: 'flex-end',
  },
  delta: {
    color: colors.success,
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    marginTop: 2,
  },
  deltaMuted: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 2,
  },
  heroAmount: {
    textAlign: 'center',
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
  },
  slider: {
    width: '100%',
    height: 32,
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
    flexWrap: 'wrap',
  },
  presetBtn: {
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
    paddingVertical: 7,
    paddingHorizontal: 10,
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
  presetLabelActive: {
    color: colors.navy,
  },
  manualRow: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  manualLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
  },
  manualInput: {
    flex: 1,
    textAlign: 'right',
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  manualUnit: {
    color: colors.textSec,
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
  },
  infoBar: {
    borderRadius: radius.sm,
    backgroundColor: 'rgba(14,20,66,0.04)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'DMSans_500Medium',
  },
});

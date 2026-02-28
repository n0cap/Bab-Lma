import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors, textStyles, spacing } from '../theme';

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
  const ceiling = Math.round(floorPrice * 2.5);
  const [amount, setAmount] = useState(floorPrice);

  // Snap to nearest STEP
  const snappedAmount = Math.round(amount / STEP) * STEP;

  return (
    <View style={styles.container}>
      {/* Show pending offer from other party */}
      {pendingOfferFromOther && (
        <View style={styles.pendingOffer}>
          <Text style={[textStyles.body, { color: colors.navy }]}>
            Offre reçue: {pendingOfferFromOther.amount} MAD
          </Text>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAcceptOffer}
            disabled={isSending}
          >
            <Text style={styles.acceptBtnText}>Accepter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Price slider */}
      <View style={styles.sliderRow}>
        <Text style={[textStyles.body, { color: colors.textMuted }]}>{floorPrice}</Text>
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
        />
        <Text style={[textStyles.body, { color: colors.textMuted }]}>{ceiling}</Text>
      </View>

      {/* Amount display + send */}
      <View style={styles.sendRow}>
        <Text style={[textStyles.h2, { color: colors.clay }]}>
          {snappedAmount} MAD
        </Text>
        <TouchableOpacity
          style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
          onPress={() => onSendOffer(snappedAmount)}
          disabled={isSending}
        >
          <Text style={styles.sendBtnText}>Proposer</Text>
        </TouchableOpacity>
      </View>
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
  },
  pendingOffer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.clayTint,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  acceptBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  acceptBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sendBtn: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
});

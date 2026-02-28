import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useSubmitRating } from '../../services/mutations/orders';
import { colors, textStyles, spacing } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'Rating'>;
type Nav = NativeStackNavigationProp<OrdersStackParamList>;

export function RatingScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const submitRating = useSubmitRating();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (stars < 1) return;
    submitRating.mutate(
      { orderId, stars, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          Alert.alert('Merci !', 'Merci pour votre évaluation !', [
            { text: 'OK', onPress: () => nav.goBack() },
          ]);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error?.message ?? 'Impossible d\'envoyer l\'évaluation';
          Alert.alert('Erreur', msg);
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity
        onPress={() => nav.goBack()}
        style={styles.back}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
      </TouchableOpacity>

      <Text
        style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.xl }]}
        accessibilityRole="header"
      >
        Évaluer le service
      </Text>

      {/* Star picker */}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => setStars(n)}
            style={styles.starBtn}
            accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}
            accessibilityRole="button"
          >
            <Text style={[styles.star, n <= stars && styles.starActive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[textStyles.body, { color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl }]}>
        {stars > 0 ? `${stars} étoile${stars > 1 ? 's' : ''}` : 'Appuyez pour noter'}
      </Text>

      {/* Comment */}
      <TextInput
        style={styles.input}
        placeholder="Laissez un commentaire (optionnel)"
        placeholderTextColor={colors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        maxLength={500}
        textAlignVertical="top"
        accessibilityLabel="Laissez un commentaire (optionnel)"
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (stars < 1 || submitRating.isPending) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={stars < 1 || submitRating.isPending}
        accessibilityRole="button"
        accessibilityLabel="Envoyer l'évaluation"
      >
        {submitRating.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitBtnText}>Envoyer l'évaluation</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  back: { marginBottom: spacing.xl },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: spacing.sm,
  },
  starBtn: {
    padding: 4,
    minHeight: 48,
  },
  star: {
    fontSize: 40,
    color: colors.border,
  },
  starActive: {
    color: colors.warning,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.lg,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 100,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  submitBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});

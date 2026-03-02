import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '../../navigation/OrdersStack';
import { useSubmitRating } from '../../services/mutations/orders';
import { Button, Card } from '../../components';
import { StarIcon, StarOutlineIcon } from '../../components';
import { colors, radius, spacing, textStyles } from '../../theme';

type Route = RouteProp<OrdersStackParamList, 'Rating'>;
type Nav = NativeStackNavigationProp<OrdersStackParamList>;

const TIP_OPTIONS = [10, 20, 30, 50];

type LinearGradientProps = {
  colors: [string, string];
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

export function RatingScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { orderId } = route.params;
  const submitRating = useSubmitRating();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState<number | null>(null);

  useEffect(() => {
    nav.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      nav.getParent()?.setOptions({
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      });
    };
  }, [nav]);

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

  const teaser = (
    <View style={styles.teaserContent}>
      <Text style={styles.teaserLabel}>NOUVEAU · FIDÉLISATION</Text>
      <Text style={styles.teaserTitle}>Engagez votre équipe sur le long terme</Text>
      <Text style={styles.teaserSub}>CNSS incluse · Planning flexible · Professionnelles que vous connaissez déjà</Text>
      <View style={styles.avatarRow}>
        <View style={styles.avatarPill}><Text style={styles.avatarText}>FZ</Text></View>
        <View style={[styles.avatarPill, styles.avatarPillOffset]}><Text style={styles.avatarText}>KB</Text></View>
        <Text style={styles.avatarNames}>Fatima Z. · Khadija B.</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">Prestation terminée</Text>
        <Text style={styles.headerSub}>Évaluez votre expérience pour aider la communauté</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.tLabel}>NOTE GLOBALE</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setStars(n)}
                style={styles.starBtn}
                accessibilityLabel={`${n} étoile${n > 1 ? 's' : ''}`}
                accessibilityRole="button"
              >
                {n <= stars ? (
                  <StarIcon size={32} color={colors.navy} />
                ) : (
                  <StarOutlineIcon size={32} color="#D8D7EE" />
                )}
              </Pressable>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.tLabel}>COMMENTAIRE</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Travail soigné, professionnelles très agréables et ponctuelles…"
            placeholderTextColor={colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
            accessibilityLabel="Laissez un commentaire (optionnel)"
          />
        </Card>

        <Card>
          <Text style={styles.tLabel}>POURBOIRE (OPTIONNEL)</Text>
          <View style={styles.tipGrid}>
            {TIP_OPTIONS.map((amount) => (
              <Pressable
                key={amount}
                onPress={() => setTip((v) => (v === amount ? null : amount))}
                style={[styles.tipBtn, tip === amount && styles.tipBtnActive]}
                accessibilityRole="button"
                accessibilityLabel={`${amount} MAD`}
              >
                <Text style={[styles.tipText, tip === amount && styles.tipTextActive]}>{amount} MAD</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Pressable onPress={() => Alert.alert('Fidélisation', 'Bientôt')} accessibilityRole="button" accessibilityLabel="Fidélisation bientôt">
          {ExpoLinearGradient ? (
            <ExpoLinearGradient
              colors={[colors.navy, '#2D1F8A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.teaserCard}
            >
              {teaser}
            </ExpoLinearGradient>
          ) : (
            <View style={styles.teaserCard}>{teaser}</View>
          )}
        </Pressable>
      </ScrollView>

      <View style={styles.ctaBar}>
        <View style={styles.ctaRow}>
          <View style={{ flex: 1 }}>
            <Button
              variant="ghost"
              label="Fidéliser l'équipe"
              onPress={() => Alert.alert('Fidélisation', 'Bientôt')}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Button
              variant="primary"
              label="Terminer"
              onPress={handleSubmit}
              disabled={stars < 1 || submitRating.isPending}
              loading={submitRating.isPending}
            />
          </View>
        </View>
        {submitRating.isPending ? <ActivityIndicator color={colors.navy} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 52,
    paddingHorizontal: spacing.lg,
    paddingBottom: 18,
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.navy,
    marginBottom: 3,
  },
  headerSub: {
    ...textStyles.body,
    color: colors.textSec,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  tLabel: {
    ...textStyles.label,
    color: colors.textMuted,
    marginBottom: 10,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  starBtn: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInput: {
    borderWidth: 0,
    padding: 0,
    color: colors.navy,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
    minHeight: 66,
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipBtn: {
    width: '23%',
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.clay,
    backgroundColor: colors.clayTint,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tipBtnActive: {
    backgroundColor: colors.clay,
    borderStyle: 'solid',
  },
  tipText: {
    color: colors.clay,
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  tipTextActive: {
    color: colors.white,
  },
  teaserCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.navy,
    padding: 22,
  },
  teaserContent: {
    gap: 7,
  },
  teaserLabel: {
    color: colors.clayLight,
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: 'DMSans_700Bold',
  },
  teaserTitle: {
    color: colors.white,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
    lineHeight: 24,
  },
  teaserSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_500Medium',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPill: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.proA,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(14,20,66,0.6)',
  },
  avatarPillOffset: {
    marginLeft: -8,
    backgroundColor: colors.proB,
  },
  avatarText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },
  avatarNames: {
    marginLeft: 10,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
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
  ctaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
});

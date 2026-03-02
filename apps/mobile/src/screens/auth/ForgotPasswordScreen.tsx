import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useOtpRequest } from '../../services/mutations/auth';
import { BackHeader, Button, Input } from '../../components';
import { CheckIcon } from '../../components';
import { colors, fonts, radius, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

function withAlpha(hexColor: string, alpha: number) {
  const hex = hexColor.replace('#', '');
  const bigint = Number.parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ForgotPasswordScreen() {
  const nav = useNavigation<Nav>();
  const otpRequest = useOtpRequest();
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!phone) return;
    setErrorMessage(null);

    try {
      const { challengeId } = await otpRequest.mutateAsync({ phone, purpose: 'reset' });
      nav.navigate('Otp', { challengeId, phone });
    } catch {
      setErrorMessage('Impossible d\'envoyer le code. Vérifiez le numéro.');
      Alert.alert('Erreur', 'Impossible d\'envoyer le code. Vérifiez le numéro.');
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title="Récupération" onBack={() => nav.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            Mot de passe oublié<Text style={styles.dot}>?</Text>
          </Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro, nous vous envoyons un code de réinitialisation
          </Text>
        </View>

        <Input
          value={phone}
          onChangeText={setPhone}
          label="Numéro de téléphone"
          placeholder="+212 6XX XXX XXX"
          inputMode="tel"
          style={styles.field}
        />

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {showSuccess ? (
          <View style={styles.successCard}>
            <CheckIcon size={28} color={colors.success} />
            <Text style={styles.successTitle}>E-mail envoyé !</Text>
            <Text style={styles.successText}>
              Vérifiez votre boîte de réception et suivez le lien pour réinitialiser votre mot de passe.
            </Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          label="Envoyer le lien"
          onPress={handleSubmit}
          loading={otpRequest.isPending}
          disabled={otpRequest.isPending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  intro: {
    marginBottom: 28,
  },
  title: {
    ...textStyles.display,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  dot: {
    color: colors.clay,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
  },
  field: {
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withAlpha(colors.error, 0.28),
    backgroundColor: withAlpha(colors.error, 0.08),
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  errorIcon: {
    width: 18,
    fontFamily: fonts.dmSans.bold,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.dmSans.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.error,
  },
  successCard: {
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.successBg,
    borderRadius: radius.lg,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 14,
    color: colors.navy,
    marginBottom: 4,
  },
  successText: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.success,
    textAlign: 'center',
  },
});

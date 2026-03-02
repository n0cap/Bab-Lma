import React, { useState } from 'react';
import {
  Alert,
  Pressable,
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

export function SignInPhoneScreen() {
  const nav = useNavigation<Nav>();
  const otpRequest = useOtpRequest();
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!phone) return;
    setErrorMessage(null);
    try {
      const { challengeId } = await otpRequest.mutateAsync({ phone, purpose: 'login' });
      nav.navigate('Otp', { challengeId, phone });
    } catch {
      setErrorMessage('Aucun compte associé à ce numéro.');
      Alert.alert('Erreur', 'Impossible d\'envoyer le code. Vérifiez le numéro.');
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title="Se connecter" onBack={() => nav.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            Bon retour<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Connectez-vous avec votre numéro</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Numéro de téléphone</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefixPill}>
              <Text style={styles.prefixText}>🇲🇦 +212</Text>
            </View>
            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="06 00 00 00 00"
              inputMode="tel"
              style={styles.phoneInputWrap}
            />
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          label="Continuer"
          onPress={handleSubmit}
          loading={otpRequest.isPending}
          disabled={otpRequest.isPending}
        />

        <Pressable
          onPress={() => nav.navigate('SignUpPhone')}
          style={styles.footerLink}
          accessibilityRole="button"
          accessibilityLabel="Inscrivez-vous"
        >
          <Text style={styles.footerLinkText}>Pas encore de compte ? Inscrivez-vous</Text>
        </Pressable>
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
  label: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 12,
    color: colors.navy,
    marginBottom: 6,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  prefixPill: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 13,
    color: colors.navy,
  },
  phoneInputWrap: {
    flex: 1,
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
  footerLink: {
    marginTop: spacing.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinkText: {
    ...textStyles.body,
    color: colors.clay,
  },
});

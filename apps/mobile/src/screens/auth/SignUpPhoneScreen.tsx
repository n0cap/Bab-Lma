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
import { BackHeader, Button, Chip, Input, ProgressBar } from '../../components';
import { InfoIcon } from '../../components';
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

export function SignUpPhoneScreen() {
  const nav = useNavigation<Nav>();
  const otpRequest = useOtpRequest();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showExistingHint, setShowExistingHint] = useState(false);

  const handleSubmit = async () => {
    if (!fullName || !phone) return;
    try {
      const { challengeId } = await otpRequest.mutateAsync({ phone, purpose: 'signup' });
      nav.navigate('Otp', { challengeId, phone, fullName });
    } catch {
      setShowExistingHint(true);
      Alert.alert('Erreur', 'Impossible d\'envoyer le code. Vérifiez le numéro.');
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title="Créer un compte" onBack={() => nav.goBack()} />

      <View style={styles.progressWrap}>
        <ProgressBar progress={1} color={colors.clay} />
        <Chip label="Étape 2 / 2" variant="default" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            Votre numéro<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Ajoutez votre numéro pour sécuriser votre compte</Text>
        </View>

        <View style={styles.fields}>
          <Input
            value={fullName}
            onChangeText={setFullName}
            label="Nom complet"
            placeholder="Votre nom complet"
            style={styles.field}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Numéro de téléphone</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefixPill}>
                <Text style={styles.prefixText}>🇲🇦 +212</Text>
              </View>
              <Input
                value={phone}
                onChangeText={(value) => {
                  if (showExistingHint) setShowExistingHint(false);
                  setPhone(value);
                }}
                placeholder="06 00 00 00 00"
                inputMode="tel"
                style={styles.phoneInputWrap}
              />
            </View>
          </View>
        </View>

        {showExistingHint ? (
          <View style={styles.infoBanner}>
            <InfoIcon size={14} color={colors.navy} />
            <Text style={styles.infoText}>
              Ce numéro est déjà utilisé.{' '}
              <Text style={styles.infoLink} onPress={() => nav.navigate('SignInPhone')}>
                Se connecter ?
              </Text>
            </Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          label="Recevoir le code"
          onPress={handleSubmit}
          loading={otpRequest.isPending}
          disabled={otpRequest.isPending}
        />

        <Pressable
          onPress={() => nav.navigate('SignInPhone')}
          style={styles.footerLink}
          accessibilityRole="button"
          accessibilityLabel="Connectez-vous"
        >
          <Text style={styles.footerLinkText}>Déjà un compte ? Connectez-vous</Text>
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
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
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
  fields: {
    marginBottom: spacing.md,
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: withAlpha(colors.navy, 0.16),
    backgroundColor: withAlpha(colors.navy, 0.06),
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.dmSans.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.navy,
  },
  infoLink: {
    fontFamily: fonts.dmSans.bold,
    textDecorationLine: 'underline',
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

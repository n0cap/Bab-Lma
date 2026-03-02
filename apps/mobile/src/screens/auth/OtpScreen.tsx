import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../contexts/AuthContext';
import { useOtpRequest, useOtpVerify } from '../../services/mutations/auth';
import { BackHeader, Button } from '../../components';
import { CheckIcon } from '../../components';
import { colors, fonts, radius, shadows, spacing, textStyles } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, 'Otp'>;

function withAlpha(hexColor: string, alpha: number) {
  const hex = hexColor.replace('#', '');
  const bigint = Number.parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function maskPhone(phone: string) {
  const onlyDigits = phone.replace(/\D/g, '');
  if (onlyDigits.length < 2) return phone;
  const start = onlyDigits.slice(0, Math.max(onlyDigits.length - 2, 0));
  const end = onlyDigits.slice(-2);
  const masked = `${start.slice(0, 3)} ·· ·· ·· ${end}`.trim();
  return `+${masked}`;
}

export function OtpScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { signIn } = useAuth();
  const otpVerify = useOtpVerify();
  const otpRequest = useOtpRequest();

  const [challengeId, setChallengeId] = useState(route.params.challengeId);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Code incorrect. Veuillez réessayer.');
  const [countdown, setCountdown] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);

  const boxRefs = useRef<Array<TextInput | null>>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const code = useMemo(() => digits.join(''), [digits]);
  const canSubmit = code.length === 6;

  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleChangeDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setDigits((current) => {
        const next = [...current];
        next[index] = '';
        return next;
      });
      setHasError(false);
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const next = ['', '', '', '', '', ''];
      for (let i = 0; i < 6; i += 1) {
        next[i] = chars[i] ?? '';
      }
      setDigits(next);
      const nextFocus = Math.min(chars.length, 5);
      boxRefs.current[nextFocus]?.focus();
      setHasError(false);
      return;
    }

    setDigits((current) => {
      const next = [...current];
      next[index] = cleaned;
      return next;
    });

    setHasError(false);

    if (index < 5) {
      boxRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key !== 'Backspace') return;

    if (!digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
      setDigits((current) => {
        const next = [...current];
        next[index - 1] = '';
        return next;
      });
    }
  };

  const handleVerify = async () => {
    if (!canSubmit) return;

    setHasError(false);

    try {
      const tokens = await otpVerify.mutateAsync({
        challengeId,
        code,
        ...(route.params.fullName ? { fullName: route.params.fullName } : {}),
      });

      setShowSuccess(true);
      setTimeout(() => {
        void signIn(tokens);
      }, 850);
    } catch {
      setErrorMessage('Code invalide ou expiré.');
      setHasError(true);
      triggerShake();
      Alert.alert('Erreur', 'Code invalide ou expiré');
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || otpRequest.isPending) return;

    try {
      const result = await otpRequest.mutateAsync({ phone: route.params.phone, purpose: 'login' });
      setChallengeId(result.challengeId);
      setDigits(['', '', '', '', '', '']);
      setHasError(false);
      setCountdown(30);
      boxRefs.current[0]?.focus();
      Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé.');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code.');
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title="Vérification" onBack={() => nav.goBack()} />

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <View style={styles.iconRing}>
            <Text style={styles.iconGlyph}>⌁</Text>
          </View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            Code envoyé{"\n"}par SMS
          </Text>
          <Text style={styles.subtitle}>Entrez le code à 6 chiffres envoyé au</Text>
          <Text style={styles.phoneText}>{maskPhone(route.params.phone)}</Text>
        </View>

        <Animated.View
          style={[
            styles.otpRow,
            {
              transform: [
                {
                  translateX: shakeAnim.interpolate({
                    inputRange: [-1, 1],
                    outputRange: [-8, 8],
                  }),
                },
              ],
            },
          ]}
        >
          {digits.map((digit, index) => {
            const isFocused = activeIndex === index;
            const isFilled = Boolean(digit);
            return (
              <TextInput
                key={`otp-${index}`}
                ref={(ref) => {
                  boxRefs.current[index] = ref;
                }}
                style={[
                  styles.otpBox,
                  isFocused && styles.otpBoxFocused,
                  isFilled && styles.otpBoxFilled,
                  hasError && styles.otpBoxError,
                ]}
                value={digit}
                onChangeText={(value) => handleChangeDigit(index, value)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex((current) => (current === index ? null : current))}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                maxLength={1}
                accessibilityLabel={`Chiffre ${index + 1} du code`}
              />
            );
          })}
        </Animated.View>

        {hasError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>!</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Button
          variant="primary"
          label="Vérifier le code"
          onPress={handleVerify}
          loading={otpVerify.isPending}
          disabled={otpVerify.isPending || !canSubmit}
          style={styles.verifyButton}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendHint}>Pas reçu le code ?</Text>
          <Pressable
            onPress={handleResend}
            disabled={countdown > 0 || otpRequest.isPending}
            accessibilityRole="button"
            accessibilityLabel="Renvoyer le code"
          >
            <Text style={[styles.resendText, (countdown > 0 || otpRequest.isPending) && styles.resendTextDisabled]}>
              {countdown > 0 ? `Renvoyer dans ${countdown}s` : 'Renvoyer maintenant'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => nav.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Modifier le numéro"
        >
          <Text style={styles.changeNumberText}>Modifier le numéro</Text>
        </Pressable>
      </View>

      {showSuccess ? (
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successBadge}>
              <CheckIcon size={32} color={colors.white} />
            </View>
            <Text style={styles.successTitle}>Identité confirmée</Text>
            <Text style={styles.successSub}>Bienvenue sur Babloo !</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  iconWrap: {
    marginBottom: 28,
  },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    shadowColor: colors.navy,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 8,
    borderColor: withAlpha(colors.navy, 0.08),
  },
  iconGlyph: {
    color: colors.white,
    fontSize: 26,
    marginTop: -1,
  },
  intro: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
    marginBottom: 6,
  },
  phoneText: {
    fontFamily: fonts.fraunces.bold,
    fontSize: 20,
    color: colors.navy,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  otpRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 10,
    marginBottom: 14,
  },
  otpBox: {
    width: 46,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontFamily: fonts.fraunces.bold,
    fontSize: 26,
    color: colors.navy,
    ...shadows.sm,
  },
  otpBoxFocused: {
    borderColor: colors.clay,
    backgroundColor: colors.bg,
    transform: [{ translateY: -1 }],
    shadowColor: colors.clay,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  otpBoxFilled: {
    borderColor: withAlpha(colors.navy, 0.22),
    backgroundColor: colors.bgAlt,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: withAlpha(colors.error, 0.08),
  },
  errorBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: withAlpha(colors.error, 0.28),
    backgroundColor: withAlpha(colors.error, 0.08),
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.lg,
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
    fontFamily: fonts.dmSans.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.error,
  },
  verifyButton: {
    marginBottom: spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  resendHint: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  resendText: {
    fontFamily: fonts.dmSans.semiBold,
    fontSize: 14,
    color: colors.clay,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  resendTextDisabled: {
    color: colors.textMuted,
  },
  changeNumberText: {
    fontFamily: fonts.dmSans.regular,
    fontSize: 14,
    color: colors.textSec,
    textDecorationLine: 'underline',
  },
  successOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  successCard: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.clay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.lg,
    shadowColor: colors.clay,
    borderWidth: 10,
    borderColor: withAlpha(colors.clay, 0.1),
  },
  successTitle: {
    ...textStyles.h1,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSub: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
  },
});

import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '../../services/mutations/auth';
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

export function SignInEmailScreen() {
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setErrorMessage(null);
    try {
      const tokens = await login.mutateAsync({ email, password });
      await signIn(tokens);
    } catch {
      setErrorMessage('E-mail ou mot de passe incorrect.');
      Alert.alert('Erreur', 'Identifiants invalides');
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
          <Text style={styles.subtitle}>Connectez-vous avec votre e-mail</Text>
        </View>

        <View style={styles.fields}>
          <Input
            value={email}
            onChangeText={setEmail}
            label="Adresse e-mail"
            placeholder="votre@email.com"
            inputMode="email"
            style={styles.field}
          />

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Mot de passe</Text>
              <Pressable
                onPress={() => nav.navigate('ForgotPassword')}
                style={styles.forgotLink}
                accessibilityRole="button"
                accessibilityLabel="Mot de passe oublié"
              >
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>

            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="password"
                accessibilityLabel="Mot de passe"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Masquer' : 'Afficher'}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁'}</Text>
              </Pressable>
            </View>
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
          label="Se connecter"
          onPress={handleSubmit}
          loading={login.isPending}
          disabled={login.isPending}
        />

        <Pressable
          onPress={() => nav.navigate('SignUpEmail')}
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
  fields: {
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  label: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 12,
    color: colors.navy,
  },
  forgotLink: {
    minHeight: 24,
    justifyContent: 'center',
  },
  forgotText: {
    fontFamily: fonts.dmSans.bold,
    fontSize: 11,
    color: colors.clay,
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    paddingRight: 44,
    backgroundColor: colors.surface,
    color: colors.navy,
    fontFamily: fonts.dmSans.regular,
    fontSize: 14,
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    height: 30,
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeText: {
    fontSize: 14,
    color: colors.textMuted,
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

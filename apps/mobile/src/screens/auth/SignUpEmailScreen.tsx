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
import { useSignup } from '../../services/mutations/auth';
import { BackHeader, Button, Chip, Input, ProgressBar } from '../../components';
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

export function SignUpEmailScreen() {
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const signup = useSignup();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!fullName || !email || !password) return;
    setErrorMessage(null);
    try {
      const tokens = await signup.mutateAsync({ fullName, email, password });
      await signIn(tokens);
    } catch {
      setErrorMessage('Cet e-mail est déjà utilisé.');
      Alert.alert('Erreur', 'Impossible de créer le compte. Vérifiez vos informations.');
    }
  };

  return (
    <View style={styles.container}>
      <BackHeader title="Créer un compte" onBack={() => nav.goBack()} />

      <View style={styles.progressWrap}>
        <ProgressBar progress={0.5} color={colors.clay} />
        <Chip label="Étape 1 / 2" variant="default" />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.title} accessibilityRole="header">
            Créer un compte<Text style={styles.dot}>.</Text>
          </Text>
          <Text style={styles.subtitle}>Commençons avec votre e-mail</Text>
        </View>

        <View style={styles.fields}>
          <Input
            value={fullName}
            onChangeText={setFullName}
            label="Nom complet"
            placeholder="Votre nom complet"
            style={styles.field}
          />

          <Input
            value={email}
            onChangeText={setEmail}
            label="Adresse e-mail"
            placeholder="votre@email.com"
            inputMode="email"
            style={styles.field}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Créer un mot de passe</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                textContentType="newPassword"
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
            <Text style={styles.hint}>8 caractères minimum</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                textContentType="newPassword"
                accessibilityLabel="Confirmer le mot de passe"
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowConfirmPassword((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={showConfirmPassword ? 'Masquer' : 'Afficher'}
              >
                <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁'}</Text>
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
          label="Continuer"
          onPress={handleSubmit}
          loading={signup.isPending}
          disabled={signup.isPending}
        />

        <Pressable
          onPress={() => nav.navigate('SignInEmail')}
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
  hint: {
    marginTop: 6,
    fontFamily: fonts.dmSans.regular,
    fontSize: 11,
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

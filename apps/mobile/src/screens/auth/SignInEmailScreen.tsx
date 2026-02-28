import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../contexts/AuthContext';
import { useLogin } from '../../services/mutations/auth';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function SignInEmailScreen() {
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    try {
      const tokens = await login.mutateAsync({ email, password });
      await signIn(tokens);
    } catch {
      Alert.alert('Erreur', 'Identifiants invalides');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
        <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
      </TouchableOpacity>

      <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.lg }]}>
        Connexion par email
      </Text>

      <TextInput
        style={styles.input}
        placeholder="votre@email.com"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <TextInput
        style={styles.input}
        placeholder="Votre mot de passe"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="password"
      />

      <TouchableOpacity onPress={() => nav.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: spacing.lg }}>
        <Text style={[textStyles.body, { color: colors.clay }]}>Mot de passe oublié ?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.btn, login.isPending && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={login.isPending}
      >
        {login.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Se connecter</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => nav.navigate('SignUpEmail')} style={{ marginTop: spacing.lg }}>
        <Text style={[textStyles.body, { color: colors.clay }]}>
          Pas encore de compte ? Inscrivez-vous
        </Text>
      </TouchableOpacity>
    </View>
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
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../contexts/AuthContext';
import { useSignup } from '../../services/mutations/auth';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function SignUpEmailScreen() {
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const signup = useSignup();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!fullName || !email || !password) return;
    try {
      const tokens = await signup.mutateAsync({ fullName, email, password });
      await signIn(tokens);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le compte. Vérifiez vos informations.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.back} accessibilityRole="button" accessibilityLabel="Retour">
        <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
      </TouchableOpacity>

      <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.lg }]} accessibilityRole="header">
        Inscription par email
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Votre nom complet"
        placeholderTextColor={colors.textMuted}
        value={fullName}
        onChangeText={setFullName}
        textContentType="name"
        accessibilityLabel="Nom complet"
      />

      <TextInput
        style={styles.input}
        placeholder="votre@email.com"
        placeholderTextColor={colors.textMuted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        accessibilityLabel="Adresse email"
      />

      <TextInput
        style={styles.input}
        placeholder="Mot de passe (8 caractères min.)"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        accessibilityLabel="Mot de passe"
      />

      <TouchableOpacity
        style={[styles.btn, signup.isPending && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={signup.isPending}
        accessibilityRole="button"
        accessibilityLabel="Créer un compte"
      >
        {signup.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Créer un compte</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => nav.navigate('SignInEmail')} style={{ marginTop: spacing.lg, alignSelf: 'center', minHeight: 48 }} accessibilityRole="button" accessibilityLabel="Connectez-vous">
        <Text style={[textStyles.body, { color: colors.clay }]}>
          Déjà un compte ? Connectez-vous
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
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../contexts/AuthContext';
import { useOtpVerify, useOtpRequest } from '../../services/mutations/auth';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Route = RouteProp<AuthStackParamList, 'Otp'>;

export function OtpScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { signIn } = useAuth();
  const otpVerify = useOtpVerify();
  const otpRequest = useOtpRequest();
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState(route.params.challengeId);

  const handleVerify = async () => {
    if (code.length !== 6) return;
    try {
      const tokens = await otpVerify.mutateAsync({
        challengeId,
        code,
        ...(route.params.fullName ? { fullName: route.params.fullName } : {}),
      });
      await signIn(tokens);
    } catch {
      Alert.alert('Erreur', 'Code invalide ou expiré');
    }
  };

  const handleResend = async () => {
    try {
      const result = await otpRequest.mutateAsync({ phone: route.params.phone, purpose: 'login' });
      setChallengeId(result.challengeId);
      setCode('');
      Alert.alert('Code renvoyé', 'Un nouveau code a été envoyé.');
    } catch {
      Alert.alert('Erreur', 'Impossible de renvoyer le code.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.back} accessibilityRole="button" accessibilityLabel="Retour">
        <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
      </TouchableOpacity>

      <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.sm }]} accessibilityRole="header">
        Code de vérification
      </Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginBottom: spacing.xl }]}>
        Entrez le code envoyé au {route.params.phone}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        accessibilityLabel="Code de vérification"
      />

      <TouchableOpacity
        style={[styles.btn, otpVerify.isPending && styles.btnDisabled]}
        onPress={handleVerify}
        disabled={otpVerify.isPending}
        accessibilityRole="button"
        accessibilityLabel="Vérifier"
      >
        {otpVerify.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Vérifier</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleResend}
        disabled={otpRequest.isPending}
        style={{ marginTop: spacing.lg, alignSelf: 'center', minHeight: 48 }}
        accessibilityRole="button"
        accessibilityLabel="Renvoyer le code"
      >
        <Text style={[textStyles.body, { color: otpRequest.isPending ? colors.textMuted : colors.clay }]}>
          Renvoyer le code
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
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: 8,
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

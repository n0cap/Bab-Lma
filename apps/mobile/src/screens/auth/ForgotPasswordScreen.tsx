import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { useOtpRequest } from '../../services/mutations/auth';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function ForgotPasswordScreen() {
  const nav = useNavigation<Nav>();
  const otpRequest = useOtpRequest();
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!phone) return;
    try {
      const { challengeId } = await otpRequest.mutateAsync({ phone, purpose: 'reset' });
      nav.navigate('Otp', { challengeId, phone });
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le code. Vérifiez le numéro.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.back}>
        <Text style={[textStyles.body, { color: colors.navy }]}>← Retour</Text>
      </TouchableOpacity>

      <Text style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.sm }]}>
        Mot de passe oublié
      </Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginBottom: spacing.xl }]}>
        Entrez votre numéro de téléphone pour recevoir un code de vérification.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="+212 6XX XXX XXX"
        placeholderTextColor={colors.textMuted}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
      />

      <TouchableOpacity
        style={[styles.btn, otpRequest.isPending && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={otpRequest.isPending}
      >
        {otpRequest.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Recevoir un code</Text>
        )}
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
    marginBottom: spacing.lg,
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

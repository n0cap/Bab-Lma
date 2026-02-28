import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import { colors, textStyles, spacing } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function AuthEntryScreen() {
  const nav = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <Text style={[textStyles.display, { color: colors.navy }]} accessibilityRole="header">Babloo</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: 8, marginBottom: 36 }]}>
        Vos services à domicile
      </Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => nav.navigate('SignInEmail')} accessibilityRole="button" accessibilityLabel="Connexion par email">
        <Text style={styles.btnPrimaryText}>Connexion par email</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnOutline} onPress={() => nav.navigate('SignInPhone')} accessibilityRole="button" accessibilityLabel="Connexion par téléphone">
        <Text style={styles.btnOutlineText}>Connexion par téléphone</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => nav.navigate('SignUpEmail')} style={{ marginTop: spacing.lg, minHeight: 48 }} accessibilityRole="button" accessibilityLabel="Inscrivez-vous">
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  btnPrimaryText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  btnOutline: {
    width: '100%',
    borderColor: colors.navy,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOutlineText: {
    color: colors.navy,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});

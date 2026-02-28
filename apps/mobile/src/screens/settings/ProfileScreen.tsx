import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useMe } from '../../services/queries/user';
import { useUpdateProfile } from '../../services/mutations/user';
import { useAuth } from '../../contexts/AuthContext';
import { colors, textStyles, spacing } from '../../theme';

export function ProfileScreen() {
  const { data: user, isLoading } = useMe();
  const updateProfile = useUpdateProfile();
  const { signOut } = useAuth();

  const [fullName, setFullName] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (user?.fullName) {
      setFullName(user.fullName);
    }
  }, [user?.fullName]);

  const handleSave = () => {
    const trimmed = fullName.trim();
    if (!trimmed) return;
    updateProfile.mutate(
      { fullName: trimmed },
      {
        onSuccess: () => {
          setDirty(false);
          Alert.alert('Profil mis à jour !');
        },
        onError: (err: any) => {
          Alert.alert('Erreur', err?.response?.data?.error?.message ?? 'Une erreur est survenue.');
        },
      },
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui, déconnecter',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  };

  if (isLoading || !user) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text
        style={[textStyles.h1, { color: colors.navy, marginBottom: spacing.xl }]}
        accessibilityRole="header"
      >
        Mon profil
      </Text>

      {/* Full Name (editable) */}
      <View style={styles.field}>
        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={(v) => { setFullName(v); setDirty(true); }}
          placeholder="Votre nom complet"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Nom complet"
        />
      </View>

      {/* Phone (read-only) */}
      <View style={styles.field}>
        <Text style={styles.label}>Téléphone</Text>
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>{user.phone ?? '—'}</Text>
        </View>
      </View>

      {/* Email (read-only) */}
      <View style={styles.field}>
        <Text style={styles.label}>E-mail</Text>
        <View style={styles.readOnly}>
          <Text style={styles.readOnlyText}>{user.email ?? '—'}</Text>
        </View>
      </View>

      {/* Save button */}
      {dirty && (
        <TouchableOpacity
          style={[styles.saveBtn, updateProfile.isPending && styles.btnDisabled]}
          onPress={handleSave}
          disabled={updateProfile.isPending}
          accessibilityRole="button"
          accessibilityLabel="Enregistrer les modifications"
        >
          {updateProfile.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveBtnText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Se déconnecter"
      >
        <Text style={styles.logoutBtnText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 12,
    color: colors.textSec,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
  },
  readOnly: {
    backgroundColor: colors.bgAlt,
    borderRadius: 14,
    padding: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: colors.textMuted,
  },
  saveBtn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: colors.white,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
  logoutBtn: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutBtnText: {
    color: colors.error,
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
  },
});

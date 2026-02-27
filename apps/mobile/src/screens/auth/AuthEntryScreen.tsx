import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

export function AuthEntryScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.display, { color: colors.navy }]}>Babloo</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: 8 }]}>
        Connexion / Inscription
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

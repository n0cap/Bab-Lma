import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles } from '../../theme';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={[textStyles.h1, { color: colors.navy }]}>Accueil</Text>
      <Text style={[textStyles.body, { color: colors.textSec, marginTop: 8 }]}>
        Vos services à domicile
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
